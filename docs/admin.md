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

## The résumé, as a document

What screeners read in October 2026, from the sources below (practitioner
blogs, no vendor documentation exists): parsing still comes first, and
LLM-based ranking sits on top of it. So the file is one column, real text,
standard headings (Summary, Experience, Projects, Skills, Publications,
Education), contact in the body not a header, one date format on the same
line as the employer, round bullets, no tables, columns, icons, text boxes,
or images, and honest quantified bullets that match LinkedIn (hidden
keywords are now a detected signal). On that shape sits the site's type:
Instrument Serif for the name and role titles, Geist for everything else,
embedded in the PDF as data URIs (both OFL, files in `src/app/fonts`).
Three things the first draft got wrong and `pdftotext` caught: wide tracking
on headings extracts as "P U B L I C A T I O N S" (tracking is now 0.04em),
a "→" in a title pulled a system font into the PDF (a role written "A → B"
renders as title B with "joined as A"), and "★" did the same ("stars").
`/admin/resumes` shows the PDF's own pages (poppler's `pdftoppm`, cached by
a hash of the rendered HTML) with a persona toggle and a computed list of
what differs; a base per persona is built from the record on first view;
tailored versions hang off a posting and are named
`Josh-Whitehead-Resume-Company.pdf`. Check any change with
`pdftotext file.pdf - | head` and `pdffonts file.pdf`.

Sources read: atsverification.com (AI screening 2026, format guide, date
formats), resumeats.net (ATS vs AI, Greenhouse formatting), jobloo.co
(five ATS reverse-engineered, one vs two columns), resumemate.io (two-column
tests), jobscan.co (AI screening), sapia.ai (screening 2026),
madegooddesigns.com (resume design 2026), Greenhouse support (unsuccessful
parse). None are primary; the checklist is the overlap between them.

## Templates and the A/B

`lib/admin/resume/templates.ts` holds ten settings of the same document
(Story, Eyebrow, Grotesk, Editorial, Rules, Compact, Airy, Ledger, Ink,
Monochrome). Each is CSS over the one renderer, plus one structural flag
(Ledger sets dates flush right on the title line, still after the title
in reading order); all are one column of real text with standard headings,
so they parse alike, and each was measured to hold two pages on both bases.
The studio previews the actual HTML in a frame (selectable text), switches
templates live, and saves the choice to the résumé. With "Rotate templates
across applications" on (`data/admin/settings.json`, default on),
`lib/admin/resume/ab.ts` gives each new run the least-used template so the
ten stay balanced; the run records `template`, and the tailored version
records `keywords`, so the numbers on Applications read response rate by
template (the visual test) and by how much of the posting's language the
résumé carried, next to persona and board (the language test). Twenty or
so submissions before the differences mean anything.

The document is white on purpose: PDFs print and parse as white pages with
dark text, and a dark page would invert on paper and confuse some parsers;
the dark ground is the studio, not the file.

## The record

`src/lib/admin/resume/record.ts` is the verified record: every claim a résumé
or application may make, gathered 2026-10-15 from LinkedIn, the 2026 résumé
PDF, and the site. Numbers are Josh's own published numbers (Spin: +40%
usage, +60% signups, 84 cities, team of 10; Hush: 200 reviews at 3.5★ to
50K+ at 4.8★, Android at 30%+ of revenue; Saucey: referrals +65%, tickets
−90%; NationBuilder: the $6.25M a16z raise; Boneyard: 20–60 commits a day
across 3–10 projects, the Veo dialogue-density fix, OLO's founding team).
Dates come from `src/lib/data.ts`, which is the locked timeline; LinkedIn
and the old résumé say Boneyard began May 2023 and Spin spanned 2018–2023,
and that disagreement is Josh's to settle. The seed merges the record by
company; "Reseed" on Setup rebuilds the profile from it while keeping the
answers Josh typed.

## Scoring, second pass

