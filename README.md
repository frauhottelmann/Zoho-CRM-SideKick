PowerCRM SideKick Zoho
======================

A browser extension (Chrome, Edge and Firefox, Manifest V3) that adds a side panel to Zoho CRM pages with tools for administrators.

> This project is a port of [PowerCRM SideKick 365](https://github.com/SofianeGUEZZAR/PowerCRM-SideKick-365) by Sofiane GUEZZAR, originally built for Microsoft Dynamics 365. It is an independent tool and is not affiliated with Zoho Corporation.

## Tools

| Tool | What it does |
| --- | --- |
| Metadata Browser | Lists every API-enabled module with label, API name and URL module name. For a module it shows fields (data type, mandatory, read-only, lookup module, picklist values), layouts and related lists. Click an API name to copy it; double-click a row for its raw JSON; export any grid as CSV. |
| Record Viewer | Shows every field of the record opened in the current tab with label, API name and value, or the full JSON returned by the API. Follows you as you navigate. |
| Navigation | Opens Zoho CRM setup pages (modules, users, profiles, roles, workflow rules, blueprints, functions, client scripts, audit log) and the Zoho API Console. |
| Configuration Manager | Chooses which tools open automatically and whether panels overlay or resize the page. |

All data access is **read-only** (GET requests only).

## How it gets data

There is nothing to set up and no extra login. The tools run inside the Zoho CRM tab and call the CRM's own API endpoints on the same origin (`/crm/<version>/...`), with the session you are already logged in with and the CSRF token Zoho stores in a cookie. Each tab therefore works with the org it shows and with your permissions in that org, so you can keep several customer CRMs open side by side.

These same-origin endpoints are what the Zoho web app itself uses; they are not a documented public API and may change. All errors are shown in the tool, so a change on Zoho's side shows up as a failed request rather than wrong data.

Supported data centers: `zoho.com`, `zoho.eu`, `zoho.in`, `zoho.com.au`, `zoho.jp`, `zoho.com.cn`, `zoho.sa`, `zohocloud.ca`, including their `crmsandbox` hosts.

## Development

```bash
pnpm install
pnpm dev            # development build with live reload (build/chrome-mv3-dev)
pnpm build          # production builds for Chrome and Firefox
```

Load `build/chrome-mv3-dev` (or `-prod`) as an unpacked extension in `chrome://extensions`.

### Structure

- `src/contents/` content scripts: `crm-sidekick-init.ts` (message bridge), `injectMain.tsx` (side panel), `tool_*.tsx` (one per tool)
- `src/processes/` the tools: `button.tsx` (menu entry) and `tool.tsx` (panel content)
- `src/background/` service worker: configuration storage
- `src/utils/zoho/` Zoho environment detection and the API client hooks

## License

MIT, see [LICENSE](LICENSE).
