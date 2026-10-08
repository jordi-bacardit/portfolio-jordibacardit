<!--
  CLAUDE.md para Claude Code (extensión de VS Code o terminal). Va en la raíz del proyecto.
  Claude lo lee al empezar cada sesión. Los comentarios HTML como este no le llegan:
  úsalos para tus notas. Busca "TODO" y rellena lo que sepas; lo que no sepas, déjalo
  como está: Claude lo tratará como un hueco y no se lo inventará.
  Pon también .mcp.json en la raíz: conecta Claude Code con la documentación
  oficial y actualizada de Astro.
-->

# Jordi Bacardit — Game Portfolio

Personal portfolio of Jordi Bacardit, student of Multimedia, Applications & Video Games Engineering at Universitat de Vic (UVic), Spain. Its job is to help me land a game design internship or junior role in the European games industry. Game design is the area I'm working towards (changed 2026-10-02; before, the site was about game production), backed by production and technical skills. I'm not a game designer yet: never present me as "Game Designer" on its own, as if it were my current job title (a role on a specific project, like "Game Designer & Producer" on Lost On The Gates, is fine). Studio recruiters and producers will skim it in a few minutes, usually from a job application, so judge every decision by one question: does this help them understand who I am and trust what they see?

## Working agreement

- Reply to me in Spanish. Code, comments, commit messages and all website copy in English.
- Read the relevant files before editing and follow the patterns already in the repo. If the code contradicts this file, point it out and ask instead of silently changing either.
- Make the smallest clean change that solves the task. Don't refactor, rename, restyle or reorganize anything outside it.
- Before changing the layout system, the design tokens or more than ~3 files, show me a short plan and wait for my OK.
- Ask before installing dependencies, committing, pushing, deleting files, or making identity-level design decisions (fonts, palette, logo use, page layouts).
- End every task with: files changed, how to check the result, and every `TODO(content)` you added.

## Commands

- `npm run dev`: dev server at http://localhost:4321
- `npm run build`: production build; must pass before a task counts as done
- `npm run preview`: serve the built site locally
- `npx astro check`: type-checks `.astro` and `.ts` files (needs `@astrojs/check`; ask before installing it)

When you start the dev server yourself, use background mode so it doesn't block the terminal: `npx astro dev --background`. Manage it with `npx astro dev stop`, `npx astro dev status` and `npx astro dev logs`.

<!-- TODO: cambia npm si usas pnpm o yarn. -->

## Astro

This is an Astro project: follow the major version in `package.json` (current release: Astro 7). Much of what you know about Astro predates versions 6 and 7, so these rules override your defaults:

- When unsure whether an Astro API is current, check it with the `astro-docs` MCP server (`search_astro_docs`) or the official docs before writing code. If `package.json` shows Astro 5 or older, tell me before writing version-specific code; upgrade only with my OK (`npx @astrojs/upgrade`).
- Static output. `.astro` components only: no React, Vue or Svelte integrations and no `client:*` islands. The 3D village at `/play` uses plain Three.js (`three`, approved 2026-10-07) inside processed scripts, loaded only on `/play`.
- Content collections use the Content Layer API: `src/content.config.ts`, `glob()` from `astro/loaders`, `z` from `astro/zod`, the schema's `image()` helper for cover images, `entry.id` and `render(entry)`. Never the legacy API (`src/content/config.ts`, `type: 'content'`, `entry.slug`, `entry.render()`).
- `/work/[slug]` is generated from the projects collection with `getStaticPaths()`: adding a project means adding one entry file, with no code changes.
- One base layout in `src/layouts/` owns `<html>`, `<head>` (title, description, Open Graph, canonical built from `Astro.site`), fonts, skip link, header and footer. Pages pass `title` and `description` as props.
- The header marks the active page by comparing `Astro.url.pathname`; no JS.
- Styles go in each component's scoped `<style>`; tokens, reset and base typography only in `src/styles/`.
- Client scripts are processed `<script>` tags inside components (Astro bundles them); `is:inline` only when a script must run before paint.
- Images: `<Image />` or `<Picture />` from `astro:assets`, sources in `src/assets/`. Lazy-load below the fold; load the hero image eagerly. `public/` only for files that need a fixed URL (CV PDF, favicon, OG image, robots.txt).
- Fonts: Astro's Fonts API (`fonts` in `astro.config.mjs`, `<Font />` in the base layout). It serves the files from the site itself, so there are no third-party font requests.
- Astro 7's compiler is strict: close every non-void tag and never nest invalid HTML (e.g. a `<div>` inside a `<p>`); it won't fix it for you.
- Astro 7 strips whitespace between elements JSX-style, so inline elements on separate lines render glued together. Add `{" "}` where a space is needed, e.g. between links in a sentence.
- Official integrations (e.g. sitemap) via `npx astro add <name>`, only with my OK. `src/fetch.ts` is reserved by Astro 7.
- Page transitions: native cross-document view transitions in CSS (`@view-transition { navigation: auto; }` inside `@media (prefers-reduced-motion: no-preference)`). Don't add `<ClientRouter />` unless I ask.

