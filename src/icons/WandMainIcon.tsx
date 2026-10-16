import { createSvgIcon } from "@mui/material";

// Magic wand with an infinity loop: the extension logo. Source artwork: assets/logo.svg
export const WandMainIcon = createSvgIcon(
    <>
        <path
            d="M15.2 7C13.4 4.3 9.6 4.3 9.6 7S13.4 9.7 15.2 7 20.8 4.3 20.8 7 17 9.7 15.2 7Z"
            fill="none"
            stroke="#c2185b"
            strokeWidth="1.8"
            strokeLinejoin="round"
        />
        <path d="M3.2 20.8 11.4 12.6" stroke="#1976d2" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M11.4 12.6 13.3 10.7" stroke="#64b5f6" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M5 2.5 5.6 4.4 7.5 5 5.6 5.6 5 7.5 4.4 5.6 2.5 5 4.4 4.4Z" fill="#1976d2" />
        <path
            d="M19.5 13.5 19.95 14.85 21.3 15.3 19.95 15.75 19.5 17.1 19.05 15.75 17.7 15.3 19.05 14.85Z"
            fill="#c2185b"
        />
    </>,
    "WandMain"
);
