# Claude.ai — Suite Cascade System Setup Instructions

## For Claude.ai Projects (claude.ai)

The Suite Cascade System has a Claude.ai variant that operates the same eight cognitive functions through Claude.ai's native tooling: Memory as Diamond, conversation accumulation as Onyx, and Planned Queries as Vermillion.

---

## Quick Start

### Option A: SCS Only (Base System)

1. Create a new **Project** on claude.ai
2. Open the Project's **Custom Instructions**
3. Paste the contents of `SCS-Claude-AI.md` as the Project Instructions
4. Start a conversation — the SCS manifold loads automatically

### Option B: SCS + Researcher (Stitched Variant)

1. Create a new **Project** on claude.ai
2. Open the Project's **Custom Instructions**
3. Paste the contents of `SCS-Claude-AI-Researcher.md` as the Project Instructions
4. This includes the base SCS + the Planned Query research methodology as the Suite 8 footer
5. Start a conversation — the full research-specialized SCS loads automatically

### Option C: SCS + Your Own Suite 8

1. Create a new **Project** on claude.ai
2. Open the Project's **Custom Instructions**
3. Paste the contents of `SCS-Claude-AI.md` as the Project Instructions
4. Below it, append your own Suite 8 Instance block — defining the domain, skills, and methodology for your workspace
5. The transparent 8th position carries whatever Suite 8 you append

---

## How It Works on Claude.ai

| SCS Concept | Claude.ai Feature | What To Do |
|---|---|---|
| **Diamond** (plans) | **Memory** | At cycle boundaries, ask Claude to save cycle position + pending work to Memory |
| **Onyx** (findings) | **Conversation** | Each conversation self-accumulates findings. The conversation IS the Onyx pass. |
| **Obsidian Absorb** | **Conversation start** | Begin each conversation with: "Read Memory for cycle position and pending work" |
| **Rose Diagnosis** | **End of engagement** | Ask Claude to diagnose: "What was Gainy? Lossy? Maintain?" — then save to Memory |
| **Tier Progression** | **New conversation** | When context fills, start a new conversation. Memory carries the Diamond forward. |
| **Vermillion Plans** | **Planned Queries** | Use `<PlannedQuery>` format for multi-stage research orchestration |
| **Artifacts** | **Cerulean tasks** | Create Artifacts for persistent tracking documents, task lists, architecture maps |

---

## Files in This Directory

| File | Purpose | Use |
|------|---------|-----|
| `SCS-Claude-AI.md` | Base SCS variant for Claude.ai | Paste as Project Instructions (Option A) |
| `SCS-Claude-AI-Researcher.md` | SCS + Researcher Suite 8 stitched | Paste as Project Instructions (Option B) |
| `CLAUDE-AI-INSTRUCTIONS.md` | This file — setup guide | Reference only |

The Claude AI Researcher Suite 8 Instance and Skill definitions are at `Cascades/8_SUITES/Claude AI Researcher/` for reference if you want to create your own Suite 8 variant following the same pattern.

---

## Differences from Full SCS (Claude Code)

| Capability | Claude Code | Claude.ai |
|---|---|---|
| Agent dispatch (Tier 1) | 9 agents via `.claude/agents/` | All Tier 0 in-context |
| Slash commands | 13 `/cascade:*` commands | Conversation-driven routing |
| Autonomous loop | `/cascade:loop` via ScheduleWakeup | Manual — user = continuation signal |
| File-system Diamond/Onyx | `.md` files in `Cascades/Working/` | Memory + conversation accumulation |
| Suite 8 instances | Directories in `Cascades/8_SUITES/` | Project Instructions footer |
| Connectors/MCP | Via Claude Code MCP servers | Via Claude.ai Connectors Directory (50+) |

---

*For the full SCS with agent dispatch, slash commands, and autonomous Automata, use Claude Code: [github.com/Phuire-Research/SuiteCascadeSystem](https://github.com/Phuire-Research/SuiteCascadeSystem)*