## Code conventions

- Don't add a CSS framework or animation library. If the repo already uses one (e.g. Tailwind), keep it and never add a second.
- Repeated UI is a component: buttons, links, project metadata, nav and footer share one set of components and states. No duplicated markup.
- Content lives in data, not in markup. My personal info and links live in one file (`src/data/site.ts` or the existing equivalent), never hardcoded in components.
- Design tokens (colors, fonts, type scale, spacing) are CSS custom properties in one stylesheet. Components use tokens only: no raw hex values or font-family names in components.
- JavaScript only for real interactivity (mobile menu, small enhancements). Content and navigation must work with JS disabled.
- No third-party scripts, trackers or embeds without asking: they cost performance and, in the EU, bring GDPR and consent obligations.
- Never download or hotlink images from the web. Use only images that are in the repo. Exception (2026-10-07): 3D models, textures and sounds for `/play` may come from legal free packs (CC0 preferred: KayKit, Kenney, Quaternius). Check each pack's licence first, store the files in the repo and list every pack with its licence in the credits shown in `/play`. Nothing from commercial games (no assets, names or logos).

## Content truth: never invent

Recruiters check details. One invented fact (a studio, a job, a team size, a date, a feature, a result, a player count) discredits the whole portfolio.

- Use only the facts below and content already in the repo. Anything missing becomes `TODO(content): <what's needed>` in the data file.
- On the page, fields and sections without data are hidden: never padded and never shown as a public placeholder (changed 2026-10-01, no `[TODO]` on the live site). What's missing stays as a `TODO(content)` note in the data file.
- You can draft copy (About, project summaries) from confirmed facts for my review. You can't invent opinions, motivations or anecdotes in my voice. Game Library picks and notes come only from me.
- Don't upgrade facts: a prototype stays a prototype, a course project isn't "shipped", having used a tool isn't expertise. Show technologies as a plain list: no skill bars, percentages or levels.

