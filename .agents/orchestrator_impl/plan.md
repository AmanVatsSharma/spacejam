# Spacejam CRM Implementation Plan

## Overview
This plan coordinates the subagents (Explorer, Worker, Reviewer, Challenger, Auditor) to implement full GraphQL connectivity, input validation, structured exceptions, database seeding, and end-to-end routing.

## Coordination Plan

### Phase 1: Setup & Initial Exploration
1. Spawn an Explorer agent to list all GraphQL input DTOs, analyze missing database schema requirements for the frontend pages (e.g. Dashboard, Inventory, Settings, Customers), and check the test runner/Vitest setup.
2. Review findings and refine interface contracts in `PROJECT.md`.

### Phase 2: Milestone 2 - Robustness Upgrades
1. Spawn a Worker to add `class-validator` decorators to all input DTOs, fix generic `Error` exceptions in resolvers, and fix the Vitest compiler config to resolve decorator metadata.
2. Spawn Reviewers to check the validation and error fixes.
3. Spawn a Challenger to run unit tests and perform verification.
4. Spawn a Forensic Auditor to ensure no cheating / integrity issues.

### Phase 3: Milestones 3-6 - Feature Integration
Iteratively process each feature milestone (Dashboard, CRM, Operations/Inventory, Settings) by:
1. Spawning Explorer to map exact query/mutation signatures between frontend and backend.
2. Spawning Worker to implement the backend query/resolver/mutation logic and update the frontend Apollo hooks to replace mock data.
3. Spawning Reviewers to review correctness.
4. Spawning Challenger to verify UI functionality and run test suite.
5. Spawning Auditor to verify integrity.

### Phase 4: Database Seeding & Final Verification
1. Spawn Worker to create/apply database seeds for realistic dynamic frontend rendering.
2. Spawn Challenger to do final end-to-end clicks and check error logs.
3. Run Forensic Auditor.
4. Synthesize final results and report to user.
