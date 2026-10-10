# Learn to Play Bridge extraction notes

These rules were learned while extracting **More on Bidding → Responding to a 1 of a suit opening**. Reuse them when a new chapter is extracted.

## Source syntax

- Lesson text is usually stored after `|at|`, but some screens place ordinary text directly after `|nt|`. Extract both. `|cs|N` immediately before the text supplies the source palette index.
- `|ia|...|at|` is an auction diagram and `|ih|...|at|` is a hand diagram. The closing `|at|` can be followed by ordinary lesson text, so preserve that following text rather than discarding the whole segment.
- `^-{` opens a highlighted callout. A following segment beginning with `{` continues the same callout, often across source screens. `^-` closes it.
- Some grouped callouts have no final `^-`. If a later text segment does not begin with `{`, treat that as an implicit end of the callout. This prevents ordinary paragraphs from inheriting a preceding box.
- `cs=5` can be a colored callout, including the opening “Responding to a 1 of a suit opening” emphasis. Do not suppress it merely because it appears at the start of a chapter.
- Do not infer callouts from `cs` alone: the brace markers determine whether it is a box; `cs` only determines its color.
- When extracting a chapter or its review section, stop at the first following `|qx|` screen, regardless of its identifier. The next chapter may start with a normal lesson ID (for example `resp1nt`), not the expected next review ID.

## Regression examples

- The paired “1. You think that spades…” / “2. You have a strong enough…” blocks must both be callouts.
- The five “Responder must have 4 or more cards…” rule blocks must all be callouts, but the following “Here are some example hands…” text must not be.
- “It is true that hearts might not make the best trump suit…” is plain body text, not a callout.
- A diagram followed by explanatory prose must render both the diagram and the prose.

## Delivery

- Keep `bridge_study_test_data.js` (source data), `bridge_study_test.js` (parser/renderer), and `bridge_study_test.css` separate.
- Increment the CSS/JS query version in both HTML entry points when deploying parser or style changes, so desktop and mobile do not retain different cached renderers.
## Study layers

- Keep three distinct views: full lesson flow, embedded lesson quizzes, and the source chapter's separate Review and exercises section.
- Card hands use bold Arial; lesson prose and auctions remain Arial-family.

- Render Review exercises in scroll order without typed answers; never expose control markers such as |ht|.

- Preserve source order when rendering a screen: interleave narrative text, hand diagrams, and auction diagrams by their original offsets. Normalize line-broken control markers before parsing so tokens such as |ht| never leak into lesson text.

- In Review exercises, automatically order each detected question as: question auction (?), hand (|ih|), prompt (|lb|), answer auction, explanation. This is intentionally different from raw layout and matches the lesson-study flow.

- Positional control codes such as ^B, ^N, ^C, ^D, and ^P are not lesson text; strip them. Consecutive hand blocks or auction blocks may be grouped into a wrapping horizontal row to reproduce source layouts.