Rules alone top out at 72 and penalize admin surfaces (IT, HRIS, payroll,
ads) without AI in the title, so an unscored posting never outranks a
Claude-scored one. Claude's brief now says what the hunt is for, in order:
agent-experience and AI-product design, design engineer, founding designer,
prototyper, forward-deployed design, product engineer on an AI product, all
at AI-native companies; generic design at a company where AI is a feature
scores under 50; roles outside the US score under 40 unless remote
worldwide (the posting carries a US_OK flag). The taxonomy gained the AI
titles (agent experience, AI product designer, design technologist,
prototyper, founding designer, product engineer on AI) and stretch titles
(founding engineer, AI PM, DevRel, prompt engineer, solutions designer).
Each posting carries `ai`, the count of AI words in title and description;
"AI is the work" on the jobs page filters to three or more. `POST
/api/admin/score?n=300` scores up to 300 at a time, AI-heavy first.

## Freshness

The jobs page runs one scan on load when the last scan is more than twelve
hours old, so there is no scheduler to keep alive. Workable rate-limits by
IP and a 429 can last well over an hour; the fetch helper retries once, and
failed boards are listed under the scan summary and picked up next time.

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

## The queue

Tick postings on the Jobs page and press Prepare: `POST /api/admin/apply/batch`
queues them and a worker (`lib/admin/apply/queue.ts`, one per process)
prepares them one at a time in a headless Chromium, each with its own copy
of the sign-in profile under `data/admin/browser-runs/<id>` (removed on
Stop, Submit, or failure). Runs stop at review with a full-page screenshot
and the field list; `/admin/queue` shows one at a time with every field
editable, "Set on the form" pushes edits to the live page
(`PATCH /api/admin/apply/[id]/fields`), Submit sends, Drop stops, and
"Open visibly" starts the same job again in a window for anything the
queue cannot reach (a CAPTCHA, a sign-in). At most six wait live at once.
The résumé is tailored for every application, at the moment the run
starts: `lib/admin/resume/tailor.ts` derives a version from the current
approved base for the posting's persona (the posting's words where they are
true of the record, bullets reordered, nothing added), measures the real
PDF, and trims from the oldest roles until it holds two pages. The run's
card says "Tailored for X · 16/20 of the posting's terms" with a link. A
version already made for that posting from the current base is reused;
edit the base and the next run re-tailors from the new one. The headed
flow (Apply) does the same. Cover letters are named
`Josh-Whitehead-Cover-Letter-Company.pdf`.

## Learning, practice, numbers

- **Verdicts.** ↑/↓ on a job row (keys u/d) or the job page stores
  `verdict` on the posting. Claude's scoring brief carries up to 24 of them
  as examples ("WANTS / DOES NOT WANT: title at company, his note"), so the
  ranking drifts toward Josh's taste; "Re-rank with my calls" forgets
  Claude's scores above 50 for un-judged postings and rescores 300 with the
  examples in. Verified: a down-voted HRIS posting went 55 → 33 with the
  reason citing the call.
- **Practice.** `/admin/jobs/[id]/practice` is a practice interview:
  one question at a time from the posting and the brief, a three-line
  critique after each answer that flags claims not in the record, saved per
  posting in `data/admin/practice.json`.
- **Numbers.** Applications shows the funnel once anything is submitted:
  response rate, interviews, median days to a reply, by résumé persona and
  by board. Stage changes are timestamped in `stageAt`.

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
- **Rippling** (Rippling, Product Design Lead): 13 of 16, résumé and cover
  letter into hidden drop-zone inputs, location picked from the place search,
  all four self-identification dropdowns set to "Choose not to disclose",
  text-message consent set to No. Rippling's dropdowns ignore Escape, so the
  agent now closes any open list before clicking the next control; the first
  run picked "Female" for Gender because the previous list was still open
  under the click. Labels come from `<span id="field-N-label">`.
- Model calls use `thinking: between_tools` so short budgets go to the
  answer; the first cover-letter attempt spent its whole budget thinking.
