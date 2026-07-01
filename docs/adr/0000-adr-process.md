# 0000 — ADR process

## Status
Accepted

## Context
This repo previously had no formal record of *why* technical decisions were made — only the decisions themselves, scattered across `skills/*.md` and `docs/*.md`. That made it easy for a stale plan (see `frontend/README.md`'s history) to drift from reality unnoticed.

## Decision
Use lightweight Architecture Decision Records (ADRs) in `docs/adr/`, numbered sequentially (`0001-...`, `0002-...`). Each ADR has: Status, Context, Decision, Consequences. Keep them short — a paragraph or two per section, not a design doc.

An ADR is superseded, not edited, when a decision changes: add a new ADR that references the old one and update the old one's Status to `Superseded by 000X`.

## Consequences
- Future agents and contributors have a single place to check before proposing to revisit a settled decision.
- ADRs are additive-only in normal operation; changing history requires a new ADR, keeping the trail intact.
