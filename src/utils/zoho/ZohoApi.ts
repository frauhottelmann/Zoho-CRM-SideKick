// Page-side access to Zoho CRM. Requests are forwarded to the background worker,
// which owns the OAuth token and performs the actual HTTP call.

import { useCallback, useEffect, useRef, useState } from "react";

import MessageManager from "../global/MessageManager";
import { MessageType } from "../types/Message";
import type {
    ZohoApiRequest,
    ZohoApiResponse,
    ZohoAuthStatus,
    ZohoField,
    ZohoLayout,
    ZohoModule,
    ZohoRelatedList
} from "./types";

export function zohoRequest<T = any>(path: string, params?: ZohoApiRequest["params"]): Promise<ZohoApiResponse<T>> {
    return MessageManager.sendMessage(MessageType.ZOHO_APIREQUEST, { path, params }).then(
        (response: ZohoApiResponse<T> | undefined) =>
            response ?? { ok: false, status: 0, error: "No answer from the extension background." }
    );
}

export function getAuthStatus(): Promise<ZohoAuthStatus> {
    return MessageManager.sendMessage(MessageType.ZOHO_AUTHSTATUS);
}

export function login(): Promise<ZohoAuthStatus> {
    return MessageManager.sendMessage(MessageType.ZOHO_LOGIN);
}

export function logout(): Promise<ZohoAuthStatus> {
    return MessageManager.sendMessage(MessageType.ZOHO_LOGOUT);
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
    authRequired: boolean;
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
        error: null,
        authRequired: false
    });
    const [reloadCount, setReloadCount] = useState(0);
    const selectRef = useRef(select);
    selectRef.current = select;
    const paramsKey = JSON.stringify(params ?? {});

    useEffect(() => {
        if (!path) {
            setState({ data: null, loading: false, error: null, authRequired: false });
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
                    error: null,
                    authRequired: false
                });
            } else {
                setState({
                    data: null,
                    loading: false,
                    error: response.error ?? "Unknown error.",
                    authRequired: !!response.authRequired
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
