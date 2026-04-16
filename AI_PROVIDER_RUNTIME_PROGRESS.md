# AI Provider Runtime Progress

Date: 2026-04-16

This file records the provider-runtime and live-session migration work completed so far. The goal of this track is to move Cabinet away from hard-coded Claude Code / Codex terminal launching, support multiple providers through a consistent adapter layer, and keep the old CLI path available as an optional experimental fallback.

## 1. Goal

The migration is moving Cabinet toward a Paperclip-style model where:

- provider execution is abstracted behind adapter definitions
- multiple runtimes can coexist under the same conversation/job/persona model
- structured adapters can run detached sessions without relying on prompt injection through a web terminal
- legacy CLI launching remains available as a fallback, but no longer defines the main architecture

## 2. What Has Been Implemented

### 2.1 Adapter Foundation

- Added a shared adapter system under `src/lib/agents/adapters/`.
- Introduced adapter metadata such as:
  - `adapterType`
  - `adapterConfig`
  - execution engine identity
  - provider mapping
- Threaded adapter metadata through:
  - personas
  - jobs
  - conversations
  - daemon sessions

Key commits:

- `7cd6c31` - `feat: scaffold adapter foundation for agent runtime migration`
- `3e30f5a` - `feat: thread adapter metadata through daemon sessions`

### 2.2 Structured Provider Adapters

- Added structured Claude local execution:
  - `src/lib/agents/adapters/claude-local.ts`
  - `src/lib/agents/adapters/claude-stream.ts`
- Added structured Codex local execution:
  - `src/lib/agents/adapters/codex-local.ts`
  - `src/lib/agents/adapters/codex-stream.ts`
- Added structured Gemini local execution:
  - `src/lib/agents/adapters/gemini-local.ts`
  - `src/lib/agents/adapters/gemini-stream.ts`
- These adapters parse streamed JSON output into Cabinet-friendly transcript text and usage/session metadata instead of depending on raw PTY replay.
- Added focused adapter tests for structured provider runtimes, including Gemini stream-json parsing.

Key commits:

- `5aa39a5` - `feat: run claude conversations through structured adapter sessions`
- `0a9e52c` - `feat: run codex conversations through structured adapter sessions`

Additional progress on this branch:

- Registered `gemini-cli` in the provider registry.
- Added `gemini_local` as the default structured adapter for Gemini runs.
- Verified the Gemini adapter against real CLI `stream-json` output so Cabinet can translate assistant messages, tool-use events, and final usage data into native transcript updates.

### 2.3 Daemon Runtime Generalization

- Generalized the daemon so it can manage both:
  - legacy PTY sessions
  - structured adapter-backed sessions
- Structured sessions now stream output into the same conversation store used by the rest of the product.
- Conversation transcript persistence remains the canonical source for live and completed output.

Primary file:

- `server/cabinet-daemon.ts`

### 2.4 Provider and Adapter Selection in Product UI

- Exposed provider adapter metadata through the providers API.
- Added runtime-selection helpers so UI can resolve:
  - provider defaults
  - available adapters per provider
  - explicit adapter override vs inherited default
- Exposed adapter/runtime selection in:
  - agent settings
  - custom agent creation
  - job editor flows
  - mission control agent dialogs

Key commits:

- `5428af5` - `feat: expose adapter selection in agent settings`
- `1e0f1a3` - `feat: expose adapter selection in mission control dialogs`

### 2.5 Legacy Execution Preserved as Optional / Experimental

- Legacy CLI paths are still available for backwards compatibility.
- The intended direction is:
  - structured adapters become the default path
  - legacy CLI execution remains an escape hatch
  - legacy should be treated as optional / experimental, not as the core runtime model
- `WebTerminal` is also being preserved intentionally as a product capability for interactive sessions and future terminal-native features such as Cabinet-managed tmux-like workflows.
- The migration is away from **terminal-first task execution**, not away from the terminal itself.

Current default direction:

- Claude provider defaults to `claude_local`
- Codex provider defaults to `codex_local`
- Gemini provider defaults to `gemini_local`
- legacy provider execution remains available through legacy adapter entries
- Gemini currently ships only as a structured adapter; there is no legacy PTY Gemini path

### 2.6 Native Cabinet Live Session UI

- Replaced task live-session rendering that previously depended on `WebTerminal`.
- Added a native Cabinet session renderer that:
  - polls conversation detail from persisted transcript data
  - renders live transcript output using Cabinet-aware formatting
  - automatically switches into structured result view once the run finishes
- Refactored the live/result fetch logic into a shared component:
  - `src/components/agents/conversation-session-view.tsx`

Shared rendering pieces:

- `src/components/agents/conversation-live-view.tsx`
- `src/components/agents/conversation-content-viewer.tsx`
- `src/lib/agents/transcript-parser.ts`

Surfaces now using the native Cabinet live view:

- `src/components/tasks/task-detail-panel.tsx`
- `src/components/jobs/jobs-manager.tsx`
- `src/components/agents/agents-workspace.tsx`

Key commits:

- `85fa8d9` - `feat: replace task live terminal with native view`
- `2357097` - `feat: share native live conversation view`

Additional progress on this branch:

- Task live/detail sidebars now show the active runtime label when available:
  - model
  - provider
  - reasoning effort
- This makes it possible to tell at a glance which model/provider a running task is using without reopening the composer.

### 2.7 Shared Task Composer and Runtime Overrides

- Added per-task runtime overrides to manual conversation creation so task launchers can choose:
  - provider
  - adapter type
  - model
- Added a compact runtime picker with a brain icon trigger and shared provider/model selection UI to the shared task composers.
- Centralized client-side manual conversation creation in:
  - `src/lib/agents/conversation-client.ts`
