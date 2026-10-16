import DataObjectIcon from "@mui/icons-material/DataObject";
import Typography from "@mui/material/Typography";

import { ToolPanelButton } from "~utils/global/.toolPanelButton";

class RecordViewerButton extends ToolPanelButton {
    static id = "recordviewer";
    constructor() {
        super("recordviewer", "Record Viewer", () => DataObjectIcon, 560);
        this.description = (
            <>
                <Typography>
                    <i>See what the API sees.</i>
                </Typography>
                <Typography>
                    Shows every field of the currently opened record with its label, API name and raw value, or the full
                    JSON returned by the Zoho CRM API. Follows you as you open other records.
                </Typography>
            </>
        );
    }
}

export default RecordViewerButton;
