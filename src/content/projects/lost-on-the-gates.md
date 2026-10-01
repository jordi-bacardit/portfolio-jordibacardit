---
# Same template for every project. Empty fields are hidden on the site: fill one in and it appears.
# Images: save them in src/assets/projects/lost-on-the-gates/ and write /src/assets/projects/lost-on-the-gates/<file>.
# Videos: upload them to YouTube and paste the link.
# Sources: the itch.io page (description, features, controls, status "Released"), the CV (My role)
# and the screenshots. Team of two, personal project and role confirmed by Jordi on 2026-10-01.
# TODO(content): year, the team's disciplines, what I did as Producer (for My role), gameplay video
# (YouTube link), repo, and the Development / Production / Challenges sections.

# Basics
title: Lost On The Gates
summary: A World War II tank survival game built in Unity with C#.
status: complete # prototype | in-development | complete | archived | upcoming
year: # e.g. 2026
order: 1
featured: true

# Key facts (hero; up to three also appear on the card)
role: Gameplay Programmer & Producer # e.g. Game Developer / Game Designer
team: 2 people # Solo project, or size and disciplines
engine: Unity
type: personal # course | personal | jam | tfg
dates: # e.g. Sep 2025 – Jan 2026 (shown only when there's no year)

# Technologies: a plain list, or grouped like
#   - category: Programming
#     items: [C#]
technologies:
  - C#
  - WebGL

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

# Page sections (always in this order; empty ones are hidden)
overview: | # 2–5 lines: what the game is, its goal, what you wanted to explore
  Lost On The Gates is a 3D World War II tank survival game developed in Unity. The player takes control of a tank and survives against enemy forces while navigating the battlefield and engaging hostile units.

  It was one of my first 3D game development projects, and it helped me explore the fundamentals of gameplay programming, enemy AI, navigation, combat systems and 3D level implementation.
responsibilities: # a list (- item) or a short text
  - Enemy AI.
  - Turret aiming and shooting.
  - Health and ammunition systems.
  - Kill tracking.
  - HUD.
  - Scene flow.
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
  - category: Gameplay
    items:
      - Tank movement, aiming and shooting.
      - Turret systems.
      - Survival-focused gameplay against enemy forces.
  - category: Enemy AI
    items:
      - Enemy AI and navigation built on Unity's NavMeshAgent.
  - category: UI and game flow
    items:
      - HUD with health and ammunition counters.
      - Kill counter, shown on the death screen.
      - Main menu, pause and death screens.
  - category: Structure
    items:
      - Prefabs for the game's objects.
result: | # factual: what was achieved and what kind of result it is (prototype, course project...)
  Released on itch.io as a WebGL build that plays in the browser. Controls: WASD to move, mouse to aim, left mouse button to fire, Esc to pause.

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
