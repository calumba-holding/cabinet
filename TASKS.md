# Task Conversations — Build Log

Status tracker for the task conversation redesign. Source of truth for product intent is `data/TASK_CONVERSATIONS_PRD.md`. This file tracks what's shipped, what's gaps, and what's next.

Last updated: 2026-04-17

---

## What shipped

### Product design
- [x] **PRD** — `data/TASK_CONVERSATIONS_PRD.md` — goals, status state machine, on-disk schema, UI surfaces, behavior specs, API surface, adapter plan, phasing, success metrics.
- [x] **Interactive visual prototype** at `/tasks/demo` — mock data, validated chat layout, artifact rows, wrap-up card, token bar, composer behavior.

### Phase 1 — Schema + storage ✅
- [x] Types: `src/types/tasks.ts` — `TaskMeta`, `Turn`, `TurnArtifact`, `SessionHandle`, `ArtifactsIndex`, `TaskEvent`.
- [x] Storage: `src/lib/agents/task-store.ts` — `createTask`, `readTask`, `updateTask`, `appendTurn`, `updateTurn`, `setSessionHandle`, `listTaskMetas`, `deleteTask`.
- [x] On-disk layout under `data/{cabinet?}/.agents/.tasks/{id}/` — `task.md` frontmatter, `turns/NNN-{user|agent}.md`, `session.json`, `artifacts.json`, `events.log`.
- [x] Auto status transitions: agent reply with `awaitingInput` → `awaiting-input`; non-zero exit → `failed`; clean reply → `idle`; user reply → `running`.
- [x] Token aggregation across turns; denormalized artifacts index rebuilt on every turn.
- [x] 11 unit tests in `src/lib/agents/task-store.test.ts`.

### Phase 2 — API + SSE ✅
- [x] `GET /api/tasks` — list with filters (status, trigger, agent, cabinet, limit).
- [x] `POST /api/tasks` — create with first user turn; kicks off `runTaskTurn` in background.
- [x] `GET /api/tasks/[id]` — full task with turns + artifacts index + session handle.
- [x] `PATCH /api/tasks/[id]` — update title/summary/status with automatic `completedAt` handling.
- [x] `DELETE /api/tasks/[id]`.
- [x] `POST /api/tasks/[id]/turns` — append user or agent turn; kicks off runner on user turns.
- [x] `GET /api/tasks/[id]/events` — SSE stream with 15s heartbeat, subscribes to in-memory event bus.
- [x] In-memory event bus: `src/lib/agents/task-events.ts`, wired into every store write.

### Phase 3 — Full-page UI wired to real data ✅
- [x] Full-page route `/tasks/[id]` driven by `taskId` param.
- [x] `TaskConversationPage` component: initial fetch, SSE subscription, optimistic updates, error/loading states.
- [x] Mock-data refactored to the real `Task` shape — shared types between demo and live.
- [x] Composer POSTs real turns; Mark done + summary edit PATCH the API.
- [x] Client helpers: `src/lib/agents/task-client.ts` — `fetchTask`, `postTurn`, `patchTask`, `createTaskRequest`.
- [x] `/tasks/new` page with title + first-message form.

### Phase 4 — Adapter session continuity ✅
- [x] Claude local adapter (`src/lib/agents/adapters/claude-local.ts`) honors `ctx.sessionId` — passes `--resume <id>` when provided, else `--no-session-persistence`. `supportsSessionResume` flipped to `true`.
- [x] `src/lib/agents/task-runner.ts` — `runTaskTurn(taskId)`:
  - Loads task, picks adapter by `providerId` / `adapterType`.
  - Appends a pending agent turn, then executes adapter.
  - Resume mode (live session): sends only the latest user message.
  - Replay mode (fresh or non-resumable): concatenates full turn history.
  - Updates the turn with final content, tokens, sessionId, failure state.
  - Persists `SessionHandle` on success; marks `alive: false` when adapter signals `clearSession`.
- [x] Wired `POST /api/tasks` and `POST /api/tasks/[id]/turns` to fire `runTaskTurn` in the background (not awaited).
- [x] 4 unit tests in `src/lib/agents/task-runner.test.ts` covering fresh, resume, replay, failure.

### Phase 5 — Awaiting-input heuristic + auto-summary + token defaults ✅
- [x] `src/lib/agents/task-heuristics.ts`:
  - `looksLikeAwaitingInput(content)` — detects a clarifying question by checking the last non-code-fenced line ends with `?` and the content isn't mostly code.
  - `deriveSummary({ turns, existingSummary })` — 1-sentence rolling summary from the latest settled agent turn (or first user turn fallback), truncated to 180 chars.
- [x] Runner integration: every settled agent turn is heuristically marked; task summary regenerated unless user edited it in the last 5 minutes.
- [x] `createTask` defaults `runtime.contextWindow` to 200k so the token bar renders meaningful thresholds.
- [x] 9 heuristic tests + 3 integration tests.

