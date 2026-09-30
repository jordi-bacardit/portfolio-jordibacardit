---
# Same template for every project. Empty fields are hidden on the site: fill one in and it appears.
# Images: save them in src/assets/projects/lost-on-the-gates/ and write /src/assets/projects/lost-on-the-gates/<file>.
# Videos: upload them to YouTube and paste the link.
# TODO(content): status, type, role, team, dates, cover + coverAlt, trailer, gameplay clips, screenshots,
# itch.io link, repo, and the Overview / My role and responsibilities / Production sections.

# Basics
title: Lost On The Gates
summary: A World War II tank survival game built in Unity with C#.
status: # prototype | in-development | complete | upcoming
order: 1
featured: true

# Details (up to three appear on the card)
type: # course | personal | jam | tfg
engine: Unity
technologies:
  - C#
role:
team: # Solo, or size and disciplines
dates: # e.g. Sep 2025 – Jan 2026

# Media
cover: # /src/assets/projects/lost-on-the-gates/cover.jpg
coverAlt: # what the cover shows (required with a cover)
trailer: # YouTube link
trailerPoster: # image on the trailer's Play button (uses the cover if empty)
gameplay: # YouTube clips
  # - video: https://www.youtube.com/watch?v=...
  #   title: First level
gallery: # screenshots
  # - image: /src/assets/projects/lost-on-the-gates/screenshot-1.jpg
  #   alt: What the screenshot shows

# Links
links:
  build: # itch.io page: shows the "Play on itch.io" buttons
  repo:

# Page sections (always in this order; empty ones are hidden)
overview:
responsibilities:
production:
highlights:
  - Tank gameplay.
  - Enemy AI built on Unity's NavMeshAgent.
  - Turret systems.
  - HUD.
  - Kill counter.
  - Prefabs for the game's objects.
---
