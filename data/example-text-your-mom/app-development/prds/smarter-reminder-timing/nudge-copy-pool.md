---
title: Nudge Copy Pool
created: '2026-04-17T00:00:00Z'
modified: '2026-04-17T00:00:00Z'
tags:
  - copy
  - notifications
  - prd
  - reminders
order: 2
---
# Nudge Copy Pool

Supporting **US-3: Contextual Nudge Copy** from the Smarter Reminder Timing PRD. Rotation pools, 20+ per relationship type. No banned words (task, schedule, productivity, alert). Humor allowed. Guilt never weaponized. Reply-before-the-guilt-spiral thread runs through all of it.

Copy slots below use these tokens (engineering-ready):

- `{name}` — contact's display name
- `{days}` — integer days since last contact
- `{week_phrase}` — formatted elapsed phrase ("a few days", "about a week", "almost two weeks", "a minute")

---

## Parent pool (id: `parent_*`)

Default tone: warm, a little knowing, never guilt-amplifying. "You get it." register.

| ID | Copy |
|---|---|
| parent_01 | Hey — it's been {week_phrase} since you texted {name}. Send something dumb. 💬 |
| parent_02 | {name} noticed. We both know {name} noticed. A quick hi does a lot. |
| parent_03 | Small text, big relief. {name} would love to hear from you. |
| parent_04 | Soft reminder: {name} is thinking about you. Your turn. |
| parent_05 | A bad text is better than no text. Send the bad text. |
| parent_06 | It's been {week_phrase}. The reply doesn't have to be clever. It just has to exist. |
| parent_07 | {name} is not keeping score. But they are noticing. One line counts. |
| parent_08 | Lower the bar: a meme, a photo, a "thinking of you." Done. |
| parent_09 | The longer you wait, the bigger the text has to feel. Send a small one now. |
| parent_10 | Hey. {name}. Three words is enough. |
| parent_11 | You meant to text {name} yesterday. You still can. |
| parent_12 | {name} has been on your mind. Let them know, briefly. |
| parent_13 | Quick nudge — it's been {week_phrase}. "hey ❤️" works. |
| parent_14 | No pressure. Just: {name} would like a hello today. |
| parent_15 | Soft landing: one photo of something they'd smile at. That's the whole text. |
| parent_16 | If you're reading this and not texting {name}, you already know. 🙂 |
| parent_17 | {name} is not a task. They're just {name}. Send a hi. |
| parent_18 | {week_phrase} gap. Close it with anything. The app won't judge the message. |
| parent_19 | They raised you. They can handle a typo. Just text them. |
| parent_20 | Send the "thinking of you" text before it becomes an "I'm sorry I haven't texted" text. |
| parent_21 | {name} is performing patience. Break the streak of silence. |
| parent_22 | Tiny gesture. Giant relief. Text {name}. |

---

## Friend pool (id: `friend_*`)

Default tone: lighter, jokier, zero obligation. Closer to how friends actually talk.

| ID | Copy |
|---|---|
| friend_01 | It's been {week_phrase} since you talked to {name}. Rude. Affectionately rude. |
| friend_02 | Send {name} the dumbest meme you've seen today. That is a full interaction. |
| friend_03 | {name} is in your life. Remind them with a one-liner. |
| friend_04 | Low-stakes ping for {name}. No reply required. |
| friend_05 | Tell {name} something. Anything. "hi you" is a valid text. |
| friend_06 | You owe {name} exactly one stupid text. Pay up. |
| friend_07 | {name} would be stoked to hear from you right now. Small text, huge value. |
| friend_08 | Reminder: {name} exists and would like to hear your nonsense. |
| friend_09 | It's been {week_phrase}. The "wait am I still friends with you" text is funny. Send it. |
| friend_10 | Breaking: {name} misses you. Confirmed by science. Send a word. |
| friend_11 | Nudge — {name}. Go. Now. One line. |
| friend_12 | {name} hasn't heard from you in {week_phrase}. Fix it with an emoji. Seriously. |
| friend_13 | "Hey weirdo" is a complete sentence. Send it to {name}. |
| friend_14 | Text {name} before you convince yourself it's been too long. It hasn't. |
| friend_15 | Remember {name}? Cool person. Been a minute. Say hi. |
| friend_16 | {name} would like a ping. Exactly the bar you think it is. |
| friend_17 | The right amount of effort for this text: almost none. |
| friend_18 | {name} deserves the bad joke you just thought of. Share it. |
| friend_19 | Log reopened: {name}. Short text available at zero cost. |
| friend_20 | You are overthinking the reply to {name}. Send a heart and move on. |
| friend_21 | {name} is not mad. {name} is just ready to be texted. |
| friend_22 | Friendship tax, due today: one (1) stupid message to {name}. |

---

## Sibling pool (id: `sibling_*`)

Default tone: familial, sarcastic-but-kind, the "we both know" register. Less ceremony than parent, more intimacy than friend.

