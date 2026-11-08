# MiniTerminal Connect

Static frontend for MiniTerminal one-time integration credential entry and Supabase OAuth consent.

## Purpose

This GitHub Pages site provides:

- `consent.html` — the Supabase OAuth Server authorization and consent page.
- `auth.html` — the account sign-in interface, including return-to-consent behavior.
- Credential-entry flows for user-defined MiniTerminal API connections.

Credentials are submitted directly to Supabase and stored in Supabase Vault. This repository does not store API keys, passwords, tokens, or other secrets.

## Architecture

- **Frontend:** static HTML, CSS, and JavaScript deployed through GitHub Pages.
- **Authentication:** Supabase Auth and Supabase OAuth Server.
- **Backend:** Supabase Edge Functions in the `MCPS` project.
- **Connection metadata:** `mt_integration_providers`, `mt_integration_connections`, `mt_integration_sessions`, and `mt_integration_events`.
- **Credentials:** Supabase Vault; connection metadata contains Vault references, never credential values.

## OAuth setup

The Supabase project should use:

- Site URL: `https://chihab27.github.io/mini-terminal-connect`
- Redirect URLs: `https://chihab27.github.io/mini-terminal-connect/auth.html` and `https://chihab27.github.io/mini-terminal-connect/consent.html`
- OAuth Server authorization path: `/consent.html`
- Dynamic client registration: enabled

## Current status

The MCP connection, authenticated MiniTerminal tool calls, credential entry, Vault-backed requests, templated headers and query parameters, verification, and revocation have been tested successfully with test credentials.

This is not a production-readiness claim. Token refresh, consent denial, multi-user behavior, real third-party APIs, and repeatable automated integration tests remain outstanding.
