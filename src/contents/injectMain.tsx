import "~utils/global/classNamePrefix";
import type { PlasmoCSConfig, PlasmoCSUIJSXContainer, PlasmoRender } from "plasmo";
import { createRoot } from "react-dom/client";

import { MainScreen } from "~processes/main";
import { ProcessButton } from "~utils/global/.processClass";
import { isZohoCrmPage } from "~utils/zoho/environment";
import { DRAWER_CONTAINER_ID, EXTENSION_STORAGE_SUFFIX, MESSAGE_SOURCE_Content, PROJECT_PREFIX } from "~utils/global/var";

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
    world: "MAIN"
};

var messageListenerReady = false;
// Re-checks the mount conditions once the bridge is ready, even if the page DOM no longer changes
var onListenerReady: (() => void) | null = null;

const onMessage = (event: MessageEvent) => {
    if (event.data?.source === MESSAGE_SOURCE_Content && event.data?.type === `${PROJECT_PREFIX}messageListenerReady`) {
        messageListenerReady = true;
        window.removeEventListener("message", onMessage);
        onListenerReady?.();
    }
};
window.addEventListener("message", onMessage);

export const getRootContainer = () =>
    new Promise((resolve) => {
        let resolved = false;
        const checkAndResolve = () => {
            if (resolved) return;
            const mainContent = document.body;

            // The bridge marks the document right before it starts listening, so this also covers the case
            // where its "ready" message was posted before this script loaded
            const bridgeReady =
                messageListenerReady ||
                document.documentElement.hasAttribute(PROJECT_PREFIX + EXTENSION_STORAGE_SUFFIX);

            if (mainContent && isZohoCrmPage(window.location.href) && bridgeReady) {
                const drawerContainer = document.createElement("div");
                drawerContainer.id = ProcessButton.prefixId + DRAWER_CONTAINER_ID;
                mainContent.append(drawerContainer);
                resolved = true;
                observer.disconnect();
                resolve(drawerContainer);
            }
        };

        const observer = new MutationObserver(checkAndResolve);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        onListenerReady = checkAndResolve;
        checkAndResolve();
    });

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
    createRootContainer // This creates the default root container
}) => {
    const rootContainer = await createRootContainer();

    const root = createRoot(rootContainer, {
        identifierPrefix: ProcessButton.prefixId
    });
    root.render(<MainScreen />);
};

export default () => null;
