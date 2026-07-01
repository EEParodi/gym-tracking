# 0004 — Magic-link-only authentication

## Status
Accepted

## Context
An earlier version of `frontend/README.md` proposed "a minimal login screen (email/password)". The app instead shipped with Supabase magic-link auth (`sendMagicLink`) only.

## Decision
Authentication is magic-link only via Supabase — no password field, no password storage or reset flow to build or maintain. On `localhost`, typing `dev` in the email field bypasses auth for local development (`docs/architecture.md`).

Rationale:
- This is a low-traffic personal/small-group app; password auth adds security surface (password storage, reset flows, credential stuffing exposure) disproportionate to the need.
- Magic-link avoids a login-screen build entirely on the client — Supabase handles the flow — consistent with the single-file, no-build-step constraint (`0001-single-file-monolith.md`).

## Consequences
- No password reset UI/flow needs to exist.
- Login requires access to the user's email inbox at sign-in time; there is no offline login path (only offline *use* via the localStorage cache once already signed in).
