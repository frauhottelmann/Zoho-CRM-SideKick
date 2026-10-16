import TuneIcon from "@mui/icons-material/Tune";
import Typography from "@mui/material/Typography";

import { ToolPanelButton } from "~utils/global/.toolPanelButton";

class MetadataBrowserButton extends ToolPanelButton {
    static id = "metadatabrowser";
    constructor() {
        super("metadatabrowser", "Metadata Browser", () => TuneIcon, "100%");
        this.description = (
            <>
                <Typography>
                    <i>Explore the structure of your Zoho CRM organization.</i>
                </Typography>
                <Typography>
                    Lists all modules with their API names, and for each module its fields (data type, picklist values,
                    lookups), layouts and related lists. Click an API name to copy it.
                </Typography>
            </>
        );
    }
}

export default MetadataBrowserButton;
