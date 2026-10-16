import { getExtensionConfiguration, setExtensionConfiguration } from "~processes/setConfiguration/background";
import { MessageType } from "~utils/types/Message";

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

        case MessageType.OPENOPTIONS:
            chrome.action.openPopup();
            return false;

        default:
            break;
    }

    return false;
}
