// Page-side access to Zoho CRM. The tools run inside the Zoho CRM tab, so requests go to the CRM's own
// API endpoints on the same origin and use the session the user is already logged in with: no OAuth
// client, no extra login, and every tab works with the org it shows.

import { useCallback, useEffect, useRef, useState } from "react";

import { getZohoEnvironment } from "./environment";
import type { ZohoApiRequest, ZohoApiResponse, ZohoField, ZohoLayout, ZohoModule, ZohoRelatedList } from "./types";

// API versions the web app serves on its own origin, newest first. The first one that answers is kept.
const API_VERSIONS = ["v8", "v7", "v6", "v2.2"];
let workingVersion: string | null = null;

function getCookie(pattern: RegExp): string | null {
    for (const cookie of document.cookie.split(";")) {
        const [name, ...value] = cookie.trim().split("=");
        if (pattern.test(name)) return decodeURIComponent(value.join("="));
    }
    return null;
}

function getSessionHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: "application/json" };

    // Zoho protects its endpoints with a CSRF token stored in a cookie and echoed in this header
    const csrfToken = getCookie(/^CSRF_TOKEN$/i) ?? getCookie(/csrf/i);
    if (csrfToken) headers["X-ZCSRF-TOKEN"] = `crmcsrfparam=${csrfToken}`;

    // Users who belong to several orgs: target the org shown in this tab
    const orgId = (window as any).crmZgid ?? window.location.pathname.match(/^\/crm\/org(\d+)\//)?.[1];
    if (orgId) headers["X-CRM-ORG"] = String(orgId);

    return headers;
}

async function fetchVersion<T>(version: string, request: ZohoApiRequest): Promise<ZohoApiResponse<T> | null> {
    const url = new URL(`${window.location.origin}/crm/${version}/${request.path}`);
    Object.entries(request.params ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });

    const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: getSessionHeaders()
    });

    // This version is not served here: let the caller try the next one
    if (response.status === 404 && !workingVersion) return null;
    if (response.status === 204) return { ok: true, status: 204, data: null as T };
    if (response.status === 401) {
        return { ok: false, status: 401, error: "The Zoho session expired. Reload the page and log in again." };
    }

    const isJson = response.headers.get("content-type")?.includes("json");
    const data = isJson ? await response.json().catch(() => null) : null;
    if (!isJson && !workingVersion) return null;

    if (!response.ok) {
        return {
            ok: false,
            status: response.status,
            data,
            error: data?.message ?? data?.code ?? `Request failed with status ${response.status}.`
        };
    }
    return { ok: true, status: response.status, data };
}

export async function zohoRequest<T = any>(
    path: string,
    params?: ZohoApiRequest["params"]
): Promise<ZohoApiResponse<T>> {
    if (!getZohoEnvironment(window.location.href)) {
        return { ok: false, status: 0, error: "This tab is not a Zoho CRM page." };
    }
    if (!path || /[:?#]|\.\./.test(path) || path.startsWith("/")) {
        return { ok: false, status: 0, error: "Invalid API path." };
    }

    try {
        for (const version of workingVersion ? [workingVersion] : API_VERSIONS) {
            const response = await fetchVersion<T>(version, { path, params });
            if (response) {
                if (response.ok) workingVersion = version;
                return response;
            }
        }
        return { ok: false, status: 0, error: "Zoho CRM did not answer on any known API version." };
    } catch (e) {
        return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
    }
}

// Metadata rarely changes while a page is open, so successful answers are cached per tool bundle
const cache = new Map<string, Promise<ZohoApiResponse>>();

function cachedRequest<T>(path: string, params?: ZohoApiRequest["params"]): Promise<ZohoApiResponse<T>> {
    const key = path + JSON.stringify(params ?? {});
    const existing = cache.get(key);
    if (existing) return existing as Promise<ZohoApiResponse<T>>;

    const request = zohoRequest<T>(path, params).then((response) => {
        if (!response.ok) cache.delete(key);
        return response;
    });
    cache.set(key, request);
    return request;
}

export function clearZohoCache() {
    cache.clear();
}

export interface ZohoQueryState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
}

/** Runs a cached GET request whenever `path` changes. A null path means "nothing to load". */
export function useZohoQuery<T, R = any>(
    path: string | null,
    params: ZohoApiRequest["params"] | undefined,
    select: (data: R) => T
): ZohoQueryState<T> {
    const [state, setState] = useState<Omit<ZohoQueryState<T>, "reload">>({
        data: null,
        loading: !!path,
        error: null
    });
    const [reloadCount, setReloadCount] = useState(0);
    const selectRef = useRef(select);
    selectRef.current = select;
    const paramsKey = JSON.stringify(params ?? {});

    useEffect(() => {
        if (!path) {
            setState({ data: null, loading: false, error: null });
            return;
        }
        let cancelled = false;
        setState((prev) => ({ ...prev, loading: true, error: null }));

        cachedRequest<R>(path, params).then((response) => {
            if (cancelled) return;
            if (response.ok) {
                setState({
                    data: response.data ? selectRef.current(response.data) : null,
                    loading: false,
                    error: null
                });
            } else {
                setState({
                    data: null,
                    loading: false,
                    error: response.error ?? "Unknown error."
                });
            }
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, paramsKey, reloadCount]);

    const reload = useCallback(() => {
        clearZohoCache();
        setReloadCount((count) => count + 1);
    }, []);

    return { ...state, reload };
}

export function useZohoModules() {
    return useZohoQuery<ZohoModule[], { modules: ZohoModule[] }>("settings/modules", undefined, (data) =>
        (data.modules ?? []).filter((module) => module.api_supported)
    );
}

export function useZohoFields(moduleApiName: string | null) {
    return useZohoQuery<ZohoField[], { fields: ZohoField[] }>(
        moduleApiName ? "settings/fields" : null,
        { module: moduleApiName },
        (data) => data.fields ?? []
    );
}

export function useZohoLayouts(moduleApiName: string | null) {
    return useZohoQuery<ZohoLayout[], { layouts: ZohoLayout[] }>(
        moduleApiName ? "settings/layouts" : null,
        { module: moduleApiName },
        (data) => data.layouts ?? []
    );
}

export function useZohoRelatedLists(moduleApiName: string | null) {
    return useZohoQuery<ZohoRelatedList[], { related_lists: ZohoRelatedList[] }>(
        moduleApiName ? "settings/related_lists" : null,
        { module: moduleApiName },
        (data) => data.related_lists ?? []
    );
}

export function useZohoRecord(moduleApiName: string | null, recordId: string | null) {
    return useZohoQuery<Record<string, any>, { data: Record<string, any>[] }>(
        moduleApiName && recordId ? `${encodeURIComponent(moduleApiName)}/${recordId}` : null,
        undefined,
        (data) => data.data?.[0] ?? null
    );
}
