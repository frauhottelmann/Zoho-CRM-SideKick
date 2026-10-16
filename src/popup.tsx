import BugReportIcon from "@mui/icons-material/BugReport";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Divider, Paper, TextField, Tooltip } from "@mui/material";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

import BlackWhiteIconButton from "~utils/components/BlackWhiteIconButton";
import { APPLICATION_NAME, STORAGE_DontShowInfo, STORAGE_ListName, STORAGE_ZohoClientId } from "~utils/global/var";
import { useChromeStorage } from "~utils/hooks/use/useChromeStorage";
import { MessageType } from "~utils/types/Message";
import type { StorageConfiguration } from "~utils/types/StorageConfiguration";
import type { ZohoAuthStatus } from "~utils/zoho/types";

import packageJson from "../package.json";

const REPOSITORY_URL = "https://github.com/frauhottelmann/PowerCRM-SideKick-365";

const OptionsScreen: React.FunctionComponent = () => {
    const [, setProcessList] = useChromeStorage<StorageConfiguration[]>(STORAGE_ListName);
    const [authStatus, setAuthStatus] = useState<ZohoAuthStatus | null>(null);
    const [clientId, setClientId] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        chrome.runtime.sendMessage({ type: MessageType.ZOHO_AUTHSTATUS }, setAuthStatus);
        chrome.storage.sync
            .get(STORAGE_ZohoClientId)
            .then((stored) => setClientId(stored?.[STORAGE_ZohoClientId] ?? ""));
    }, []);

    const saveClientId = useCallback(() => {
        chrome.runtime.sendMessage({ type: MessageType.ZOHO_SETCLIENTID, data: { clientId } }, (status) => {
            setAuthStatus(status);
            setMessage(
                clientId.trim()
                    ? "Client ID saved. Log in from the side panel on a Zoho CRM page."
                    : "Client ID removed."
            );
        });
    }, [clientId]);

    const logoutAll = useCallback(() => {
        chrome.runtime.sendMessage({ type: MessageType.ZOHO_LOGOUTALL }, (status) => {
            setAuthStatus(status);
            setMessage("Logged out of every Zoho data center.");
        });
    }, []);

    const resetProcessList = useCallback(() => {
        setProcessList(null);
    }, [setProcessList]);

    const resetDontShowInfo = useCallback(() => {
        chrome.runtime.sendMessage({
            type: MessageType.SETCONFIGURATION,
            data: { key: STORAGE_DontShowInfo, configurations: null }
        });
    }, []);

    return (
        <Container sx={{ width: "500px", p: 2, pb: 0 }}>
            <Stack direction="column" spacing={1}>
                <Alert severity="warning">
                    <Typography component="p" fontWeight="bold" fontSize="0.95rem">
                        This section is not where you can use this extension:
                    </Typography>
                    <Typography component="p" fontSize="0.95rem">
                        {APPLICATION_NAME} adds a panel at the right of Zoho CRM pages.
                    </Typography>
                </Alert>

                <Typography variant="h6">Zoho API access</Typography>
                <Typography variant="body2">
                    Register a <b>Client-based Application</b> in the Zoho API Console and add this redirect URI to it:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                    {authStatus?.redirectUri ?? "…"}
                </Typography>
                <Stack direction="row" spacing={1}>
                    <TextField
                        size="small"
                        label="Client ID"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        fullWidth
                    />
                    <Button variant="contained" onClick={saveClientId}>
                        Save
                    </Button>
                </Stack>
                <Button variant="outlined" onClick={logoutAll}>
                    Log out of Zoho
                </Button>
                {message && <Alert severity="info">{message}</Alert>}

                <Divider />

                <Button variant="contained" onClick={resetProcessList}>
                    Reset Tool List
                </Button>

                <Button variant="contained" onClick={resetDontShowInfo}>
                    Reset "Don't Show" Infos
                </Button>

                <Paper elevation={0}>
                    <Stack direction="column">
                        <Divider />
                        <Stack spacing={1} mt="5px" direction="row" alignItems="center" ml="auto">
                            <Tooltip title={<Typography>Github project</Typography>} arrow disableInteractive>
                                <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                                    <BlackWhiteIconButton size="small" color="#2dba4e">
                                        <GitHubIcon fontSize="inherit" />
                                    </BlackWhiteIconButton>
                                </a>
                            </Tooltip>
                            <Tooltip title={<Typography>Report an issue</Typography>} arrow disableInteractive>
                                <a href={`${REPOSITORY_URL}/issues/new`} target="_blank" rel="noreferrer">
                                    <BlackWhiteIconButton size="small" color="#df5050">
                                        <BugReportIcon fontSize="inherit" />
                                    </BlackWhiteIconButton>
                                </a>
                            </Tooltip>
                            <Divider orientation="vertical" flexItem />
                            <Typography variant="caption" color="grey" textAlign="end" sx={{ userSelect: "none" }}>
                                v{packageJson.version}
                            </Typography>
                        </Stack>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
};

export default OptionsScreen;
