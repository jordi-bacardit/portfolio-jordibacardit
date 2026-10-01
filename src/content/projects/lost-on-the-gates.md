---
# Same template for every project. Empty fields are hidden on the site: fill one in and it appears.
# Images: save them in src/assets/projects/lost-on-the-gates/ and write /src/assets/projects/lost-on-the-gates/<file>.
# Videos: upload them to YouTube and paste the link.
# TODO(content): status, year, role, team, type, dates, cover + coverAlt, trailer, gameplay clips, screenshots,
# itch.io link, repo, and the Overview / My role / Development / Production / Challenges / Result sections.

# Basics
title: Lost On The Gates
summary: A World War II tank survival game built in Unity with C#.
status: # prototype | in-development | complete | archived | upcoming
year: # e.g. 2026
order: 1
featured: true

# Key facts (hero; up to three also appear on the card)
role: # e.g. Game Developer / Game Designer
team: # Solo project, or size and disciplines
engine: Unity
type: # course | personal | jam | tfg
dates: # e.g. Sep 2025 – Jan 2026 (shown only when there's no year)

# Technologies: a plain list, or grouped like
#   - category: Programming
#     items: [C#]
technologies:
  - C#

# Media
cover: # /src/assets/projects/lost-on-the-gates/cover.jpg
coverAlt: # what the cover shows (required with a cover)
trailer: # YouTube link: shown big right under the title
trailerPoster: # image on the trailer's Play button (uses the cover if empty)
gameplay: # more YouTube clips
  # - video: https://www.youtube.com/watch?v=...
  #   title: First level
gallery: # screenshots or GIFs
  # - image: /src/assets/projects/lost-on-the-gates/screenshot-1.jpg
  #   alt: What the screenshot shows

# Page sections (always in this order; empty ones are hidden)
overview: # 2–5 lines: what the game is, its goal, what you wanted to explore
responsibilities: # a list (- item) or a short text
development: # one entry per important part of the development
  # - title: Enemy AI
  #   description: What you built and how.
production: # scope, planning, tools, what you cut and why, risks, what you'd do differently
challenges:
  # - title: Enemy navigation
  #   challenge: What the problem was.
  #   solution: How you solved it.
# Technical highlights: a plain list, or grouped like
#   - category: AI
#     items: [Enemy AI built on Unity's NavMeshAgent.]
highlights:
  - Tank gameplay.
  - Enemy AI built on Unity's NavMeshAgent.
  - Turret systems.
  - HUD.
  - Kill counter.
  - Prefabs for the game's objects.
result: # factual: what was achieved and what kind of result it is (prototype, course project...)

# Links (only the ones you fill in are shown)
links:
  build: # itch.io page: shows "Play on itch.io"
  steam:
  download:
  repo: # GitHub link shows "View on GitHub"
  other:
    # - label: Devlog
    #   url: https://...
---
