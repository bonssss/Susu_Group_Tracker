# Assumptions and decisions

- The program manages one group per running server process. The group, contributions,
  current week, and payout history are in memory and reset when the process restarts.
- Member names or IDs are trimmed and compared without regard to case for uniqueness
  and lookup. The original spelling is preserved in reports.
- Members may be added until the first positive contribution is recorded. After that,
  the roster is locked so every week's pot stays consistent.
- Each member owes one fixed contribution per week. Partial payments accumulate, and
  an incomplete close reports the balance due without advancing the week or clearing
  those payments.
- The payout order follows join order and repeats after every member has received the
  pot, so the group can continue for additional rounds.
- Money is accepted as decimal strings with up to two decimal places and stored as
  integer pesewas. JSON numbers are rejected to avoid ambiguous decimal precision.
- A group must have at least one member before a week can close.

## What I would improve with more time

- Persist the group and payout ledger so state survives restarts, using a transactional
  database to ensure contributions and payouts cannot be partially applied.
- Add authentication, authorization, and audit records before exposing the API beyond
  a trusted local environment.
- Add request IDs or idempotency keys to make contribution retries safe, plus explicit
  concurrency handling for simultaneous requests.
- Provide configurable group lifecycle controls, such as ending a completed round and
  safely managing membership changes between rounds.
- Add deployment configuration, structured logging, and broader operational tests.
