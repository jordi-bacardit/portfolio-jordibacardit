---
# Same template for every project. Empty fields are hidden on the site: fill one in and it appears.
# Images: save them in src/assets/projects/finn-adventure/ and write /src/assets/projects/finn-adventure/<file>.
# Videos: upload them to YouTube and paste the link.
# Sources: the itch.io page (description, features, controls, status "Released"), the trailer and the
# screenshots. Solo and personal project confirmed by Jordi on 2026-10-02.
# TODO(content): year, role title, gameplay video (YouTube link), repo,
# and the Development / Production / Challenges sections.

# Basics
title: Finn Adventure
summary: "A 2D pixel platformer built in Unity with C#: three levels of obstacles and enemies, and a final boss."
status: complete # prototype | in-development | complete | archived | upcoming
year: # e.g. 2026
order: 2
featured: false

# Key facts (hero; up to three also appear on the card)
role: # e.g. Game Developer / Game Designer
team: Solo project # Solo project, or size and disciplines
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
cover: /src/assets/projects/finn-adventure/thumbnail.jpg
coverAlt: "Finn Adventure thumbnail: the game's title on a green ribbon above Finn jumping towards the grey rhino boss."
trailer: https://youtu.be/ulvRNFzOxEM # YouTube link: shown big right under the title
trailerPoster: /src/assets/projects/finn-adventure/key-art.jpg # image on the trailer's Play button (uses the cover if empty)
gameplay: # more YouTube clips
  # - video: https://www.youtube.com/watch?v=...
  #   title: First level
gallery: # screenshots or GIFs
  - image: /src/assets/projects/finn-adventure/02_level1_strawberry.png
    alt: Finn jumping towards a strawberry above a red mushroom enemy in the first level; the HUD shows 0/4 fruit and three hearts.
  - image: /src/assets/projects/finn-adventure/03_checkpoint.png
    alt: Finn next to a checkpoint flag at the top of some grass steps, with a banana on a floating platform.
  - image: /src/assets/projects/finn-adventure/04_stomp_and_bird.png
    alt: Finn in mid-jump above a puff of dust while a blue bird flies ahead; the HUD shows 1/4 fruit.
  - image: /src/assets/projects/finn-adventure/05_floating_platforms.png
    alt: Finn on small floating platforms, with a spiked block enemy at the edge of the screen.
  - image: /src/assets/projects/finn-adventure/06_underground_corridor.png
    alt: Finn jumping through a dark underground corridor with spikes on the floor.
  - image: /src/assets/projects/finn-adventure/07_level2.png
    alt: Finn on pink grass in the second level, with a red mushroom enemy ahead.
  - image: /src/assets/projects/finn-adventure/08_boss_fight.png
    alt: Finn jumping over the grey rhino boss in the final boss fight, with three hearts in the HUD.
  - image: /src/assets/projects/finn-adventure/01_main_menu.png
    alt: Main menu with the Finn Adventure title, a Play Game button and an Exit button over a mountain landscape.
  - image: /src/assets/projects/finn-adventure/09_pause_menu.png
    alt: Pause menu with Resume, Sound On, Main Menu and Quit Game buttons over the level.
  - image: /src/assets/projects/finn-adventure/10_game_over.png
    alt: "Game over screen: You are dead!!, with Menu and Reset buttons over a dark forest."
  - image: /src/assets/projects/finn-adventure/11_victory.png
    alt: "Victory screen: You win!!, with Exit and Menu buttons over a mountain landscape."

# Page sections (always in this order; empty ones are hidden)
overview: | # 2–5 lines: what the game is, its goal, what you wanted to explore
  Finn Adventure is a 2D platformer developed in Unity and my first video game project. Inspired by classic platformers such as Mario, the game follows Finn through three levels filled with obstacles and enemies, culminating in a final boss encounter.

  The project was my introduction to game development and allowed me to explore the fundamentals of Unity, 2D gameplay programming, player movement, enemy mechanics, level design and boss encounters.
responsibilities: # a list (- item) or a short text
  - Gameplay programming in C#.
  - Player movement and jumping.
  - Enemies and the jump-to-defeat mechanic.
  - Level design for the three levels.
  - The final boss fight.
  - Menus and HUD.
development: # one entry per important part of the development
  # - title: Player movement
  #   description: What you built and how.
production: # scope, planning, tools, what you cut and why, risks, what you'd do differently
challenges:
  # - title: Boss fight
  #   challenge: What the problem was.
  #   solution: How you solved it.
# Technical highlights: a plain list, or grouped like
#   - category: Gameplay
#     items: [Jump-to-defeat enemy mechanic.]
highlights:
  - category: Gameplay
    items:
      - 2D platforming with player movement and jumping.
      - Jump-to-defeat enemy mechanic.
      - Final boss fight.
  - category: Levels
    items:
      - Three playable levels with obstacles and enemies.
      - Level progression, with checkpoints.
  - category: UI and game flow
    items:
      - HUD with a fruit counter and three hearts.
      - Main menu, pause, game over and victory screens.
result: | # factual: what was achieved and what kind of result it is (prototype, course project...)
  Released on itch.io as a WebGL build that plays in the browser. Controls: A and D to move, Space to jump.

# Links (only the ones you fill in are shown)
links:
  build: https://thejorch.itch.io/finn-adventure # itch.io page: shows "Play on itch.io"
  steam:
  download:
  repo: # GitHub link shows "View on GitHub"
  other:
    # - label: Devlog
    #   url: https://...
---
