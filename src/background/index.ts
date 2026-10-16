import { getExtensionConfiguration, setExtensionConfiguration } from "~processes/setConfiguration/background";
import { MessageType } from "~utils/types/Message";

import { apiRequest, environmentFromSender, getAuthStatus, login, logout, logoutAll, setClientId } from "./zohoAuth";

chrome.runtime.onMessage.addListener(messagesStation);

function messagesStation(
    message: { type: string; data: any },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) {
    switch (message.type) {
        case MessageType.REFRESHBYPASSCACHE:
            sender.tab && sender.tab.id && chrome.tabs.reload(sender.tab.id, { bypassCache: true });
            return false;
        case MessageType.GETCURRENTTABID:
            sendResponse(sender.tab?.id);
            return true;

        case MessageType.SETCONFIGURATION:
            setExtensionConfiguration(message.data);
            return false;
        case MessageType.GETCONFIGURATION:
            getExtensionConfiguration(message.data).then(sendResponse);
            return true;

        // The Zoho environment always comes from the sender's tab URL, never from the message itself
        case MessageType.ZOHO_AUTHSTATUS:
            getAuthStatus(environmentFromSender(sender)).then(sendResponse);
            return true;
        case MessageType.ZOHO_LOGIN: {
            const env = environmentFromSender(sender);
            if (!env) return false;
            login(env, true).then(sendResponse);
            return true;
        }
        case MessageType.ZOHO_LOGOUT: {
            const env = environmentFromSender(sender);
            if (!env) return false;
            logout(env)
                .then(() => getAuthStatus(env))
                .then(sendResponse);
            return true;
        }
        case MessageType.ZOHO_APIREQUEST: {
            const env = environmentFromSender(sender);
            if (!env) {
                sendResponse({ ok: false, status: 0, error: "This tab is not a Zoho CRM page." });
                return false;
            }
            apiRequest(env, message.data).then(sendResponse);
            return true;
        }

        // Only the extension's own pages (popup) may change the client or clear every session
        case MessageType.ZOHO_SETCLIENTID:
            if (sender.tab) return false;
            setClientId(message.data?.clientId ?? null)
                .then(() => getAuthStatus(null))
                .then(sendResponse);
            return true;
        case MessageType.ZOHO_LOGOUTALL:
            if (sender.tab) return false;
            logoutAll()
                .then(() => getAuthStatus(null))
                .then(sendResponse);
            return true;

        case MessageType.OPENOPTIONS:
            chrome.action.openPopup();
            return false;

        default:
            break;
    }

    return false;
}
