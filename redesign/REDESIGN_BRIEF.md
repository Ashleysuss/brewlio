# Brewlio redesign: brief for Claude Code

You are applying an approved visual and UX redesign to the existing Brewlio site in this repo (brewlio.com.au, hosted on GitHub Pages). The owner is Ashley. The design is final; your job is to implement it on the real site while keeping the existing quiz matching logic.

## Main goal

**More quiz completions.** Every decision below serves that: less on the homepage, question 1 on the homepage itself, fewer and lighter quiz steps, and a result page that pays off instead of dead-ending.

## What's in this folder

| Path | What it is |
|---|---|
| `redesign/css/brewlio.css` | The complete design system: tokens, light and dark themes, and all components. Use it as the site stylesheet (move it to wherever the site keeps CSS). |
| `redesign/reference/index.html` | Homepage markup to implement. |
| `redesign/reference/quiz.html` | One quiz step (question 2 of 5, espresso path) showing every quiz component. |
| `redesign/reference/result.html` | Result page with sample content for one answer path. |

Open the reference pages in a browser to see the target at any width. Toggle the OS dark mode to see the dark theme. The reference pages are static: they show structure and styling, not behaviour.

## Ground rules

1. **Start by reading the existing site.** Before editing anything, read `index.html`, `quiz.html`, `privacy.html` and the quiz JavaScript. Then summarise for Ashley how the current quiz works: its questions, option values, how answers are scored, and how a style is chosen. Propose how the new question flow (below) maps onto it. **Wait for Ashley's OK before changing any scoring or matching logic.**
2. **Keep the matching logic.** Restyle and restructure the UI around it. Don't rewrite how styles are chosen unless Ashley agrees.
3. **Static site, no build step.** GitHub Pages serves plain HTML, CSS and JS. Don't introduce frameworks, bundlers or npm dependencies.
4. **Keep URLs and SEO.** Keep `index.html`, `quiz.html` and `privacy.html` at their current paths. Keep the existing meta description, canonical, Open Graph and Twitter tags. Update `theme-color` to the two values in the reference `<head>`.
5. **Don't touch `CNAME`** (custom domain) or anything else the Pages setup relies on.
6. **Ask before deleting assets.** Remove references to unused media (see below), but ask before deleting files from `Assets/`.
7. **No third-party scripts without approval.** This includes email tools and analytics.
8. **Work on a branch** (for example `redesign`) and open a pull request. Don't push straight to the publishing branch.

## Design system

Everything lives in `brewlio.css`. Key points:

