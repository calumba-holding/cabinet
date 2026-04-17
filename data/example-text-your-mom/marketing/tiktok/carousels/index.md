---
title: Carousel Designs
created: 2026-04-16T00:00:00Z
modified: 2026-04-16T00:00:00Z
tags: [carousels, design, tiktok, instagram]
order: 2
---

# Carousel Designs

Branded carousel slide sets for TikTok and Instagram. Each carousel is a self-contained HTML file — open in browser to preview all slides at 1080×1080px.

## Brand Notes (TikTok-specific)

Per creative briefs — these carousels use a dark/minimal iPhone-native aesthetic (not the warm parchment brand). Rationale: TikTok audience expects phone-native visuals; the product *is* a phone app.

| Design System | Value |
|---------------|-------|
| Background | `#0D0D0D` (near-black) |
| Surface | `#1C1C1E` (iOS dark card) |
| Text | `#F5F5F5` |
| Accent red | `#FF3B30` (iOS red / notification) |
| Accent green | `#30D158` (iOS green) |
| Type | Inter (matches iOS system font) |
| Code/labels | JetBrains Mono |

## Slide Patterns

Reusable pattern library — reference by name in future briefs to speed design.

| Pattern | When to use | Key elements |
|---------|-------------|--------------|
| **Lock screen** | Opening slides, notification-driven hooks | iOS lock screen frame, time/date, red notification badge, single notification preview |
| **Chat bubble** | Dialogue-driven slides, mom POV | iMessage bubbles (gray incoming, blue outgoing), read receipts, typing indicator |
| **Labeled inventory** | Listing chat contents with commentary | Emoji + bubble + yellow mono label, 4 rows max, highlight ring on comedic beat |
| **Stats card** | Data/insight slides, "the math" moments | Screen Time-style card, monospace numbers, subtle bar charts, % deltas |
| **Progress bar** | Hero moments, escalation reveals | Full-bleed fill, big number, minimal chrome |
| **Decision tree** | Systems-humor slides | Branching flowchart or two-button meme, deadpan mono labels |
| **Timeline** | Compounding/escalation (Day 1 → Day 4) | Horizontal bar with milestones, emotional labels on each node |
| **CTA** | Closer — product as the fix | Notification-style card, bold headline, handle/link visible |

**Rule:** Every carousel ends with a CTA pattern. Never skip the product tie.

---

## Carousels

| # | Title | Slides | Hook | Visual Style | Status |
|---|-------|--------|------|--------------|--------|
| 01 | [The Most Dangerous Text](./question-mark-danger/) | 5 | "The most dangerous text on earth is just a question mark" | Lock screen + chat bubbles + giant `?` | Designed |
| 02 | [The Fake Mental Math of Reply Guilt](./reply-guilt-math/) | 6 | "You are not busy, you are emotionally buffering" | Screen Time stats + progress bar + timer | Designed |
| 03 | [Group Chat Shame Spiral](./group-chat-shame/) | 5 | "Me opening the family group chat after 4 days of silence" | Labeled chat inventory + decision tree + timeline | Mockup (pre-script) |
