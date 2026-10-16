import type { PlasmoCSConfig } from "plasmo";

import RecordViewerProcess from "~processes/recordViewer/tool";
import { buildGetRootContainer } from "~utils/global/toolContentAbstract";

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
export const getRootContainer = buildGetRootContainer(RecordViewerProcess);

export default () => null;