- Moved the cabinet task entry point onto the shared composer stack so it now reuses:
  - `useComposer`
  - `ComposerInput`
  - `TaskRuntimePicker`
- Preserved cabinet-specific behavior while sharing the implementation:
  - `@agent` switches the assigned cabinet agent
  - `@page` still becomes a tracked page mention
- Normalized task launch behavior across the task board, home screen, agents workspace, AI panel, and status-bar/editor entry points.
- Fixed an inconsistency where task-board "Start now" launches could drop page mentions that were present in the composer.

### 2.8 Runtime Picker UX Consolidation

- Continued unifying composer/runtime selection so the same runtime picker logic is reused across task-launch surfaces wherever possible.
- Replaced the earlier nested provider/model dropdown interaction with a more direct runtime matrix:
  - provider tabs across the top
  - model rows
  - effort columns
  - radio controls only where a model actually supports that effort level
- Added a compact selected-model summary row so the current choice stays visible while keeping the picker smaller and easier to scan.
- Codex models now expose their model-specific reasoning levels in the picker, including the extended `low` / `medium` / `high` / `extra high` options where the model supports them.
- Gemini models are selectable in the same shared picker, but currently expose no effort controls because the provider metadata does not yet define supported reasoning levels.

### 2.9 Provider Branding and Setup UX

- Added a shared `ProviderGlyph` component so provider identity is rendered consistently across the runtime picker and onboarding.
- Switched provider artwork to local bundled assets instead of remote image URLs:
  - `public/providers/claude.svg`
  - `public/providers/openai.png`
  - `public/providers/gemini.svg`
- This avoids `next/image` remote-host configuration issues and keeps provider icons available offline.
- Updated onboarding/provider setup to consume provider-defined install steps instead of hard-coded Claude/Codex-only instructions, which makes adding new providers less bespoke.

## 3. Current Architecture Direction

Cabinet now has the core pieces needed for multi-provider, multi-runtime execution:

- adapter registry layer
- structured provider implementations for Claude, Codex, and Gemini
- daemon support for structured detached sessions
- UI support for choosing runtimes per provider, model, and reasoning effort
- native transcript-based live rendering for the main conversation/task surfaces
- shared composer/runtime-selection logic instead of per-surface forks

This is the right base for adding more providers beyond Claude Code and Codex without continuing to duplicate provider-specific terminal orchestration logic.

## 4. Important Files Added or Centralized

Runtime and adapter layer:

- `src/lib/agents/adapters/`
- `src/lib/agents/provider-runtime.ts`
- `src/lib/agents/providers/gemini-cli.ts`
- `server/cabinet-daemon.ts`

Transcript and conversation rendering:

- `src/lib/agents/transcript-parser.ts`
- `src/components/agents/conversation-content-viewer.tsx`
- `src/components/agents/conversation-live-view.tsx`
- `src/components/agents/conversation-session-view.tsx`

Selection and configuration surfaces:

- `src/components/agents/agents-workspace.tsx`
- `src/components/agents/provider-glyph.tsx`
- `src/components/composer/composer-input.tsx`
- `src/components/composer/task-runtime-picker.tsx`
- `src/components/cabinets/cabinet-task-composer.tsx`
- `src/components/jobs/jobs-manager.tsx`
- `src/components/onboarding/onboarding-wizard.tsx`
- `src/components/tasks/task-detail-panel.tsx`
- `src/components/mission-control/create-agent-dialog.tsx`
- `src/components/mission-control/edit-agent-dialog.tsx`
- `src/lib/agents/conversation-client.ts`

## 5. Remaining Follow-Up Work

The migration is not fully complete yet. Important next steps:

- decide surface-by-surface which experiences should be transcript-first and which should remain terminal-first
- extend the native live-session renderer to the remaining `WebTerminal`-based conversation surfaces where interactivity is not actually required, such as:
  - `src/components/agents/agent-detail.tsx`
  - `src/components/agents/agent-live-panel.tsx`
  - any non-interactive portions of `src/components/ai-panel/ai-panel.tsx`
- keep evolving `WebTerminal` as a dedicated interactive subsystem for direct CLI usage, debugging, and future tmux-like Cabinet workflows
- add more providers on top of the adapter system, including deciding which ones should be structured-only versus having an experimental legacy path
- make the legacy runtime clearly labeled as optional / experimental in every relevant UI surface
- add more integration coverage around adapter selection and structured session lifecycle
- continue reducing any remaining assumptions that a provider must be a PTY-backed CLI
- decide how far reasoning-effort support should go per provider and whether some providers should expose only model choice with no effort controls

## 6. Commit Trail For This Migration

- `7cd6c31` - `feat: scaffold adapter foundation for agent runtime migration`
- `3e30f5a` - `feat: thread adapter metadata through daemon sessions`
- `5aa39a5` - `feat: run claude conversations through structured adapter sessions`
- `0a9e52c` - `feat: run codex conversations through structured adapter sessions`
- `5428af5` - `feat: expose adapter selection in agent settings`
- `1e0f1a3` - `feat: expose adapter selection in mission control dialogs`
- `85fa8d9` - `feat: replace task live terminal with native view`
- `2357097` - `feat: share native live conversation view`

## 7. Summary

Cabinet is no longer blocked on a terminal-first architecture for agent execution. The adapter layer, structured Claude/Codex/Gemini runtimes, daemon session generalization, shared runtime-selection UI, and native transcript-driven live views together form the first working version of a real multi-provider runtime model.

The old CLI path still exists, but the system direction is now clearly toward structured adapters as the default and legacy terminal execution as the optional fallback. The newest work on this branch pushes that direction further by making runtime choice visible in the task UI, unifying composer behavior, and proving that a third provider can be added without rebuilding the architecture around a bespoke terminal path.
