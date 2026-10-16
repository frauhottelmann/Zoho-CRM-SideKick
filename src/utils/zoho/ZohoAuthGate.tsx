import LoginIcon from "@mui/icons-material/Login";
import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import OpenOptionsButton from "../components/OpenOptionsButton";
import { isFirefox } from "../global/var";
import type { ZohoAuthStatus } from "./types";
import { clearZohoCache, getAuthStatus, login } from "./ZohoApi";

const ZohoAuthContext = createContext<{ requireLogin: () => void }>({ requireLogin: () => {} });

/** Shows the login flow until the user has a Zoho token for this data center, then renders its children. */
export function ZohoAuthGate(props: { children: React.ReactNode }) {
    const [status, setStatus] = useState<ZohoAuthStatus | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);

    const refresh = useCallback(() => {
        getAuthStatus().then(setStatus);
    }, []);

    useEffect(refresh, [refresh]);

    const onLogin = useCallback(() => {
        setLoggingIn(true);
        login()
            .then((newStatus) => {
                clearZohoCache();
                setStatus(newStatus);
            })
            .finally(() => setLoggingIn(false));
    }, []);

    const requireLogin = useCallback(() => {
        setStatus((prev) => (prev ? { ...prev, loggedIn: false } : prev));
    }, []);

    if (!status) {
        return (
            <Stack alignItems="center" p={2}>
                <CircularProgress size={24} />
            </Stack>
        );
    }

    if (!status.hasClientId) {
        return (
            <Stack spacing={1} p={1.5}>
                <Alert severity="info">
                    <Typography variant="body2">
                        This tool reads data through the Zoho CRM API. Register a <b>Client-based Application</b> in the
                        Zoho API Console, then enter its client ID in the extension popup (toolbar icon).
                    </Typography>
                </Alert>
                <Typography variant="caption">Redirect URI to register:</Typography>
                <Typography variant="caption" sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                    {status.redirectUri}
                </Typography>
                {!isFirefox && <OpenOptionsButton variant="outlined" text="Open extension popup" />}
                <Button size="small" onClick={refresh}>
                    Check again
                </Button>
            </Stack>
        );
    }

    if (!status.loggedIn) {
        return (
            <Stack spacing={1} p={1.5}>
                <Typography variant="body2">Log in to Zoho to load data from this organization.</Typography>
                {status.error && <Alert severity="error">{status.error}</Alert>}
                <Button variant="contained" startIcon={<LoginIcon />} onClick={onLogin} disabled={loggingIn}>
                    {loggingIn ? "Waiting for Zoho…" : "Log in with Zoho"}
                </Button>
            </Stack>
        );
    }

    return <ZohoAuthContext.Provider value={{ requireLogin }}>{props.children}</ZohoAuthContext.Provider>;
}

/** Sends the user back to the login screen when a request reports an expired or missing token. */
export function useLoginWhen(authRequired: boolean) {
    const { requireLogin } = useContext(ZohoAuthContext);
    useEffect(() => {
        if (authRequired) requireLogin();
    }, [authRequired, requireLogin]);
}
