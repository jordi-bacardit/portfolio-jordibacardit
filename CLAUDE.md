<!--
  CLAUDE.md para Claude Code (extensión de VS Code o terminal). Va en la raíz del proyecto.
  Claude lo lee al empezar cada sesión. Los comentarios HTML como este no le llegan:
  úsalos para tus notas. Busca "TODO" y rellena lo que sepas; lo que no sepas, déjalo
  como está: Claude lo tratará como un hueco y no se lo inventará.
  Pon también .mcp.json en la raíz: conecta Claude Code con la documentación
  oficial y actualizada de Astro.
-->

# Jordi Bacardit — Game Portfolio

Personal portfolio of Jordi Bacardit, student of Multimedia, Applications & Video Games Engineering at Universitat de Vic (UVic), Spain. Its job is to help me land an internship or junior role in the European games industry, focused on game production and backed by a technical game-development background. Studio recruiters and producers will skim it in a few minutes, usually from a job application, so judge every decision by one question: does this help them understand who I am and trust what they see?

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
- Static output. `.astro` components only: no React, Vue or Svelte integrations and no `client:*` islands.
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
- Never download or hotlink images from the web. Use only images that are in the repo.

## Content truth: never invent

Recruiters check details. One invented fact (a studio, a job, a team size, a date, a feature, a result, a player count) discredits the whole portfolio.

- Use only the facts below and content already in the repo. Anything missing becomes `TODO(content): <what's needed>` in the data file.
- On the page, optional fields and sections without data are hidden, never padded. Required ones render as a visible bracketed placeholder (`[TODO: role]`) that can't pass for real copy.
- You can draft copy (About, project summaries) from confirmed facts for my review. You can't invent opinions, motivations or anecdotes in my voice. Game Library picks and notes come only from me.
- Don't upgrade facts: a prototype stays a prototype, a course project isn't "shipped", having used a tool isn't expertise. Show technologies as a plain list: no skill bars, percentages or levels.

