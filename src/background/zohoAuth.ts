// OAuth (implicit grant for Zoho "Client-based Applications") and REST API calls for Zoho CRM.
// Runs in the background worker: it holds the tokens and is not subject to the page's CORS rules.

import { STORAGE_ZohoClientId } from "~utils/global/var";
import { ZOHO_DEFAULT_CLIENT_ID } from "~utils/zoho/config";
import { getZohoEnvironment, type ZohoEnvironment } from "~utils/zoho/environment";
import type { ZohoApiRequest, ZohoApiResponse, ZohoAuthStatus } from "~utils/zoho/types";

const STORAGE_TOKEN_PREFIX = "zohoToken:";

// Read-only on purpose: the MVP only displays metadata and records.
export const ZOHO_SCOPES = ["ZohoCRM.settings.READ", "ZohoCRM.modules.READ", "ZohoCRM.users.READ", "ZohoCRM.org.READ"];

interface StoredToken {
    accessToken: string;
    apiDomain: string;
    expiresAt: number;
}

export function getRedirectUri(): string {
    return chrome.identity.getRedirectURL();
}

async function getClientId(): Promise<string | null> {
    const stored = await chrome.storage.sync.get(STORAGE_ZohoClientId);
    const clientId = stored?.[STORAGE_ZohoClientId];
    if (typeof clientId === "string" && clientId.trim()) return clientId.trim();
    return ZOHO_DEFAULT_CLIENT_ID || null;
}

export async function setClientId(clientId: string | null) {
    if (clientId && clientId.trim()) {
        await chrome.storage.sync.set({ [STORAGE_ZohoClientId]: clientId.trim() });
    } else {
        await chrome.storage.sync.remove(STORAGE_ZohoClientId);
    }
    await logoutAll();
}

async function getStoredToken(env: ZohoEnvironment): Promise<StoredToken | null> {
    const key = STORAGE_TOKEN_PREFIX + env.key;
    const stored = (await chrome.storage.local.get(key))?.[key] as StoredToken | undefined;
    if (!stored) return null;
    // Keep a minute of margin so a request does not start with a token that expires mid-flight
    if (stored.expiresAt - 60_000 < Date.now()) {
        await chrome.storage.local.remove(key);
        return null;
    }
    return stored;
}

export async function logout(env: ZohoEnvironment) {
    await chrome.storage.local.remove(STORAGE_TOKEN_PREFIX + env.key);
}

export async function logoutAll() {
    const all = await chrome.storage.local.get();
    const keys = Object.keys(all).filter((key) => key.startsWith(STORAGE_TOKEN_PREFIX));
    if (keys.length) await chrome.storage.local.remove(keys);
}

export async function getAuthStatus(env: ZohoEnvironment | null): Promise<ZohoAuthStatus> {
    const clientId = await getClientId();
    return {
        hasClientId: !!clientId,
        loggedIn: !!env && !!(await getStoredToken(env)),
        redirectUri: getRedirectUri(),
        accountsDomain: env?.accountsDomain ?? null
    };
}

export async function login(env: ZohoEnvironment, interactive: boolean): Promise<ZohoAuthStatus & { error?: string }> {
    const clientId = await getClientId();
    if (!clientId) {
        return { ...(await getAuthStatus(env)), error: "No Zoho client ID configured." };
    }

    const authUrl = new URL(`${env.accountsDomain}/oauth/v2/auth`);
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", ZOHO_SCOPES.join(","));
    authUrl.searchParams.set("redirect_uri", getRedirectUri());

    try {
        const responseUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive });
        if (!responseUrl) throw new Error("The login window was closed.");

        const url = new URL(responseUrl);
        // Zoho returns the token in the fragment; fall back to the query string for errors
        const params = new URLSearchParams(url.hash.replace(/^#/, "") || url.search);
        const error = params.get("error");
        if (error) throw new Error(error);

        const accessToken = params.get("access_token");
        if (!accessToken) throw new Error("Zoho did not return an access token.");

        const expiresIn = parseInt(params.get("expires_in") ?? "3600", 10);
        const token: StoredToken = {
            accessToken,
            // Only trust an API domain that belongs to Zoho; otherwise use the one derived from the page
            apiDomain: isZohoApiDomain(params.get("api_domain")) ? params.get("api_domain")! : env.apiDomain,
            expiresAt: Date.now() + expiresIn * 1000
        };
        await chrome.storage.local.set({ [STORAGE_TOKEN_PREFIX + env.key]: token });

        return await getAuthStatus(env);
    } catch (e) {
        return { ...(await getAuthStatus(env)), error: e instanceof Error ? e.message : String(e) };
    }
}

function isZohoApiDomain(value: string | null): boolean {
    if (!value) return false;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && /^(www|sandbox)\.zohoapis\.[a-z]+(\.[a-z]+)?$/.test(url.hostname);
    } catch {
        return false;
    }
}

export async function apiRequest(env: ZohoEnvironment, request: ZohoApiRequest): Promise<ZohoApiResponse> {
    // Only relative CRM API paths, e.g. "settings/modules" or "Leads/123"
    if (!request?.path || /[:?#]|\.\./.test(request.path) || request.path.startsWith("/")) {
        return { ok: false, status: 0, error: "Invalid API path." };
    }

    let token = await getStoredToken(env);
    if (!token) {
        // A silent login succeeds while the user still has a Zoho session and has consented before
        const status = await login(env, false);
        if (status.loggedIn) token = await getStoredToken(env);
    }
    if (!token) return { ok: false, status: 401, authRequired: true, error: "Not logged in to Zoho." };

    const url = new URL(`${token.apiDomain}/crm/v8/${request.path}`);
    Object.entries(request.params ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: { Authorization: `Zoho-oauthtoken ${token.accessToken}` }
        });

        if (response.status === 401) {
            await logout(env);
            return {
                ok: false,
                status: 401,
                authRequired: true,
                error: "The Zoho session expired. Please log in again."
            };
        }
        if (response.status === 204) {
            return { ok: true, status: 204, data: null };
        }

        const data = await response.json().catch(() => null);
        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                data,
                error: data?.message ?? data?.code ?? `Request failed with status ${response.status}.`
            };
        }
        return { ok: true, status: response.status, data };
    } catch (e) {
        return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
    }
}

export function environmentFromSender(sender: chrome.runtime.MessageSender): ZohoEnvironment | null {
    return getZohoEnvironment(sender.tab?.url ?? sender.url);
}
