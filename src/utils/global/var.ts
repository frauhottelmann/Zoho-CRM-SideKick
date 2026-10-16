export class Env {
    static DEBUG = true;
}

export const DEBUG_MODE = false;

export const PROJECT_PREFIX = "zoho-sidekick-";

export const STORAGE_ListName = "processListOrdered";
export const STORAGE_ForegroundPanes = "isPanesForeground";

export const STORAGE_DontShowInfo = "dontShowInfo";
export type TYPE_DontShowInfo = { [infoName: string]: boolean };

export const DRAWER_CONTAINER_ID = "drawercontainer";

export const APPLICATION_NAME = "Zoho CRM SideKick";
export const MAIN_MENU_ID = "zoho-sidekick-mainmenu";

export const MESSAGE_SOURCE_WebPage = `${PROJECT_PREFIX}-webPage`;
export const MESSAGE_SOURCE_Content = `${PROJECT_PREFIX}-content`;

export const BRIDGE_SUFFIX = "bridge-up";
export const EXTENSION_STORAGE_SUFFIX = "extensionid";

export const isFirefox = typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
