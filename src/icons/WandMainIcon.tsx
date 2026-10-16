import { createSvgIcon } from "@mui/material";

// Magic wand with an infinity loop: the extension logo. Source artwork: assets/logo.svg
export const WandMainIcon = createSvgIcon(
    <>
        <path
            d="M14.7 6.8C13.9 5.1 12.9 3.7 11.6 3.7 9.9 3.7 8.5 5.1 8.5 6.8S9.9 9.9 11.6 9.9C12.9 9.9 13.9 8.5 14.7 6.8 15.5 5.1 16.5 3.7 17.8 3.7 19.5 3.7 20.9 5.1 20.9 6.8S19.5 9.9 17.8 9.9C16.5 9.9 15.5 8.5 14.7 6.8Z"
            fill="none"
            stroke="#1e6fd9"
            strokeWidth="1.9"
            strokeLinejoin="round"
        />
        <path d="M3.2 20.8 11 13" stroke="#0a3d7a" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M11 13 12.9 11.1" stroke="#4fa3ff" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M4.6 2.3 5.2 4.2 7.1 4.8 5.2 5.4 4.6 7.3 4 5.4 2.1 4.8 4 4.2Z" fill="#1e6fd9" />
        <path
            d="M19.5 13.8 19.95 15.15 21.3 15.6 19.95 16.05 19.5 17.4 19.05 16.05 17.7 15.6 19.05 15.15Z"
            fill="#4fa3ff"
        />
    </>,
    "WandMain"
);
