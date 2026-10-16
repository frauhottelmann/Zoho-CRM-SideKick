import MapIcon from "@mui/icons-material/Map";
import { Typography } from "@mui/material";

import { ToolPanelButton } from "~utils/global/.toolPanelButton";

class NavigationButton extends ToolPanelButton {
    static id = "navigation";
    constructor() {
        super("navigation", "Navigation", () => MapIcon, 240);
        this.description = (
            <>
                <Typography>
                    <i>Access everything you need in one place.</i>
                </Typography>
                <Typography>
                    Opens the main Zoho CRM setup pages (modules and fields, users, profiles, roles, workflow rules,
                    blueprints, functions, client scripts, audit log) and the Zoho API Console in a new tab.
                </Typography>
            </>
        );
    }
}

export default NavigationButton;
