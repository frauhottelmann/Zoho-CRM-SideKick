import type { PlasmoCSConfig } from "plasmo";

import { isZohoCrmPage } from "~utils/zoho/environment";
import { EXTENSION_STORAGE_SUFFIX, MESSAGE_SOURCE_Content, MESSAGE_SOURCE_WebPage, PROJECT_PREFIX } from "~utils/global/var";

export const config: PlasmoCSConfig = {
    matches: [
        "https://crm.zoho.com/*",
        "https://crm.zoho.eu/*",
        "https://crm.zoho.in/*",
        "https://crm.zoho.com.au/*",
        "https://crm.zoho.jp/*",
        "https://crm.zoho.com.cn/*",
        "https://crm.zoho.sa/*",
        "https://crm.zohocloud.ca/*",
        "https://crmsandbox.zoho.com/*",
        "https://crmsandbox.zoho.eu/*",
        "https://crmsandbox.zoho.in/*",
        "https://crmsandbox.zoho.com.au/*",
        "https://crmsandbox.zoho.jp/*",
        "https://crmsandbox.zoho.com.cn/*",
        "https://crmsandbox.zoho.sa/*",
        "https://crmsandbox.zohocloud.ca/*"
    ],
    run_at: "document_start"
};

window.onload = async () => {
    if (isZohoCrmPage(window.location.href)) {
        // SaveData(chrome.runtime.getURL(""), "extensionUrl");
        storeExtensionId();
        setListener();
    }
};

function storeExtensionId() {
    const id =
        chrome.runtime?.id ?? (chrome.runtime?.getURL ? new URL(chrome.runtime.getURL("")).host : "");
    document.documentElement.setAttribute(PROJECT_PREFIX + EXTENSION_STORAGE_SUFFIX, id);
}

function setListener() {
    window.addEventListener("message", (event) => {
        if (event.source !== window) return;
        if (event.data.source !== MESSAGE_SOURCE_WebPage) return;

        const messageId = event.data.id;

        chrome.runtime.sendMessage({ type: event.data.type, data: event.data.data }, function (response: any) {
            window.postMessage({ id: messageId, source: MESSAGE_SOURCE_Content, response }, "*");
        });
    });

    window.postMessage({ type: `${PROJECT_PREFIX}messageListenerReady`, source: MESSAGE_SOURCE_Content }, "*");
}
