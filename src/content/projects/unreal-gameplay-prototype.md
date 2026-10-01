---
# Same template for every project. Empty fields are hidden on the site: fill one in and it appears.
# Images: save them in src/assets/projects/unreal-gameplay-prototype/ and write /src/assets/projects/unreal-gameplay-prototype/<file>.
# Videos: upload them to YouTube and paste the link.
# TODO(content): project name (if it has one), year, role, team, type, dates, technologies (C++ and/or Blueprints),
# cover + coverAlt, trailer, gameplay clips, screenshots, itch.io link, repo, and the Overview / My role /
# Development / Production / Challenges / Result sections.

# Basics
title: Unreal Engine Gameplay Prototype
summary: An actor and trigger system in Unreal Engine. Reaching the trigger restarts the level.
status: prototype # prototype | in-development | complete | archived | upcoming
year: # e.g. 2026
order: 2
featured: false

# Key facts (hero; up to three also appear on the card)
role: # e.g. Game Developer
team: # Solo project, or size and disciplines
engine: Unreal Engine
type: # course | personal | jam | tfg
dates: # e.g. Sep 2025 – Jan 2026 (shown only when there's no year)

# Technologies: a plain list, or grouped like
#   - category: Programming
#     items: [C++, Blueprints]
technologies:

# Media
cover: # /src/assets/projects/unreal-gameplay-prototype/cover.jpg
coverAlt: # what the cover shows (required with a cover)
trailer: # YouTube link: shown big right under the title
trailerPoster: # image on the trailer's Play button (uses the cover if empty)
gameplay: # more YouTube clips
  # - video: https://www.youtube.com/watch?v=...
  #   title: Trigger restarting the level
gallery: # screenshots or GIFs
  # - image: /src/assets/projects/unreal-gameplay-prototype/screenshot-1.jpg
  #   alt: What the screenshot shows

# Page sections (always in this order; empty ones are hidden)
overview: # 2–5 lines: what the prototype is, its goal, what you wanted to explore
responsibilities: # a list (- item) or a short text
development: # one entry per important part of the development
  # - title: Trigger system
  #   description: What you built and how.
production: # scope, planning, tools, what you cut and why, risks, what you'd do differently
challenges:
  # - title: Restarting the level
  #   challenge: What the problem was.
  #   solution: How you solved it.
# Technical highlights: a plain list, or grouped by category
highlights:
  - "An actor/trigger system: reaching the trigger restarts the level."
result: # factual: what was achieved and what kind of result it is

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