Confirmed facts:
- Focus: game design (working towards it), backed by production (scope, planning, task coordination, playtesting, cutting to finish on time) and technical skills (I've built projects in Unity and Unreal Engine).
- Studies: Multimedia, Applications & Video Games Engineering, UVic; graduating late 2027. Languages: Catalan and Spanish (native), English (advanced). Playing games since I was six; mostly RPGs, MMOs, shooters, sandbox and survival games.
- Tools and technologies I've worked with: Figma, Trello, Google Sheets, Unreal Engine, Unity, C#, C++, C, PHP, Laravel, JavaScript, Kotlin, Swift, Python, MySQL, MongoDB, Git, GitHub, Android Studio, Visual Studio Code, Tailwind CSS, Astro. Outside games I've built websites and apps, including iOS apps in Swift.
- Lost On The Gates: World War II tank survival game in Unity, team of 2, personal project, 3 months part-time, released on itch.io (https://thejorch.itch.io/lost-on-the-gates, WebGL). My role: Game Designer & Producer: concept, game design and project management (Trello, GitHub, near-daily check-ins, WhatsApp), health and ammunition, kill tracking, HUD, scene flow, sound integration, lighting and atmosphere, playtests with friends, the itch.io release and the trailer; I helped build the tank and the enemies. My teammate led the tank setup (movement and turret) and the enemy system (AI with NavMeshAgent, navigation, spawning). The map is a third-party asset pack. The design decisions, playtesting changes, scope cut (multiplayer) and postmortem in `src/content/projects/lost-on-the-gates.md` are mine. Trailer: https://youtu.be/rlXHXNEyGjY; a gameplay video exists locally. Unknown: year/dates.
- Finn Adventure: my first game, a 2D pixel platformer made solo in Unity in 1.5 months, personal project, released on itch.io (https://thejorch.itch.io/finn-adventure, WebGL). Role: solo developer (design, programming, level design). Three levels and a boss; difficulty grows through level layout (harder jumps, timing, more enemies); the boss gets faster each hit. It has a single checkpoint: don't mention checkpoints. Controls A/D and Space. Trailer: https://youtu.be/ulvRNFzOxEM; a gameplay video exists locally. Unknown: year/dates.
- Unreal Engine gameplay prototype: an actor/trigger system; reaching the trigger restarts the level. Nothing else confirmed. Listed under Prototypes, kept as a short description.
- TFG (Final Degree Project): a small RPG where you talk to AI-driven NPCs by typing, with no pre-written lines. Planned, January – June 2027 (roadmap in its project file). Not built yet: always labelled Planned / In development / TFG; no screenshots, features or results until they exist.
- Domain: https://jordibacardit.com (hosted on Netlify, deployed from GitHub `main`).
- Contact and CV (from my CV, `public/cv/jordi-bacardit-cv.pdf`): email jordibacardit12@gmail.com, LinkedIn https://www.linkedin.com/in/jordi-bacardit/, based in Barcelona, Spain, open to relocation. Other CV details (other projects, work experience) are not approved for the site yet: ask before using them. The CV source is `Downloads\Jordi_Bacardit_CV_source.html` (printed to PDF with Edge).
- GitHub: https://github.com/jordi-bacardit

<!-- Cuando confirmes datos (rol, fechas, equipo, herramientas de producción...), añádelos arriba o en los archivos de datos. -->

## Site map

<!-- Si tus rutas actuales son otras, conserva las tuyas y actualiza esta lista. -->

- `/` Home. The first screen answers in seconds: who (JORDI BACARDIT), what (Game Design, backed by production and technical skills), what for (open to game design internships and junior roles). No "Welcome to my portfolio". Then the main projects (no prototypes) and a way into About. The header logo and name link here.
- Home gate (chosen 2026-10-07, `Intro.astro`): on `/` only, only with JS and whenever the site is opened (changed 2026-10-08 from once per session: typed, a link from elsewhere, a new tab or a reload; not when coming back to `/` from inside the site, e.g. the logo, Read in `/play` or the back button), the name assembles and becomes a Play / Read menu (Read selected by default; arrows + Enter, mouse, touch; a click, Enter or Esc skips to the menu; Esc on the menu = Read). Read lifts the gate off the classic page, which is in the DOM underneath from the start; Play goes to `/play`. After the first time in a browser it's the short version (straight to the menu). Without WebGL, Play is disabled with a note; with reduced motion there's no animation and a note recommends Read. Deep links never see the gate.
- `/play`: the 3D village (a small medieval village at nightfall; every project is a place). Full screen without the site header and footer (`BaseLayout bare`). Reads the same project files and `site.ts`, so adding a project adds it there too. Always has a "Read" button back to `/` and a quest board listing every place, which opens HTML panels (`PlayDialog.astro`, native `<dialog>`); the 3D world is drawn behind them, so the panels work even without WebGL.
  - The village (rebuilt 2026-10-07 after Jordi found the first version too toy-like; finished 2026-10-07 with interiors, more people and touch controls): a late-dusk medieval village in a forest, close third-person camera over the shoulder (mouse look with Pointer Lock; pressing Alt toggles a free cursor; on touch, a stick on the left half and drag to look on the right), an unarmed adventurer (chosen 2026-10-08 instead of the hooded ranger: the ranger outfit without its hood, dyed blue; no weapons; the free outfit pack has no armoured knight), about 20 villagers outdoors (market, field, woodcutter, guards, walkers) and 10 indoors, a market in the Market Square (chosen 2026-10-08: a lane of four stalls on the High Street's line with a cart at its end, the old tree and its benches by the tavern, a supply wagon on the east side), place-name banners (rooms included), E (or tapping the prompt) talks to whoever is near (short fictional lines; anything they say about Jordi only points to where things are) or uses what's near, Q opens the quest board, M toggles the sound (off by default, remembered in `localStorage`). Five buildings can be entered: The Rusty Tankard (tavern), The Smithy, The Old Library, The Herbalist's Cottage and The Hall of Works; the tower stays closed (too small inside for the camera). Where the portfolio lives (chosen 2026-10-08, `places.ts`): every project is a framed picture in the Hall of Works (its cover, or a parchment with title, status and summary while it has none; the first project by `order` is the big one on the back wall; a new project gets a frame with no code change, up to 7 frames; beyond that a warning in development asks for more slots in `places.ts`; the quest board fits any number of notes in two rows), About = the portrait and lectern in the library, Skills = a board in the smithy listing `technologies`, Contact = the note on the tavern's counter, plus a physical quest board on the square; each opens its HTML panel. Signposts, a sign over every enterable door and the quest board's "In the …" lines show the way. Sound (chosen 2026-10-08): CC0 recordings, not synthesis (`src/assets/play/sounds/`, built with `tools/build-play-sounds.mjs`), downloaded only when turned on: music outdoors and in the tavern, crickets, wind, fires, the tavern crowd, the smith's hammer and the woodcutter's axe in time with their animations, pages in the library, a distant dog and night bird, footsteps by surface; other spaces come through muffled. Code in `src/scripts/play/`: `game.ts` (entry, loading, bloom, adaptive quality), `layout.ts` (the map: houses, tower, props, market, field, lanterns, villagers, named regions), `world.ts` (sky, light, ground, buildings, gate), `house.ts` (houses and tower from kit pieces; enterable ones get an open door, floor, ceiling and a `Room`), `interiors.ts` (furniture, fires, candles and people per room), `places.ts` (the portfolio in the village: frames, portrait, boards, signs, interaction points), `lights.ts` (a fixed pool of point lights shared by every flame, only the current room's or the street's), `kit.ts` (instanced pieces), `nature.ts` (terrain, forest, grass tufts, crops, wind), `characters.ts` (dressing people from modular parts), `npcs.ts` (villagers, held props, talking, culling), `player.ts`, `camera.ts`, `input.ts` (keyboard and touch stick), `sound.ts` (Web Audio: loops, positional one-shots, muffling between spaces), `collisions.ts`, `effects.ts` (smoke, fireflies, flames), `palette.ts` (the world's colours and the grading of the packs; UI colours stay tokens). Assets in `src/assets/play/` (Quaternius Medieval Village MegaKit, Fantasy Props MegaKit, Stylized Nature MegaKit, Modular Character Outfits - Fantasy, Universal Base Characters, Universal Animation Library 1 and 2, all CC0; Poly Haven ground textures, CC0; sounds from Kenney and OpenGameArt, all CC0), rebuilt with the scripts in `tools/` from the packs' Standard downloads; credits in `src/data/credits.ts` and the Credits panel. `@types/three` is a dev dependency (types only). `astro.config.mjs` raises Vite's chunk warning to 800 KB (three.js is one ~690 KB chunk loaded only on `/play`) and pre-bundles the three.js modules for the dev server.
- `/about`: who I am, what I study, the game design goal plus production and technical skills, the opportunities I'm after, and a Game Library block that links to `/game-library`. Tools as a compact list grouped by category (design & production, engines, languages, web and data, tools). Primary action: the CV.
- `/work` and `/work/[slug]`: the most important section. Video game projects only.
- `/game-library`: a personal, curated archive of games I play and that shaped me. Not a second portfolio and not a Steam-style store grid. Not in the nav or footer: reached from About, with a "← Back to About" link at the top.
- `/contact`: internships, junior roles, networking, collaboration. Not a freelance page (no services, no pricing). Email (mailto), LinkedIn, GitHub. No contact form unless I ask.
- Nav: ABOUT, WORK, CONTACT, in that order (Game Library left the nav and footer on 2026-10-02). Active page marked with the accent and `aria-current="page"`. The CV is not in the nav: it lives in About and the footer.
- Footer: name, role line, nav links, LinkedIn, GitHub, CV, © year.

## Work

My positioning is game design, so project pages must show design thinking (concept, decisions, playtesting, iteration), backed by production and technical notes, not only code.

- Required fields: title, slug (file name), one-line summary, order. Status (prototype / in-development / complete → "Completed" / released → "Released" / archived / planned → "Planned") is expected but hidden while unknown.
- Optional fields: year, role, team (size and disciplines; empty for solo), duration, engine, type (course / personal / jam / TFG), dates (shown as "Timeline", only without a year), `card` (shorter `summary` and `role` for the Home and Work cards), cover image and alt, trailer and gameplay clips (YouTube links, click-to-load via `YouTubeVideo.astro`, poster images are local), gallery (images or GIFs; GIFs are served unconverted to keep the animation), `sections`, `technicalNotes`, links (`build` usually itch.io, `steam`, `download`, `repo`, and `other` as label + url).
- Projects are edited directly in their files (not in the CMS). Every project file carries the same full template: all fields present, empty ones hidden on the page. The case study is the file's own ordered `sections` list (changed 2026-10-02): each section has a title and any of `text`, `diagram` (steps, levers, caption: `ProgressionDiagram.astro`), `lists` (optional label + items; labelled lists sit side by side), `entries` (optional label + title + text) and `note`, all rendered by the one shared template `src/pages/work/[slug].astro`.
- Page order: hero (title, summary, key facts in `ProjectMeta`, main links) → main visual (trailer if any, else cover) → the file's sections, in order → Gameplay (extra clips only) → Screenshots (gallery: screenshots and GIFs) → Technical notes → Links → previous/next.
- Prototypes (status `prototype`) are listed apart: a small "Prototypes" section at the end of `/work` (`mini` cards), never on Home, never in previous/next, never with the "Case study in progress" badge.
- A built project missing media or write-up shows a "Case study in progress" badge (`caseStudyInProgress()` in `src/lib/projects.ts`); it disappears once filled.

Index: one featured project shown large, the rest secondary, never a grid of identical cards. Artwork and screenshots dominate; a card carries the title, its one-line text (`card.summary`, or the summary) and up to four metadata values (Status, Timeline, Role, Team, Engine: the ones that exist), nothing more. Detail page: large hero image, one-line pitch, metadata as a `<dl>` beside the content on desktop, sections below, previous/next project navigation.

## Game Library

Shows how I think about games as a medium. Entry fields: title, platforms, genre, status (playing / played / favourite / formative), my note (why it matters to me), optional image (my own screenshots preferred). The layout can be more experimental than Work but uses the same tokens, type and components. Propose options before changing it.

- Layout (chosen 2026-09-30): one library of cards sorted by title, with a search by title. Each card: 16:9 screenshot with a status badge, title, genre, platforms, and my note clipped to four lines with "Read more". No status filters or groups.

- Entries live in `src/content/games/` (one Markdown file each) and I add, edit and delete them through Sveltia CMS at `/administrador` (page `src/pages/administrador.astro`, config `public/administrador/config.yml`). It commits to GitHub, so only accounts with write access to the repo can save. The site stays static.
- The CMS uploads images to `src/assets/projects/` and `src/assets/games/` and writes `/src/assets/...` paths, which `image()` resolves. Keep the CMS config and the collection schemas in `src/content.config.ts` in sync.

## Copy

- Site copy in English. Write "video game(s)" or "game(s)"; job titles as the industry writes them ("Producer", "Game Producer").
- Hero label: "Game Design" (`site.role`, also used in the header, footer, intro, home `<title>` and the OG image). It states my focus without claiming a title I haven't held yet.
- Confident, concrete, specific: show what I built and decided, not adjectives about me. No clichés ("passionate developer", "hard-working student", "I've always loved video games"). No emoji.
- Buttons say what happens: "Download CV (PDF)", "Email me", "View project".

<!-- Si prefieres "videogame" o quieres "Game Producer" en el hero, cámbialo arriba. TODO: frase final del hero. -->

## Visual system

Direction: dark, cinematic, editorial. Closer to a game studio's site or a game's official page than to a developer template or a SaaS landing page.

- Near-black background, off-white text, one accent: `#d8ff00`. Exact values live in the tokens file; if it doesn't exist yet, propose a palette before creating it.
- The accent is a signature, used small: active nav, focus rings, hover states, the key CTA, thin indicators. Never large fills, section backgrounds or running text.
- Text on an accent background always uses the dark background color (white on `#d8ff00` fails contrast).
- Two type roles: a strong, compact display face for large headings and a highly readable body face. If fonts aren't set yet, propose two or three pairings first; avoid the usual defaults (Inter, Roboto, Poppins, Montserrat, Space Grotesk).
- Chosen: Familjen Grotesk (headings and body) + JetBrains Mono only for small labels (metadata `<dt>`, buttons, header role/status). The look follows my previous site `jordi_portfolio_v9` (Desktop): huge tight uppercase headings ending in a period, featured card plus stacked cards, large portrait on About. Its copy is not confirmed content.
- Body text 16–18px, line-height around 1.5, lines under ~75 characters. Headings scale fluidly with `clamp()`.
- Layout: a strong grid, generous spacing, large imagery. Vary compositions between sections (featured plus secondary, full-bleed image, split screen, big type) instead of repeating one row of cards. Spend boldness on one element per page and keep the rest quiet.
- Logo: `src/assets/logo.png` (transparent PNG with a glow; `Logo.astro` shows it as a square crop). Use it in the header next to the name, in the footer and as the favicon (`public/favicon.ico`, `icon-192.png`, `apple-touch-icon.png`, generated from the logo). Never redesign or approximate it.

Near-black with an acid-green accent is currently one of the most common looks among templates and AI-generated sites, so color alone won't make this memorable. Distinctiveness has to come from my own game material, the logo and the typography, and from not stacking template habits on top. Each of these needs a real reason before it appears: identical rounded cards with soft shadows; gradients or glassmorphism; all-caps eyebrow labels above headings; 01/02/03 numbering on things that aren't a sequence; metadata joined with middle dots; "→" on every link; monospace for every small label; borders and dividers that don't separate anything meaningful.

## Motion

- At most one orchestrated moment per page, plus motion that answers the user: hover, focus, the menu, page transitions. No fade-up on every section.
- Approved motion (2026-09-30):
  - Home gate with my name (`Intro.astro`, replaced the plain intro on 2026-10-07): the letters assemble (about 1.5 s) and rise to make room for the Play / Read menu. The page is in the DOM underneath from the start; if the script never runs, CSS removes the gate after 5 s, so it can't trap anyone. The hero's own letter animation waits until the gate closes.
  - Page `<h1>`s assemble letter by letter (`SplitText.astro`); screen readers get the whole text.
  - Hover feedback on mouse devices (`Effects.astro`): letters decode on nav links, buttons and project titles (`data-scramble`), a cursor ring trails the pointer (the system cursor always stays), and a light follows the pointer on project cards (`data-spotlight`).
  - Native cross-document view transitions with a vertical wipe; the header stays put. A project card's title and cover morph into the project page's (`transitionStyles()` in `src/lib/projects.ts`); names must stay unique per page.
  - Contextual cursor: over `[data-cursor="View"]` (project cards) and `[data-cursor="Play"]` (videos) the ring fills and shows the label.
  - 404 is a game-over screen with a "Continue?" countdown home (10 s) that "Stay here" stops.
  - Static film grain on the background and a scroll progress line under the header.
- UI feedback 150–400 ms, ease-out; letter reveals up to ~800 ms. Image hover scale no more than 1.04.
- `prefers-reduced-motion: reduce` removes movement (instant, or opacity only).
- No scroll-jacking, no replacing the system cursor, no loading screens that block content (the home gate is the one approved exception, with the safeguards above; `/play` may show a loading screen with real progress, since it's opt-in).

## Responsive and accessibility: hard constraints

- Design each breakpoint instead of shrinking desktop. Check 320, 375, 768, 1024 and 1440px wide. Huge display words (DEVELOPMENT, GAME LIBRARY) must not overflow at 320px.
- Mobile menu: a real `<button>` with `aria-expanded` and `aria-controls`, keyboard operable, closes with Esc. Without JS the links stay reachable.
- Landmarks, one `<h1>` per page, no skipped heading levels, a skip link, `<html lang="en">`.
- Visible `:focus-visible` style on every interactive element (accent outline). Never remove an outline without a replacement.
- WCAG AA contrast: 4.5:1 for body text, 3:1 for large text and UI parts. Tap targets at least 44×44px.
- Meaningful images get descriptive alt text; decorative ones get `alt=""`. Links navigate, buttons act.
- If you have a browser or screenshot tool, check the result at those widths; if not, tell me exactly what to check by hand.

## SEO and performance

- Per page: unique `<title>` (e.g. "Work — Jordi Bacardit"), meta description, Open Graph and Twitter tags, canonical URL. Site-wide: favicon from the logo, default OG image 1200×630 (`public/og.jpg`: logo, name, role, portrait; pages can pass their own `image`), sitemap, robots.txt. `site` in the Astro config: `https://jordibacardit.com`.
- Target Lighthouse 90+ on mobile in every category. No layout shift from images or fonts.

## When rules pull in different directions

Truthful content, accessibility and usability (mobile included) are never traded away. After that: 1) clear positioning for a recruiter, 2) visual identity, 3) performance, 4) technical simplicity. Every design or technical choice should have a reason you can state in one sentence. If two options are equally good, choose the simpler one; if a choice changes the identity of the site, ask me.

## Done means

- `npm run build` passes with no new errors or warnings (and `npx astro check`, if installed).
- Checked at the widths above, with keyboard only, and with JS disabled.
- No invented content; new `TODO(content)` items listed in your summary.