Confirmed facts:
- Focus: game production (producer, project coordination, planning, production pipelines, team coordination), with a technical game-development background.
- Tools and technologies I've worked with: Unreal Engine, Unity, C#, C++, C, PHP, Laravel, JavaScript, Kotlin, Python, MySQL, MongoDB, Git, GitHub, Android Studio, Visual Studio Code, Tailwind CSS, Astro.
- Lost On The Gates: World War II tank survival game, Unity and C#. Confirmed: tank gameplay, enemy AI with NavMeshAgent, turret systems, HUD, kill counter, prefabs. Unknown: my role, solo or team, context, dates, links, media.
- Unreal Engine gameplay prototype: an actor/trigger system; reaching the trigger restarts the level. Nothing else confirmed.
- TFG (Final Degree Project): AI and video games, not built yet. Two candidate directions: "ArtScan AI" (not defined; don't describe it) and a small Unreal Engine RPG with AI-driven NPCs. Always labelled Upcoming / In development / TFG. No screenshots, features or results.
- Still TODO: graduation year, email, LinkedIn URL, GitHub URL, CV file, domain.

<!-- Cuando confirmes datos (rol, fechas, equipo, herramientas de producción...), añádelos arriba o en los archivos de datos. -->

## Site map

<!-- Si tus rutas actuales son otras, conserva las tuyas y actualiza esta lista. -->

- `/` Home. The first screen answers in seconds: who (JORDI BACARDIT), what (Game Production / Game Development, technical background), what for (open to internships and junior roles). No "Welcome to my portfolio". Then featured work and a way into About. The header logo and name link here.
- `/about`: who I am, what I study, production focus plus technical background, the opportunities I'm after. Tech as a compact list grouped by category (engines, languages, web and data, tools). Primary action: the CV.
- `/work` and `/work/[slug]`: the most important section. Video game projects only.
- `/game-library`: a personal, curated archive of games I play and that shaped me. Not a second portfolio and not a Steam-style store grid.
- `/contact`: internships, junior roles, networking, collaboration. Not a freelance page (no services, no pricing). Email (mailto), LinkedIn, GitHub. No contact form unless I ask.
- Nav: ABOUT, WORK, GAME LIBRARY, CONTACT, in that order. Active page marked with the accent and `aria-current="page"`. The CV is not in the nav: it lives in About and the footer.
- Footer: name, role line, nav links, LinkedIn, GitHub, CV, © year.

## Work

My positioning is production, so project pages must show production thinking, not only code.

- Required fields: title, slug, one-line summary, status (prototype / in development / complete / upcoming).
- Optional fields: cover image and alt, trailer and gameplay clips (YouTube links, click-to-load via `YouTubeVideo.astro`, poster images are local), gallery, my role, engine, technologies, type (course / personal / jam / TFG), dates, team (solo, or size and disciplines), links (playable build, usually itch.io, and repo).
- Projects are edited directly in their files (not in the CMS). Every project file carries the same full template: all fields present, empty ones hidden on the page. The four optional sections are frontmatter fields (`overview`, `responsibilities`, `production`, `highlights`) rendered with fixed headings, not a free Markdown body.
- Optional sections: Overview; My role and responsibilities; Production (scope, planning, tools, what I cut and why, risks, what I'd do differently); Technical highlights.

Index: one featured project shown large, the rest secondary, never a grid of identical cards. Artwork and screenshots dominate; a card carries the title plus two or three metadata values, nothing more. Detail page: large hero image, one-line pitch, metadata as a `<dl>` beside the content on desktop, sections below, previous/next project navigation.

## Game Library

Shows how I think about games as a medium. Entry fields: title, platforms, genre, status (playing / played / favourite / formative), my note (why it matters to me), optional image (my own screenshots preferred). The layout can be more experimental than Work but uses the same tokens, type and components. Propose options before building it.

- Entries live in `src/content/games/` (one Markdown file each) and I add, edit and delete them through Sveltia CMS at `/administrador` (page `src/pages/administrador.astro`, config `public/administrador/config.yml`). It commits to GitHub, so only accounts with write access to the repo can save. The site stays static.
- The CMS uploads images to `src/assets/projects/` and `src/assets/games/` and writes `/src/assets/...` paths, which `image()` resolves. Keep the CMS config and the collection schemas in `src/content.config.ts` in sync.

## Copy

- Site copy in English. Write "video game(s)" or "game(s)"; job titles as the industry writes them ("Producer", "Game Producer").
- Hero: "Game Production / Game Development". It states my focus without claiming a title I haven't held yet.
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
  - Home intro with my name (`Intro.astro`): once per session, about 2 s, skipped by any click, key, scroll or touch, never without JS or with reduced motion. The page is in the DOM underneath from the start and the timeline is pure CSS, so it can't get stuck.
  - Page `<h1>`s assemble letter by letter (`SplitText.astro`); screen readers get the whole text.
  - Hover feedback on mouse devices (`Effects.astro`): letters decode on nav links, buttons and project titles (`data-scramble`), a cursor ring trails the pointer (the system cursor always stays), and a light follows the pointer on project cards (`data-spotlight`).
  - Native cross-document view transitions with a vertical wipe; the header stays put.
  - Static film grain on the background and a scroll progress line under the header.
- UI feedback 150–400 ms, ease-out; letter reveals up to ~800 ms. Image hover scale no more than 1.04.
- `prefers-reduced-motion: reduce` removes movement (instant, or opacity only).
- No scroll-jacking, no replacing the system cursor, no loading screens that block content.

## Responsive and accessibility: hard constraints

- Design each breakpoint instead of shrinking desktop. Check 320, 375, 768, 1024 and 1440px wide. Huge display words (DEVELOPMENT, GAME LIBRARY) must not overflow at 320px.
- Mobile menu: a real `<button>` with `aria-expanded` and `aria-controls`, keyboard operable, closes with Esc. Without JS the links stay reachable.
- Landmarks, one `<h1>` per page, no skipped heading levels, a skip link, `<html lang="en">`.
- Visible `:focus-visible` style on every interactive element (accent outline). Never remove an outline without a replacement.
- WCAG AA contrast: 4.5:1 for body text, 3:1 for large text and UI parts. Tap targets at least 44×44px.
- Meaningful images get descriptive alt text; decorative ones get `alt=""`. Links navigate, buttons act.
- If you have a browser or screenshot tool, check the result at those widths; if not, tell me exactly what to check by hand.

## SEO and performance

- Per page: unique `<title>` (e.g. "Work — Jordi Bacardit"), meta description, Open Graph and Twitter tags, canonical URL. Site-wide: favicon from the logo, default OG image 1200×630 (TODO), sitemap, robots.txt. `site` in the Astro config: TODO (domain).
- Target Lighthouse 90+ on mobile in every category. No layout shift from images or fonts.

## When rules pull in different directions

Truthful content, accessibility and usability (mobile included) are never traded away. After that: 1) clear positioning for a recruiter, 2) visual identity, 3) performance, 4) technical simplicity. Every design or technical choice should have a reason you can state in one sentence. If two options are equally good, choose the simpler one; if a choice changes the identity of the site, ask me.

## Done means

- `npm run build` passes with no new errors or warnings (and `npx astro check`, if installed).
- Checked at the widths above, with keyboard only, and with JS disabled.
- No invented content; new `TODO(content)` items listed in your summary.
