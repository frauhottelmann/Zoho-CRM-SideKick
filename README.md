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

All data access is **read-only** (scopes `ZohoCRM.settings.READ`, `ZohoCRM.modules.READ`, `ZohoCRM.users.READ`, `ZohoCRM.org.READ`).

## Setup

The tools call the Zoho CRM REST API (v8) with the signed-in user's own permissions. Users only click **Log in with Zoho**; the OAuth client belongs to the extension and is registered **once** by its maintainer:

1. In the Zoho API Console (for example https://api-console.zoho.eu) add a client of type **Client-based Applications** and enable multi-DC for it.
   - Homepage URL: this repository
   - Authorized Redirect URIs:
     - Chrome / Edge: `https://mamgfglelcnkmhalinaghngoohmpfidb.chromiumapp.org/`
     - Firefox: `https://e2c23a8c27750856e61f296b4db623458ba1c2c3.extensions.allizom.org/`
2. Put the client ID into `ZOHO_DEFAULT_CLIENT_ID` in `src/utils/zoho/config.ts` and rebuild.

The redirect URIs stay the same because the extension ID is fixed: `key` in the manifest section of `package.json` (Chrome) and the Gecko ID (Firefox). A store listing gets its own ID, so add the store's redirect URI to the client as well. The popup shows the redirect URI of the running installation and lets you override the client ID for testing.

The extension uses the implicit grant: there is no client secret and no refresh token. Access tokens are kept in local extension storage and expire after an hour; the extension silently requests a new one while the user's Zoho session is active.

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
- `src/background/` service worker: configuration storage, OAuth and API calls (`zohoAuth.ts`)
- `src/utils/zoho/` Zoho environment detection, API client hooks and the login gate

## License

MIT, see [LICENSE](LICENSE).
