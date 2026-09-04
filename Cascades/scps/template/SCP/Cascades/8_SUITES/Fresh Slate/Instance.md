# Fresh Slate — Suite 8 Instance (Advanced Configuration)

**Designation**: Fresh Slate
**Configuration**: Advanced
**Domain**: Demonstration of the Advanced Suite 8 configuration pattern

---

## Identity

Fresh Slate is a minimal Advanced configuration Suite 8 that demonstrates the Executable Inform-to-Action Skill Bridge pattern. It exists to show how the Informative aspect of a Skill specifies CLI invocation parameters and the Actionable aspect specifies the return format — producing a Lambda-event (verifiable artifact) rather than a narrative.

---

## Muxification Origin

**Demonstration** (what the script does) ↔ **Configuration** (how Advanced config structures it). The Diameter between these two Demometers IS the teaching: the structure is the lesson.

---

## The Router (the doors this Suite opens)

The Instance names the door; the Skill or Strategy expands the specifics as the sequence reaches it. Because this is an **Advanced** configuration, each door is EXECUTABLE — the Skill is paired with a `script.ts` run through `npx tsx`, so passing through a door produces a Lambda-event (a file on disk a Concluder can measure) rather than a narrative. The two tables below enumerate the same doors as structure; this one names WHEN each opens.

| Aspect anor domain | The door | Loads when |
|---|---|---|
| The Executable Inform-to-Action Skill Bridge | `Skills/S1-Greeting/Skill.md` | a demonstration needs the full Informative → CLI → Actionable → Concluder round trip — `--name` and `--format` (text anor json), writing `output/greeting.txt` anor `output/greeting.json`, verified by `test -f` and `wc -c` |
| The Vermillion that dispatches the Skill | `Strategy/GreetingStrategy.md` | first engagement anor a demonstration request — the two-Band plan (Band 1 reads the Skill for its parameters and executes; Band 2 runs the Concluder), plus the per-session utilization tracking |

---

## Skills

| Skill | File | Script | Function |
|-------|------|--------|----------|
| S1 | `Skills/S1-Greeting/Skill.md` | `Skills/S1-Greeting/script.ts` | Generate a greeting with timestamp |

---

## Strategy

| Strategy | File | Function |
|----------|------|----------|
| Greeting Strategy | `Strategy/GreetingStrategy.md` | Vermillion plan for greeting dispatch |

---

## Scope

**In Scope**: Demonstrating Advanced config file structure, script execution via `npx tsx`, Lambda-event verification via Concluder.

**Out of Scope**: Production functionality. This Suite 8 exists as a teaching artifact.