- **Type:** Archivo (condensed 75% width, weight 800, uppercase) for display headlines, Archivo for body, IBM Plex Mono for small labels. Loaded from Google Fonts. Copy the `<link>` tags from the reference `<head>`.
- **Colour tokens:** `--paper`, `--ink`, `--muted`, `--cell`, `--line-soft`, `--accent` (#FF5B1F signal orange), `--on-accent`. Orange is used for fills (buttons, selected answers, progress, the rule block) and never for small text on paper.
- **Dark mode follows the device setting** via `prefers-color-scheme`. It is a straight inversion: light areas become dark and vice versa, and orange stays the same. There is no toggle. Don't hard-code colours; always use the tokens so both themes work.
- **Structure:** 1.5px ink rules and boxed cells, square corners.
- **Layout:** mobile-first. The desktop layout starts at 960px (two-column hero, quiz and result). Content is max 1280px wide.
- **Accessibility baseline:** visible focus rings, skip link, 44px+ touch targets, reduced motion respected, text contrast of at least 4.5:1 in both themes.

## Page by page

### Homepage (`index.html`)

Sections, in order (see reference):

1. **Header:** wordmark, "HOW IT WORKS" (desktop only), "FOR ROASTERS", and a "FIND MY COFFEE STYLE →" button (desktop only).
2. **Hero:** headline "Coffee that fits your setup.", one supporting line, and **question 1 as a card** beside it (below it on mobile).
   - The tiles link to `quiz.html?brew=<value>`. Replace `espresso`, `manual-filter` and `immersion` with the real option values from the existing quiz.
   - "Something else" links to `quiz.html` with no parameter, so batch-filter and instant drinkers choose from the full question 1 list.
3. **How it works:** three steps (Your gear, Your taste, Your style).
4. **Rule block (orange):** "Fit-first. Never pay-to-play." plus the local-roasters point, with one CTA.
5. **Footer:** roaster pitch with a mailto link, plus Instagram, privacy link and location.

Remove:
- The styles carousel and its `comingsoon.mp4` placeholders.
- The separate "Built for real-world coffee", "Fewer bad bags" and "Why local roasters" sections. Their key message is merged into the hero and rule block.
- The duplicate CTAs. **Every quiz CTA is labelled "Find my coffee style"**, with no other variants.
- The "Finding your coffee style…" loading text at the top of the homepage.

### Quiz (`quiz.html`)

Proposed flow. Confirm it against the scoring before building (ground rule 1).

| # | Question | Change |
|---|---|---|
| 1 | How do you mostly brew? | Keep all current options. Skipped when arriving with `?brew=`. |
| 2 | What are you grinding with? | Keep. |
| 3 | Espresso machine tier | **Only shown if Q1 = espresso.** For other paths, pass whatever "not applicable / not sure" value the scoring expects. |
| 4 | How do you take your coffee? (milk) | Keep. |
| 5 | What flavours do you enjoy most? | Keep. |
| – | What roast do you usually enjoy? | **Remove.** Proposed: infer roast from flavour (juicy or clean → light, balanced or chocolatey → medium, rich and heavy → medium-dark). |
| – | How deep are you into coffee? | **Remove.** Proposed: infer from grinder and machine tier (pre-ground or blade → beginner, entry burr → comfortable, good burr → intermediate, high-end → advanced). |
| – | What ruins a coffee for you? | **Remove**, unless the scoring depends on it heavily. If so, report how much and let Ashley decide. |

So espresso drinkers answer 5 questions and everyone else answers 4. The counter and progress bar use the real total for the path (`--steps` on `.progress`).

Behaviour:
- **One question per screen**, using the components in `reference/quiz.html`: counter "Q.02 / 05", segmented progress bar, a chip for each earlier answer, condensed question headline, and a boxed option list.
- **Auto-advance:** when an answer is clicked or tapped, show the selected state for about 150ms, then go to the next question. Keyboard users move through the radio group with the arrow keys; **don't auto-advance on arrow-key changes**. Advance on Enter or Space instead.
- **After each step**, move focus to the new question heading (`tabindex="-1"`) and update the `aria-live` counter.
- **Back:** on mobile use the header back button; on desktop use the "PREVIOUS" button. Going back from Q2 when Q1 was pre-answered returns to Q1 on the quiz page, not the homepage.
- **"Not sure? Skip"** records the existing "not sure" value where one exists, otherwise leaves the answer empty.
- **Remove the per-question videos and images.** They are the main cause of the slow, heavy feel. No media in the quiz.
- **Keep answers in `sessionStorage`** so a refresh doesn't lose progress.
- **Remove the double intro** ("Let's find what actually fits" plus "Find your coffee style" plus repeated claims). Go straight into the first question.

### Result

Implement as a result state of `quiz.html` or a new `result.html`, whichever fits the existing code better. The URL should identify the style (for example `?style=sweet-and-balanced`) so the result can be shared and reloaded.

Content, top to bottom (see reference):

1. **Style card:** style name, one-line description, the person's setup summary (SETUP, MILK, TASTE), and a **"Share my style"** button. Use `navigator.share` where available; otherwise copy the link and confirm with "Link copied".
2. **Why it fits you:** up to three short lines tied to the person's grinder, milk and taste answers. Use the existing style descriptions if the code has them. If not, create a small copy map keyed by answer and flag the lines for Ashley to review. Sample lines are in the reference.
3. **On the bag:** roast level, tasting notes and roast date guidance for the style.
4. **Email capture ("Your roaster matches are nearly ready"):** this replaces the current dead end.
   - GitHub Pages can't process forms, so this needs a hosted email or form service.
   - **Ask Ashley which service to use** and swap in the endpoint for `[EMAIL_FORM_ENDPOINT]`.
   - Send the style with the email (hidden field).
   - Show success and error states in the `role="status"` line, in the site's voice. For example: "You're on the list." or "That email doesn't look right. Check it and try again."
   - Update `privacy.html` to say what's collected and why.
5. **Retake quiz:** a link in the header.

Style names already used on the site: Milk-friendly espresso, Bright & clean, Sweet & balanced, Rich & heavy. Use whatever the matching logic actually outputs.

### Privacy (`privacy.html`)

Restyle with the new stylesheet (site header and footer, body copy in a readable column of about 65 characters). Add the email collection note above.

## Copy

Use the copy in the reference pages as written. It's approved. Sentence case in body copy; uppercase only where the CSS applies it (display headlines, mono labels, buttons). Australian spelling (flavour).

## Acceptance checklist

- [ ] Homepage, quiz (every path: espresso, filter, immersion, other) and result work end to end.
- [ ] Arriving via each homepage tile starts at Q2 with the right chip; "Something else" starts at Q1.
- [ ] Espresso path shows 5 steps; other paths show 4, and the counter and progress match.
- [ ] Looks right at 390px (mobile) and 1440px (desktop), and nothing breaks from 320px to 1920px.
- [ ] Light and dark both correct (toggle the OS setting); no hard-coded colours outside the tokens.
- [ ] The whole quiz can be completed by keyboard alone; focus is always visible; screen reader announces question changes.
- [ ] No quiz media requests on the network tab; the quiz page loads fast on a throttled mobile connection.
- [ ] Share works on mobile (native sheet) and desktop (copy link).
- [ ] Email form submits to the chosen service and shows success and error states.
- [ ] Meta, OG and canonical tags preserved; `CNAME` untouched; no console errors.
- [ ] `redesign/` folder removed (or left unlinked) before merging, as Ashley prefers.

## Test and deploy

1. Test locally from the repo root: `python3 -m http.server 8000`, then open http://localhost:8000.
2. Commit on the `redesign` branch and open a pull request with a short summary and screenshots (mobile and desktop, light and dark).
3. When Ashley approves, merge into the branch GitHub Pages publishes from (check Settings → Pages). Pages redeploys automatically, usually within a few minutes.
4. The live site shows signs of Cloudflare in front of GitHub Pages (its email links use Cloudflare's email protection). If changes don't appear after deploy, purge the Cloudflare cache.
