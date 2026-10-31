# MiniTerminal Connect

Static integration credential-entry frontend. No credentials belong in this repository. Browser requests go directly to the fixed HTTPS Supabase secret-entry backend. No analytics, third-party scripts, or browser credential storage.

## Publish
In repository Settings > Pages, select Deploy from a branch, main, / (root), then Save. Verify the Pages deployment succeeds before using its URL.

Use the published URL with ?id=<fresh-secret-entry-session-id>. Old sessions expire after 15 minutes. Update the secret-entry backend UI_BASE_URL only after the published site is verified.
