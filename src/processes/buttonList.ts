import { ToolPanelButton } from "~utils/global/.toolPanelButton";

import { type StorageConfiguration } from "../utils/types/StorageConfiguration";
import metadataBrowser from "./metadataBrowser/button";
import navigation from "./navigation/button";
import recordViewer from "./recordViewer/button";
import createConfiguration from "./setConfiguration/button";


export const ToolPanelButtonList: ToolPanelButton[] = [
    new metadataBrowser(),
    new recordViewer(),
    new navigation(),
    new createConfiguration()
];

export function getToolButton(prefixedId: string): ToolPanelButton | null {
    return ToolPanelButtonList.find((tool) => tool.prefixedId === prefixedId);
}


export const defaultToolList: StorageConfiguration[] = ToolPanelButtonList.map((tool) => {
    return {
        id: tool.prefixedId,
        startOnLoad: false,
        hidden: false,
        expand: false,
        options: null
    };
});
