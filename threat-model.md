# Threat model — CustodyMap (demo)

## Scope

In-browser atlas that visualizes a synthetic custody graph and local request workflows. No server, no durable store, no identity provider.

## Assets

| Asset | Sensitivity | Notes |
| --- | --- | --- |
| Demo graph topology | Low | Public fixture describing fake systems |
| Subject refs typed in UI | Potentially high if real | Operator-controlled; should stay synthetic |
| Request workflow state | Low | Ephemeral React state |

## Actors

- **Portfolio visitor** — explores UI locally
- **Curious inspector** — views source / network (none expected beyond static assets)

## Threats & mitigations

1. **Accidental real PII entry**  
   Mitigation: README/SECURITY warnings; no persistence; no export APIs.

2. **Mistaking demo for compliance control**  
   Mitigation: Explicit synthetic labeling; threat model documents demo-only verdicts.

3. **Future backend creep**  
   Mitigation: Keep request machine pure in `lib/custody.ts`; any API would need auth, audit, and legal review before claiming privacy features.

4. **Supply-chain / dependency risk**  
   Mitigation: Minimal dependency set (Next/React/Vitest/TypeScript only).

## Out of scope

Encryption at rest, DSR orchestration across vendors, legal hold enforcement, cross-border transfer assessments.