### Polish + UX
- [x] **Composer pinned at bottom** — switched from `ScrollArea` to native flex+overflow so the textarea stays fixed while turns scroll above.
- [x] **Markdown rendering** for agent replies — new `src/components/tasks/conversation/markdown.tsx` uses the existing `markdownToHtml` pipeline (remark + GFM). Bold, code, lists, headings, blockquotes, links.
- [x] **Auto-growing textarea** — composer starts at 1 row (~36 px) and grows up to 240 px, then becomes scrollable.
- [x] **Wrap-up card** — context-aware "Looks like a good place to wrap up" card after the latest agent turn when `status = idle` and not dismissed.
- [x] **Token bar** — 80% amber, 95% red thresholds in the header.
- [x] **Tasks index at `/tasks`** — filter pills (All / Active / Awaiting / Done), status badge, runtime label, summary line, token usage, relative time, New-task button. Empty-state CTA.
- [x] **Default runtime** — `claude-opus-4-7 · claude-code · medium` applied on create so the detail header reads a real runtime from turn one.
- [x] **Recent tasks in sidebar** — up to 6 most-recent tasks with status dot + title under the existing "Tasks" header; scoped to the active cabinet when applicable.
- [x] **Artifact typography** — split paths into muted directory + bold filename so non-developers see the filename, devs still get the full path. Card background + ring on each artifact row. Mono reserved for actual shell commands.

### Tests
- Total: **28 unit tests**, all passing
  - `task-store.test.ts` — 11
  - `task-runner.test.ts` — 7
  - `task-heuristics.test.ts` — 9
  - `claude-local.test.ts` — 1 (existing, confirmed still green)

### Key files

```
src/
  app/
    api/tasks/
      route.ts                       GET list, POST create
      [id]/route.ts                  GET, PATCH, DELETE
      [id]/turns/route.ts            POST turn
      [id]/events/route.ts           SSE stream
    tasks/
      page.tsx                       /tasks index
      [id]/page.tsx                  /tasks/[id] route
      new/page.tsx                   /tasks/new form
  components/
    tasks/conversation/
      task-conversation-page.tsx     main chat UI
      turn-block.tsx                 single turn
      artifacts-list.tsx             artifacts tab
      task-composer-panel.tsx        sticky composer
      task-list.tsx                  /tasks index list
      markdown.tsx                   markdown renderer
      mock-data.ts                   /tasks/demo seed
    sidebar/
      recent-tasks.tsx               sidebar recent-tasks list
  lib/agents/
    task-store.ts                    on-disk storage
    task-store.test.ts
    task-runner.ts                   adapter execution
    task-runner.test.ts
    task-heuristics.ts               awaiting-input + summary
    task-heuristics.test.ts
    task-events.ts                   in-memory event bus
    task-client.ts                   browser helpers
    adapters/
      claude-local.ts                --resume wiring
  types/
    tasks.ts                         new types
data/
  TASK_CONVERSATIONS_PRD.md          product source of truth
```

---

## Known gaps / next candidates

These are called out as **non-goals** in the PRD for v1 but are the natural follow-ups:

- [ ] **Artifact extraction from the Claude stream** — parse tool-use events (Read / Edit / Write / Bash) from `claude-stream.ts` so real tasks' artifact rows populate with file edits + commands + tool calls instead of being empty. Biggest remaining visual-depth gap.
- [ ] **Codex adapter replay with provider quirks** — current replay is generic. Codex and Gemini would benefit from provider-tuned prompts when replaying history.
- [ ] **Quick-peek side panel refit** — the existing `TaskDetailPanel` still reads from the legacy `conversation-store`. Convert it to the new `task-store` data model (per PRD phase 6) so the editor-side glance and the full page share one source of truth.
- [ ] **Real auto-summary LLM call** — current `deriveSummary` is a heuristic (first sentence of the latest agent turn). PRD v2: swap for a Haiku call that produces a 1–2 sentence rolling summary, with user-edit debounce.
- [ ] **Structured "ask" tool for awaiting-input** — the heuristic (`?`-terminated last line) works but can false-positive. Replace with an explicit `<ask_user>` convention in the agent system prompt.
- [ ] **`/compact` action** — header button exists but is a no-op. Wire to an adapter-specific compaction (`claude /compact` for Claude Code; synthetic summary turn for Codex).
- [ ] **Runtime picker on `/tasks/new`** — let users override the default (`claude-opus-4-7`) with a model + effort dropdown, same pattern as the existing composer runtime picker.
- [ ] **Agents workspace convergence** — the existing `components/agents/` live + result views still use the legacy conversation pipeline. Migrate to the new task model OR retire the workspace in favor of `/tasks`.
- [ ] **Diff tab + Logs tab** — both are placeholders. Diff would render a unified diff of file artifacts across the task; Logs would render raw adapter stdout/stderr per turn.
- [ ] **Migration of legacy conversations** — one-off import of historical `.agents/.conversations/*` into the new tasks-as-directories format, behind a feature flag with a rollback window.

---

## Open product questions (from PRD)

- Should archived tasks contribute to the cumulative cabinet token cost dashboard?
- Do we expose adapter-specific session metadata (e.g. Claude `--print-mode` flags) in the task UI, or hide?
- When a job-triggered task auto-runs every hour, should each run be a separate task, or successive turns of the same task? (Leaning: separate tasks, linked via `parentJobId`.)

---

## Commit log (this build)

Most recent first — scoped to task-conversations work only:

```
53fea94  feat(sidebar): recent tasks list under Tasks header
fc93bcc  docs: progress entry for tasks index + runtime defaults
75d8b60  feat(tasks): tasks index at /tasks + default runtime (claude-opus-4-7)
ec32065  feat(tasks): auto-grow composer textarea from 1 row up to 240px
ebf005b  feat(tasks): markdown-render agent replies + pin composer with scrollable chat
613132b  feat(tasks): background task-runner + claude session resume
```

Several intermediate commits (phases 1–5 schema, storage, API, SSE, heuristics, PRD, prototype) are squashed into `613132b`.

On branch `main`, not yet pushed to `origin`.