| ID | Copy |
|---|---|
| sibling_01 | It's been {week_phrase}. Text {name}. Say anything. They'll reply with "lol". |
| sibling_02 | {name} hasn't heard from you in {week_phrase}. You know how this ends. |
| sibling_03 | Your sibling. Your business. But: hi {name}? |
| sibling_04 | Send {name} a cursed photo. Sibling love language. |
| sibling_05 | {name} is about to text you first and you'll feel weird about it. Beat them to it. |
| sibling_06 | {week_phrase} since the last one-line text to {name}. Restore the cadence. |
| sibling_07 | Tiny check-in: is {name} alive, are you alive, great. Text them. |
| sibling_08 | {name} does not need a whole update. "you good?" is a whole text. |
| sibling_09 | Reminder that {name} grew up with you and will forgive any and all weird texts. |
| sibling_10 | {name} exists. You exist. Connect the two via thumb. |
| sibling_11 | Mom is going to ask if you've talked to {name}. Get ahead of it. |
| sibling_12 | You keep meaning to text {name}. Here's the nudge you were outsourcing. |
| sibling_13 | {name}. Two words. Go. |
| sibling_14 | {name} hasn't heard from you in {week_phrase}. That's a sibling-level crime. Minor. But real. |
| sibling_15 | The bar is on the floor. Text {name} anything. |
| sibling_16 | Don't make {name} send the "you alive?" text first. |
| sibling_17 | Text {name}: "thinking of you". They'll make fun of you. That's the point. |
| sibling_18 | Sibling ping for {name}. No context required. |
| sibling_19 | "oi" is a text. Send it to {name}. |
| sibling_20 | {name} is due for a weird sibling check-in. That's you. |
| sibling_21 | {week_phrase} is long enough. Short text, {name}, now. |
| sibling_22 | {name} knows you too well to be impressed by effort. Send a bad text. |

---

## Partner pool (id: `partner_*`)

Default tone: softer, zero irony about care. Romantic relationships don't need the jokes as much — warmth carries it.

| ID | Copy |
|---|---|
| partner_01 | Send {name} one line. The sweet kind. They'd love it right now. |
| partner_02 | It's been {week_phrase} since you sent {name} a "thinking of you". Now's good. |
| partner_03 | Quick reminder to send {name} something warm. No occasion needed. |
| partner_04 | {name} would light up at an unprompted text right now. Small gift, costs nothing. |
| partner_05 | "I love you, that's all" is a complete text. Send it to {name}. |
| partner_06 | Nudge: tell {name} something specific you noticed recently. Specifics land hardest. |
| partner_07 | {name} is always there. Show them you are too, in one line. |
| partner_08 | A "checking in on you ❤️" goes further than you think. Send it. |
| partner_09 | Soft ping: what do you want {name} to know today? Tell them. |
| partner_10 | {name} doesn't need a grand gesture. A short, kind text is the gesture. |
| partner_11 | Three-word text to {name}: "thinking about you." |
| partner_12 | Unprompted "hey, love you" energy. For {name}. Right now. |
| partner_13 | {name} will smile at this for longer than it takes to send. |
| partner_14 | Not a big reply. A small one. "you ok?" with a heart. |
| partner_15 | Remind {name} they're on your mind. Keep it short. Keep it real. |
| partner_16 | One sentence to {name}. The one you almost sent yesterday. |
| partner_17 | "thinking about you" is a complete thought. Send it. |
| partner_18 | {name} would rather hear something small today than something perfect next week. |
| partner_19 | Send {name} the thing you just thought of. That's the text. |
| partner_20 | The smallest "hi ❤️" can carry the whole day. Send it. |
| partner_21 | {name} isn't keeping count. But tiny texts build the weather. |
| partner_22 | Reach out to {name}. One line. No setup. |

---

## Rotation rules (copy-side)

Rules below are for engineering; copy reasoning included so timing team can tune.

1. **Never repeat the last variant.** Store `last_nudge_variant_id` per contact (already in PRD).
2. **Prefer variants that include `{week_phrase}` when `days ≥ 5`.** Naming the gap makes the reminder feel observant, not robotic.
3. **Prefer short variants (≤80 chars) on first notification of the day.** Long variants read as nagging if stacked.
4. **On suppressed → reactivated contacts, pick a gentle variant first.** For parents: `parent_01`, `parent_04`, `parent_14`. For friends: `friend_03`, `friend_07`, `friend_11`. For siblings: `sibling_03`, `sibling_07`, `sibling_20`. For partners: `partner_01`, `partner_05`, `partner_08`.
5. **Never use `{week_phrase}` when `days < 3`.** Reading "it's been a couple days" when it's been two days feels accusatory.
6. **Do not send any variant containing humor between 9 PM and the next morning.** If user opts into late-night delivery, prefer `partner_*` tone across all relationships — softer reads better late.

---

## Copy rules (lineage)

1. Banned words: task, schedule, productivity, alert, tracking, reminder frequency, notification permission
2. Allowed: nudge, text, ping, hi, check in, reply, small, warm, tiny
3. Tone test: would this text feel like a caring friend wrote it, or a calendar? Ship the former.
4. Reply-before-the-guilt-spiral thread runs through every pool. The app's job is to catch the user at day 3, not shame them at day 30.
