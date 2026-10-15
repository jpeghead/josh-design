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
