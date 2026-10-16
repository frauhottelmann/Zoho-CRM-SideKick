export interface ZohoAuthStatus {
    hasClientId: boolean;
    loggedIn: boolean;
    /** Redirect URI to register for the client in the Zoho API Console */
    redirectUri: string;
    accountsDomain: string | null;
    error?: string;
}

export interface ZohoApiRequest {
    /** Path relative to /crm/v8/, e.g. "settings/modules" */
    path: string;
    params?: Record<string, string | number | boolean | undefined | null>;
}

export interface ZohoApiResponse<T = any> {
    ok: boolean;
    status: number;
    data?: T;
    error?: string;
    authRequired?: boolean;
}

export interface ZohoModule {
    id: string;
    api_name: string;
    module_name: string;
    singular_label: string;
    plural_label: string;
    generated_type: string;
    api_supported: boolean;
    creatable?: boolean;
    editable?: boolean;
    viewable?: boolean;
    [key: string]: any;
}

export interface ZohoPicklistValue {
    display_value: string;
    actual_value: string;
    id?: string;
    [key: string]: any;
}

export interface ZohoField {
    id: string;
    api_name: string;
    field_label: string;
    display_label?: string;
    data_type: string;
    json_type?: string;
    custom_field: boolean;
    length?: number;
    system_mandatory?: boolean;
    read_only?: boolean;
    field_read_only?: boolean;
    visible?: boolean;
    unique?: { casesensitive?: string } | null;
    pick_list_values?: ZohoPicklistValue[];
    lookup?: { module?: { api_name: string } } | null;
    [key: string]: any;
}

export interface ZohoLayout {
    id: string;
    name: string;
    display_label?: string;
    status?: string;
    visible?: boolean;
    sections?: { display_label: string; api_name?: string; fields?: ZohoField[] }[];
    [key: string]: any;
}

export interface ZohoRelatedList {
    id: string;
    api_name: string;
    display_label: string;
    module?: { api_name: string } | null;
    type?: string;
    visible?: boolean;
    [key: string]: any;
}
