import { useEffect, useState } from "react";

/** Zoho CRM is a single page app: follow URL changes without relying on its router. */
export function useLocationHref(intervalMs = 500) {
    const [href, setHref] = useState(() => window.location.href);

    useEffect(() => {
        const update = () => setHref(window.location.href);
        const timer = setInterval(update, intervalMs);
        window.addEventListener("popstate", update);
        return () => {
            clearInterval(timer);
            window.removeEventListener("popstate", update);
        };
    }, [intervalMs]);

    return href;
}
