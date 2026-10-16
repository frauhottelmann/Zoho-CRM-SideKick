import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Divider, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Typography } from "@mui/material";
import { forwardRef, useMemo } from "react";

import { ProcessButton, type ProcessProps, type ProcessRef } from "../../utils/global/.processClass";
import { getSetupUrl, getZohoEnvironment, type ZohoEnvironment } from "../../utils/zoho/environment";
import { useLocationHref } from "../../utils/zoho/useLocationHref";

class NavigationProcess extends ProcessButton {
    static id = "navigation";
    constructor() {
        super("navigation");
        this.process = Navigation;
    }
}

interface NavigationLink {
    label: string;
    url: (env: ZohoEnvironment) => string;
}

// Setup paths of the Zoho CRM web app. Keep them in one place: Zoho changes them from time to time.
const setup = (path: string) => (env: ZohoEnvironment) => getSetupUrl(env, path);

const NAVIGATION_GROUPS: { title: string; links: NavigationLink[] }[] = [
    {
        title: "Customization",
        links: [
            { label: "Modules and Fields", url: setup("modules") },
            { label: "Templates", url: setup("templates") }
        ]
    },
    {
        title: "Users and Control",
        links: [
            { label: "Users", url: setup("users") },
            { label: "Profiles", url: setup("profiles") },
            { label: "Roles", url: setup("roles") }
        ]
    },
    {
        title: "Automation",
        links: [
            { label: "Workflow Rules", url: setup("workflow-rules") },
            { label: "Blueprint", url: setup("blueprint") },
            { label: "Approval Processes", url: setup("approval-processes") }
        ]
    },
    {
        title: "Developer Hub",
        links: [
            { label: "Functions", url: setup("functions") },
            { label: "Client Script", url: setup("client-script") },
            { label: "Connections", url: setup("connections") },
            { label: "APIs and SDKs", url: setup("api") }
        ]
    },
    {
        title: "Data Administration",
        links: [
            { label: "Audit Log", url: setup("audit-log") },
            { label: "Data Backup", url: setup("data-backup") }
        ]
    },
    {
        title: "External",
        links: [
            {
                label: "Zoho API Console",
                url: (env) => `https://api-console.${env.accountsDomain.split(".").slice(1).join(".")}`
            },
            { label: "Zoho Accounts", url: (env) => env.accountsDomain }
        ]
    }
];

const Navigation = forwardRef<ProcessRef, ProcessProps>(function NavigationProcess(props: ProcessProps, ref) {
    const href = useLocationHref();
    const env = useMemo(() => getZohoEnvironment(href), [href]);

    if (!env) {
        return <Typography p={2}>This page is not a Zoho CRM page.</Typography>;
    }

    return (
        <List dense sx={{ overflow: "auto", height: "100%", py: 0 }}>
            {NAVIGATION_GROUPS.map((group, index) => (
                <li key={group.title}>
                    <ul style={{ padding: 0 }}>
                        {index > 0 && <Divider />}
                        <ListSubheader sx={{ lineHeight: "32px" }}>{group.title}</ListSubheader>
                        {group.links.map((link) => (
                            <ListItemButton
                                key={link.label}
                                component="a"
                                href={link.url(env)}
                                target="_blank"
                                rel="noreferrer">
                                <ListItemText primary={link.label} />
                                <ListItemIcon sx={{ minWidth: 0 }}>
                                    <OpenInNewIcon fontSize="small" />
                                </ListItemIcon>
                            </ListItemButton>
                        ))}
                    </ul>
                </li>
            ))}
        </List>
    );
});

export default NavigationProcess;
