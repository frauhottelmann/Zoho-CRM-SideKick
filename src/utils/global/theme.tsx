import { createTheme, ThemeProvider } from "@mui/material/styles";
import React, { useMemo } from "react";

// Zoho CRM sets a small root font size (html { font-size: 62.5% }). MUI sizes text in rem, so without
// this correction every tool renders at roughly 60% of its intended size.
function getPageRootFontSize(): number {
    const size = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return size > 0 ? size : 16;
}

export function SidekickThemeProvider(props: { children: React.ReactNode }) {
    const theme = useMemo(() => createTheme({ typography: { htmlFontSize: getPageRootFontSize() } }), []);
    return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}
