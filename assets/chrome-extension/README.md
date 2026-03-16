# PansClaw Browser Relay Extension

Purpose: attach PansClaw to an existing browser tab so the Gateway can automate it (via the local CDP relay server).

Works on **Google Chrome** and **Microsoft Edge** (both are Chromium-based and support Manifest V3).

## Dev / load unpacked

1. Build/run PansClaw Gateway with browser control enabled.
2. Ensure the relay server is reachable at `http://127.0.0.1:18792/` (default).
3. Install the extension to a stable path:

   ```bash
   openclaw browser extension install
   openclaw browser extension path
   ```

### Chrome

4. Chrome → `chrome://extensions` → enable “Developer mode”.
5. “Load unpacked” → select the path printed above.
6. Pin the extension. Click the icon on a tab to attach/detach.

### Microsoft Edge

4. Navigate to `edge://extensions` -> enable Developer mode.
5. Load unpacked -> select the path printed above.
6. Pin the extension. Click the icon on a tab to attach/detach.

## Publish to Microsoft Edge Add-ons Store

1. Package the extension directory as a .zip file:

   ```bash
   cd assets/chrome-extension
   zip -r ../openclaw-browser-relay.zip .
   ```

2. Sign in to the Microsoft Partner Center:
   https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview

3. Create a new extension submission and upload `openclaw-browser-relay.zip`.

4. Fill in the store listing (screenshots, description, category: Developer tools).

5. Submit for Microsoft review (typical review time: 1-3 business days).

> **Note:** No code changes are required for Edge. All `chrome.*` APIs used by this extension
> (`chrome.debugger`, `chrome.tabs`, `chrome.storage`, `chrome.runtime`,
> `chrome.webNavigation`, `chrome.alarms`) are fully supported on Edge.

## Options

- `Relay port`: defaults to `18792`.
- `Gateway token`: required. Set this to `gateway.auth.token` (or `OPENCLAW_GATEWAY_TOKEN`).
