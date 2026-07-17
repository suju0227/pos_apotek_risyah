# BRIEFING — 2026-07-10T10:55:45+08:00

## Mission
Coordinate the design, implementation, and verification of Rantai Satuan (Chained Units) on Products at apotek Risyah.

## 🔒 My Identity
- Archetype: Teamwork
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: d:\pos_apotek_risyah\.agents\orchestrator
- Original parent: parent
- Original parent conversation ID: b5114e23-f238-4b0b-8e85-cbc7a61ac20f

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: d:\pos_apotek_risyah\PROJECT.md
1. **Decompose**: Decompose the task into milestones (Database, Backend Logic, API/DTO, Frontend UI, E2E tests, and Integration).
2. **Dispatch & Execute** (pick ONE):
   - **Delegate (sub-orchestrator)**: Spawn sub-orchestrators for milestones or run Explorer -> Worker -> Reviewer cycle per milestone.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Decompose & Plan [pending]
- **Current phase**: 1
- **Current focus**: Decompose & Plan

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- You MAY use file-editing tools ONLY for metadata/state files (.md) in your .agents/ folder.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.
- Binary veto on Forensic Auditor integrity check.

## Current Parent
- Conversation ID: b5114e23-f238-4b0b-8e85-cbc7a61ac20f
- Updated: not yet

## Key Decisions Made
- Initializing project orchestration.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| sub_orch_impl | self | Implementation Track | in-progress | 7407bb2c-b06e-42ca-a885-c4d00a7323cd |
| sub_orch_test | self | E2E Testing Track | in-progress | 8dcfa485-515e-45d1-bc78-968ae5719224 |

## Succession Status
- Succession required: no
- Spawn count: 2 / 16
- Pending subagents: 7407bb2c-b06e-42ca-a885-c4d00a7323cd, 8dcfa485-515e-45d1-bc78-968ae5719224
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: dc2e37a2-848c-4de2-b4f8-5883642c82d1/task-15
- Safety timer: none

## Artifact Index
- d:\pos_apotek_risyah\.agents\orchestrator\BRIEFING.md — Briefing file
- d:\pos_apotek_risyah\.agents\orchestrator\ORIGINAL_REQUEST.md — Original request verbatim
