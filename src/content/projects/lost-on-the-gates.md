---
# Same template for every project. Empty fields are hidden on the site: fill one in and it appears.
# Images: save them in src/assets/projects/lost-on-the-gates/ and write /src/assets/projects/lost-on-the-gates/<file>.
# Videos: upload them to YouTube and paste the link.
# Sources: Jordi's brief of 2026-10-02 (role, team split, design decisions, playtesting, production,
# postmortem), the itch.io page and the screenshots.
# TODO(content): year, gameplay video (YouTube link), repo.

# Basics
title: Lost On The Gates
summary: "A World War II tank survival game: hold out against endless enemy waves for as long as you can."
status: released # prototype | in-development | complete | released | archived | planned
year: # e.g. 2026
order: 1
featured: true

# Key facts (hero)
role: Game Designer & Producer # e.g. Game Designer, Solo developer
team: 2 people # size and disciplines; empty for a solo project
duration: 3 months (part-time)
engine: Unity
type: personal # course | personal | jam | tfg
dates: # shown as Timeline, only when there's no year

# Home and Work cards: shorter text and role (the page's are used when empty)
card:
  summary: "A WWII tank survival game: hold out against endless enemy waves for as long as you can."
  role:

# Media
cover: /src/assets/projects/lost-on-the-gates/07_gameplay_explosion.jpg
coverAlt: An explosion next to an enemy tank at the end of a burning street, seen from behind the player's tank.
trailer: https://youtu.be/rlXHXNEyGjY # YouTube link: shown big right under the title
trailerPoster: /src/assets/projects/lost-on-the-gates/key-art.jpg # image on the trailer's Play button (uses the cover if empty)
gameplay: # more YouTube clips
  # - video: https://www.youtube.com/watch?v=...
  #   title: First level
gallery: # screenshots or GIFs
  - image: /src/assets/projects/lost-on-the-gates/05_gameplay_advance.jpg
    alt: The player's tank advancing down a burning, ruined street, with the health (100/100) and ammo (30/30) counters in the HUD.
  - image: /src/assets/projects/lost-on-the-gates/06_gameplay_combat.jpg
    alt: A shell exploding ahead of the player's tank in a ruined street; the HUD shows 55/100 health and 22/30 ammo.
  - image: /src/assets/projects/lost-on-the-gates/08_gameplay_crossroads.jpg
    alt: The player's tank under fire at a crossroads in a burning town, with 39/100 health and 9/30 ammo in the HUD.
  - image: /src/assets/projects/lost-on-the-gates/03_ruined_street.png
    alt: The player's tank on a long street of ruined buildings under black smoke.
  - image: /src/assets/projects/lost-on-the-gates/04_enemy_tank.png
    alt: An enemy tank on a cobbled street next to rubble.
  - image: /src/assets/projects/lost-on-the-gates/01_main_menu.png
    alt: Main menu with Play, Options and Quit buttons over a ruined street.
  - image: /src/assets/projects/lost-on-the-gates/09_pause_menu.png
    alt: Pause menu with Play, Options and Quit buttons over the game.
  - image: /src/assets/projects/lost-on-the-gates/10_death_screen.png
    alt: "Death screen: You are dead, enemies destroyed: 17, with Play Again and Main Menu buttons."

# The case study: sections in this order. Each one has a title and any of
#   text (paragraphs) · diagram · lists (- label + items) · entries (- label + title + text) · note
sections:
  - title: Overview
    text: >-
      Lost On The Gates is a 3D World War II tank survival game made in Unity by a team of two. You
      command a tank on a fixed battlefield and fight enemy forces that keep arriving from three
      points of the map. There is no way to win: the goal is to last as long as you can.

  - title: The concept
    text: |
      I wanted to make a game about a vehicle instead of the usual humanoid character, and to challenge myself to finish it in a limited time. I considered a 1v1 mode, but it didn't fit our schedule. Endless waves on a fixed map was the format that best fit both the idea and the time we had.

      The setting had to give the tank survival idea a reason to exist. Holding out against endless waves reminded me of “The Last Tiger”, one of the War Stories in Battlefield V's campaign, so I went with World War II.

  - title: My role
    text: >-
      I came up with the concept, designed the game and managed the project. I also built the
      health, ammunition, HUD and scene systems, and helped my teammate build the tank and the
      enemies.
    lists:
      - label: What I did
        items:
          - Concept and game design
          - "Planning and coordination: tasks in Trello, version control on GitHub, regular check-ins with my teammate"
          - Health and ammunition systems
          - Kill tracking
          - HUD
          - "Scene flow: main menu, pause and death screens, and the transitions between them"
          - Sound integration
          - Lighting and atmosphere
          - Playtesting sessions with friends
          - Release on itch.io and the trailer
          - Helped build the tank and the enemy system
      - label: What my teammate did
        items:
          - Led the tank setup (movement and turret)
          - "Led the enemy system: AI, navigation and spawning"
    note: The battlefield map comes from a third-party asset pack.

  - title: Key design decisions
    entries:
      - title: Endless waves on a fixed map
        text: One map and one loop that can be replayed forever. It fit a short schedule, and the challenge comes from enemy pressure instead of content.
      - title: Random spawns
        text: Enemies appear at three points of the map, at random and in random numbers, so every run plays out differently.
      - title: Limited ammunition
        text: "We didn't want the player to be invincible. Every run ends in death; the question is how long you can hold out, and limited ammo is part of that pressure."
      - title: Minimal HUD
        text: "Only the essentials: health and ammunition during play, and your kill count on the death screen. Simple and clean."

  - title: Playtesting & iteration
    text: "We ran several playtests with friends and changed the game based on what we saw, including:"
    lists:
      - items:
          - The crosshair
          - Tank movement
          - Enemy navigation (NavMesh)
          - A darker atmosphere

  - title: Production
    lists:
      - items:
          - 3 months, part-time, alongside other commitments.
          - Trello for tasks, GitHub for version control and WhatsApp for day-to-day communication.
          - We met almost every day to review what we'd done and what came next. When we couldn't meet, we kept each other updated.
    entries:
      - title: Scope cut
        text: I wanted to add multiplayer, to play with friends and add some competition, but it didn't fit the schedule, so we cut it.

  - title: Postmortem
    lists:
      - label: What went well
        items:
          - The core idea worked, and I'm happy with the result.
      - label: What I'd do differently
        items:
          - Better planning, or a different split of tasks, would have let us finish sooner.
          - Difficulty is fixed. I'd add a round system with different advantages to choose from.
          - Better tank models and more natural enemy AI.

# Short closing notes, shown at the end next to the links
technicalNotes: |
  WebGL build on itch.io. Enemy navigation uses Unity's NavMeshAgent (led by my teammate), and the game is built on prefabs.

  Controls: WASD to move, mouse to aim, left mouse button to fire, Esc to pause.

# Links (only the ones you fill in are shown)
links:
  build: https://thejorch.itch.io/lost-on-the-gates # itch.io page: shows "Play on itch.io"
  steam:
  download:
  repo: # GitHub link shows "View on GitHub"
  other:
    # - label: Devlog
    #   url: https://...
---
