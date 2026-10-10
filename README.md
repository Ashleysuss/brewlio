# Brewlio

Brewlio matches people to a coffee style that suits their gear and taste. It's a static site (HTML, CSS and vanilla JS, no build step) hosted on GitHub Pages at [brewlio.com.au](https://brewlio.com.au).

## Pages

- `index.html`: landing page. The first quiz question (how do you brew?) is shown as tiles that link to `quiz.html?brew=…` so the answer carries over.
- `quiz.html` + `quiz.js`: the quiz and the result screen.
- `privacy.html`: privacy policy.

All pages share `brewlio.css`. `Assets/heroimage.jpg` is the Open Graph/Twitter image.

## Quiz flow

1. One question per screen: brew method, grinder, machine (espresso only), milk, flavour. That's 5 questions for espresso and 4 for everyone else.
2. Roast preference and skill level aren't asked. They're inferred from the answers and fed into the matching logic.
3. The result screen shows the coffee style, why it fits, the matches, any trade-offs, a share option and an email signup.

Answers and session IDs are kept in `localStorage`/`sessionStorage`, so a refresh doesn't lose progress.

## Data

`quiz.js` talks to Supabase (the JS client loads from jsDelivr) using the public anon key. It only inserts rows:

- `quiz_events`: funnel events (start, view_question, answer, nav_next/prev, complete, match_click, share, email_*) along with the answers and match details.
- `email_signups`: emails from the result-screen signup form, with session/submission IDs and the matched style.

## Analytics

Every page loads [Plausible](https://plausible.io), which is cookie-free and privacy-friendly.

## Other files

- `CNAME`: custom domain for GitHub Pages.
- `robots.txt`, `sitemap.xml`: crawler and sitemap info.

## Running locally

Open `index.html` in a browser, or serve the folder (e.g. `npx serve .`) so query strings and storage behave like they do in production.
