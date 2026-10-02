---
# Same template for every project. Empty fields are hidden on the site: fill one in and it appears.
# Not built yet: always Planned / In development / TFG. No screenshots, videos, features or results
# until they exist. Sources: Jordi's brief of 2026-10-02 (concept, challenges, roadmap).
# TODO(content): final title, engine and AI technology once chosen.

# Basics
title: Final Degree Project
summary: A small RPG where you talk to AI-driven NPCs by typing, with no pre-written lines.
status: planned # prototype | in-development | complete | released | archived | planned
year: # e.g. 2027
order: 3
featured: false

# Key facts (hero)
role: # e.g. Game Designer, Solo developer
team: # size and disciplines; empty for a solo project
duration:
engine:
type: tfg # course | personal | jam | tfg
dates: January – June 2027 # shown as Timeline, only when there's no year

# Home and Work cards: shorter text and role (the page's are used when empty)
card:
  summary:
  role:

# Media
cover: # /src/assets/projects/final-degree-project/cover.jpg
coverAlt: # what the cover shows (required with a cover)
trailer: # YouTube link: shown big right under the title
trailerPoster: # image on the trailer's Play button (uses the cover if empty)
gameplay: # more YouTube clips
gallery: # screenshots or GIFs

# The case study: sections in this order. Each one has a title and any of
#   text (paragraphs) · diagram · lists (- label + items) · entries (- label + title + text) · note
sections:
  - title: Overview
    text: >-
      My Final Degree Project at UVic will be a small RPG built around AI-driven NPCs. Instead of
      picking from pre-written dialogue options, the player talks to characters by typing whatever
      they want, and the NPCs answer in character.

  - title: Design challenges I want to explore
    lists:
      - items:
          - Keeping NPCs in character and consistent with the world.
          - Stopping players from breaking the game through what they type.
          - "Making conversations matter: what you say should have real consequences in the game."

  - title: Planned roadmap
    entries:
      - label: Late January – February 2027
        title: Pre-production
        text: Concept, design document, choosing the AI technology and a first NPC you can talk to.
      - label: March 2027
        title: Vertical slice
        text: One small area, 2–3 NPCs and one quest.
      - label: April – May 2027
        title: Production
        text: More NPCs, memory and personality, quests linked to conversations.
      - label: May – June 2027
        title: Playtesting, polish, documentation and delivery
    note: This page will be updated as the project moves forward.

# Short closing notes, shown at the end next to the links
technicalNotes:

# Links (only the ones you fill in are shown)
links:
  build: # itch.io page: shows "Play on itch.io"
  steam:
  download:
  repo: # GitHub link shows "View on GitHub"
  other:
---
