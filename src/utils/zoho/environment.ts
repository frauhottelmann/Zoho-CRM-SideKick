// Everything the extension needs to know about the Zoho CRM data center and org a page belongs to.
// Pure functions: used by the page side (tools) and by the background worker.

export interface ZohoEnvironment {
    /** Page origin, e.g. https://crm.zoho.eu */
    origin: string;
    /** Data center suffix, e.g. "com", "eu", "com.au", "ca" */
    domainSuffix: string;
    isSandbox: boolean;
    /** Zoho Accounts server used for OAuth, e.g. https://accounts.zoho.eu */
    accountsDomain: string;
    /** REST API server, e.g. https://www.zohoapis.eu */
    apiDomain: string;
    /** Path prefix of the CRM web app including an optional org segment, e.g. "/crm/org20012345/" or "/crm/" */
    crmBasePath: string;
    /** Storage key that separates tokens of different data centers / sandboxes */
    key: string;
}

export interface ZohoRecordLocation {
    /** Module name as it appears in the URL (Zoho "module_name", e.g. "Potentials" for Deals) */
    moduleTab: string;
    recordId: string;
}

const HOST_REGEX = /^(crm|crmsandbox)\.(zoho|zohocloud)\.([a-z]+(?:\.[a-z]+)?)$/;

// First path segments after /crm/ that are app routes, not an org segment
const CRM_ROUTES = new Set([
    "tab",
    "settings",
    "home",
    "search",
    "specific",
    "bp",
    "marketplace",
    "dashboards",
    "reports"
]);

export function getZohoEnvironment(url: string | undefined | null): ZohoEnvironment | null {
    if (!url) return null;

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }
    if (parsed.protocol !== "https:") return null;

    const match = parsed.hostname.match(HOST_REGEX);
    if (!match) return null;

    const [, subdomain, brand, domainSuffix] = match;
    const isSandbox = subdomain === "crmsandbox";

    const segments = parsed.pathname.split("/").filter(Boolean);
    let crmBasePath = "/crm/";
    if (segments[0] === "crm" && segments[1] && !CRM_ROUTES.has(segments[1]) && !segments[1].includes(".")) {
        crmBasePath = `/crm/${segments[1]}/`;
    }

    return {
        origin: parsed.origin,
        domainSuffix,
        isSandbox,
        accountsDomain: `https://accounts.${brand}.${domainSuffix}`,
        apiDomain: `https://${isSandbox ? "sandbox" : "www"}.zohoapis.${domainSuffix}`,
        crmBasePath,
        key: `${isSandbox ? "sandbox" : "prod"}-${domainSuffix}`
    };
}

export function isZohoCrmPage(url: string): boolean {
    const env = getZohoEnvironment(url);
    return !!env && new URL(url).pathname.startsWith("/crm/");
}

export function getRecordLocation(url: string): ZohoRecordLocation | null {
    let pathname: string;
    try {
        pathname = new URL(url).pathname;
    } catch {
        return null;
    }
    const match = pathname.match(/\/tab\/([^/]+)\/(\d{6,})(?:\/|$)/);
    if (!match) return null;
    return { moduleTab: decodeURIComponent(match[1]), recordId: match[2] };
}

export function getSetupUrl(env: ZohoEnvironment, setupPath: string): string {
    return `${env.origin}${env.crmBasePath}settings/${setupPath}`;
}
