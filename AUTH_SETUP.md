# MiniTerminal authentication UI

Production UI and email return URL: https://chihab27.github.io/mini-terminal-connect/auth.html

In Supabase project vulazhgszvxpxqdcfllq, Authentication > URL Configuration: set Site URL to the production UI URL and add the exact same URL to Redirect URLs. This commit does not update those settings. Verify GitHub Pages deployment before sending another email. Configure the project email provider and email confirmation settings as appropriate.

Existing root links with ?id=... still load app.js and the one-time credential entry flow. Ordinary root visitors go to auth.html. Authentication return fragments are cleared before network requests. Sessions are held in sessionStorage for this tab; no service-role or MCP API keys are included. The public Supabase key is intentionally client-visible.

Password signup and passwordless emails request the explicit production redirect. Password login, refresh, logout, identity, and MCP calls use mini-terminal-auth-proxy. Connection registration uses the authenticated connection service. The UI includes explicit OAuth endpoint setup, not automatic support for every provider. CAPTCHA-enabled projects require an additional frontend CAPTCHA integration.

Limits: provider refresh is not implemented; OAuth callbacks currently show a JSON result rather than returning automatically to this dashboard. Reopen the UI after granting consent. Public signup UI is not a fix for unsafe direct access to the legacy evaluator; audit and restrict that server separately before public launch. No successful complete signup or real-provider flow is claimed by this commit.
