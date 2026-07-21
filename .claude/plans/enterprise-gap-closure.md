# SpaceJam Enterprise Gap Closure Plan

**Created:** 2026-07-20
**Status:** In Progress

## Overview

Close all gaps identified in the frontend audit (inventory, meeting rooms, events, operations, reports, settings, cross-cutting). 29 beads total — grouped by layer so dependencies are clear.

## Execution Order

### Phase 1: Backend Foundation (P0)
These enable everything else.

1. **spacejam-5tr** — Finance settings entity + resolver
2. **spacejam-kqx** — Teams/Permissions entity + resolver
3. **spacejam-b9o** — Audit log entity + resolver
4. **spacejam-e4n** — Notification settings entity + resolver
5. **spacejam-kk5** — Center settings entity + resolver
6. **spacejam-c2n** — Security settings entity + resolver
7. **spacejam-ri9** — Role-based data scoping for all resolvers

### Phase 2: Core Business Features (P1)
Real functionality users need.

8. **spacejam-i6c** — Recurring/block booking for meeting rooms
9. **spacejam-8ln** — Payment integration for bookings/events
10. **spacejam-dys** — Equipment/assets tracking
11. **spacejam-nab** — Request submission and approval workflow
12. **spacejam-by1** — Event attendee management
13. **spacejam-qvj** — Event ticket tiers and pricing
14. **spacejam-ktz** — Push notification WebSocket subscription

### Phase 3: Data & Analytics (P1/P2)
Reporting, exports, real-time.

15. **spacejam-sls** — Calendar sync integration (P2)
16. **spacejam-hq9** — Reports export (CSV/PDF) (P2)
17. **spacejam-4ld** — Scheduled reports (P2)
18. **spacejam-76o** — Audit log filtering and search (P2)
19. **spacejam-o6v** — Occupancy heatmap and analytics (P2)

### Phase 4: Frontend Modernization (P1/P2)

20. **spacejam-8yv** — Interactive floor map (P1)
21. **spacejam-u14** — Notification bell in header (P1)
22. **spacejam-1h6** — Replace /dashboard dead duplicate (P2)
23. **spacejam-x9m** — Dashboard home real implementation (P2)
24. **spacejam-ba9** — Dark mode toggle (P3)
25. **spacejam-zuw** — Multi-language i18n (P3)

### Dependencies

- Phases 2-4 depend on Phase 1 entities existing first
- Frontend phases (20-25) depend on their backend counterparts
- Audit log (3) should be implemented BEFORE other features so they start logging from day 1
