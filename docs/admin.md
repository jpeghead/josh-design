# Admin: job scanner, résumé generator, apply agent

A private, local-first operations panel at `/admin`. It is not a product
for visitors; it is Josh's own cockpit for the AI-builder job hunt. It
runs on his machine with `npm run dev`, keeps its data in `data/admin/`
(git-ignored), and is a 404 on any deployment where `ADMIN_SECRET` is
unset. Everything it writes about Josh stays on disk here.

## What the research said (October 2026)

- Parsers read a single column, top to bottom, from the text layer.
  Tables, sidebars, text boxes, icons, and headers/footers lose content;
  Workday is strictest, Lever most lenient, Greenhouse hides what sits in
  page headers. Keywords count in experience bullets, not only in a skills
  list; spell out acronyms once. Plain dates like `Jan 2023 – Mar 2025`.
  Save as text-layer PDF or .docx; build for the strictest parser.
- The roles this hunt wants are posted under a spread of titles. On the
  labs' own boards: `Product Designer, <AI product>` (Anthropic, OpenAI),
  `Design Engineer`, `Founding Designer`, `Product Design Lead`,
  `Creative Technologist`, `Prototyper`. The stretch band is `Forward
  Deployed Engineer`, `Applied AI Engineer`, `Product Engineer`,
  `Agent Engineer`, `Developer Experience`. Searching one literal title
  misses most of the market, so the scanner matches a taxonomy.
- Greenhouse, Ashby, and Lever expose keyless JSON for every board
  (verified live against Anthropic and OpenAI). Hacker News' monthly
  "Who is hiring" thread is reachable through the Algolia API.
- Prior art worth borrowing the shape of, not the code: ApplyPilot and
  procw/job-apply-agent (discover → score → tailor → fill, with a human
  confirming), career-ops (score 1–5 before applying), JSON Resume
  (schema + `resume-cli` scoring), Reactive Resume (schema + server PDF).

## Decisions

1. **Local only.** The apply agent drives a visible Chromium through
   Playwright; that cannot live on serverless, and the data is private.
   Production serves 404 for `/admin` unless `ADMIN_SECRET` is set.
2. **Deterministic first, model second.** Standard form fields (name,
   email, phone, links, résumé upload, EEO opt-outs) are filled by rules.
   Claude is used for scoring fit, editing résumés from instructions,
   tailoring to a posting, and answering a posting's free-text questions.
   With no `ANTHROPIC_API_KEY`, scanning and filling still work; scoring
   falls back to keyword rules and the panel says so.
3. **Review before submit, by default.** The agent fills everything,
   takes a screenshot, and stops. Josh presses Submit in the panel, or
   flips `autoSubmit` on a run. CAPTCHAs and login walls stop the run
   with a plain message; the agent never tries to get around them.
4. **Nothing invented.** Résumé content comes from `profile.json`, seeded
   from `src/content/resume.ts` and `src/lib/data.ts`. The editing prompt
   forbids new employers, dates, clients, or metrics; tailoring may
   reorder, reword, and select, never add facts.
5. **Two personas, one profile.** `designer-who-builds` leads with product
   design and shows AI building as the edge; `ai-builder` leads with the
   builds and shows design leadership as the foundation. Each is a
   selection and ordering over the same bullet bank.

## Layout

```
src/app/admin/            pages (jobs, résumés, applications, setup)
src/app/api/admin/        route handlers (scan, score, resume/*, apply/*)
src/lib/admin/store.ts    JSON files in data/admin/, one per collection
src/lib/admin/boards.ts   Greenhouse / Ashby / Lever / HN fetchers → Posting
src/lib/admin/taxonomy.ts title and keyword rules, persona hint, stretch flag
src/lib/admin/score.ts    rule score; Claude score when a key exists
src/lib/admin/resume/     profile seed, personas, renderer (HTML), pdf, docx, txt
src/lib/admin/apply/      Playwright agent: read form → fill → review → submit
data/admin/               companies.json, jobs.json, profile.json,
                          resumes/*.json, out/*.pdf, applications.json
```

## Data

- `Posting`: id, source, company, title, location, remote, url, applyUrl,
  description (text), postedAt, firstSeen, lastSeen, score, scoreWhy,
  persona, stretch, status (`new | saved | hidden | applied`), notes.
- `Profile`: contact, links, summaries by persona, experience (company,
  role, dates, bullets with tags), skills by group, education, books,
  builds. Bullets carry tags so tailoring can select by posting keywords.
- `Resume`: id, persona, label, createdAt, basedOn, instruction, data
  (the rendered subset of Profile, already ordered), exports.
- `Application`: id, postingId, resumeId, status (`filling | review |
  submitted | failed | stopped`), steps[], screenshots[], answers{},
  startedAt, finishedAt, error.

## Adding companies

Setup → "Add a company": type a name or careers URL; `lib/admin/discover.ts`
probes Greenhouse, Ashby, Lever, Workable, and Rippling with a few slug
spellings and offers the boards that answered. Companies without a public
board on those five cannot be scanned (Workday, SmartRecruiters, iCIMS, and
custom careers pages have no keyless listing); paste the exact slug from the
careers URL if a guess misses. Rippling lists titles only, so the scanner
fetches details just for titles the taxonomy keeps. A probe of about 300
AI-company names in October 2026 found four on Workable (Hugging Face,
Jasper, Writesonic, D-ID) and one on Rippling (Rippling itself), so those
two systems are a long tail, not a second Greenhouse.

## Pipeline and briefs

- **Applications** is a board by stage (applied, replied, interviewing,
  offer, rejected, withdrawn) with a "due today" list from each run's
  `nextAction`. Submitting from the panel sets `stage: applied` and a
  follow-up ten days out; "I submitted it myself" does the same for a run you
  finished in the browser. `PATCH /api/admin/apply/[id]/stage` edits stage,
  next action, and notes; `DELETE /api/admin/apply/[id]` removes a run.
- **Brief** on a posting row (`/admin/jobs/[id]/brief`) writes an interview
  brief from the posting text and the profile only: the role in two lines,
  what they are hiring for, where Josh is strong and thin with proof, eight
  likely questions, six to ask them, a thirty-second intro. Anything the
  posting does not say is prefixed "verify:". Stored in
  `data/admin/briefs.json`, one per posting, rewritten on request.

## Verified systems (dry runs, never submitted)

- **Greenhouse** (Anthropic): 12 of 25 fields by rule, custom dropdowns read
  and set, written answers drafted. Invisible reCAPTCHA is present on every
  Greenhouse form and is not a blocker; only a visible challenge is.
- **Ashby** (Render): 11 of 14, labels found by walking ancestors, cover
  letter drafted and uploaded, Cloudflare Turnstile reported as a note.
- **Lever** (Contentsquare): 14 of 20, ✱ markers and wrapped option text
  stripped from labels, X handle from the site's socials, location
  autocomplete and country select filled. Lever's visible hCaptcha is a
  real blocker: tick it in the browser, then Submit from the panel.
- Model calls use `thinking: between_tools` so short budgets go to the
  answer; the first cover-letter attempt spent its whole budget thinking.
