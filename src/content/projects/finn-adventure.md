---
# Same template for every project. Empty fields are hidden on the site: fill one in and it appears.
# Images: save them in src/assets/projects/finn-adventure/ and write /src/assets/projects/finn-adventure/<file>.
# Videos: upload them to YouTube and paste the link.
# Sources: Jordi's brief of 2026-10-02 (role, duration, level design, boss, what I'd change), the
# itch.io page (controls, WebGL build), the trailer and the screenshots. The game has a single
# checkpoint: don't mention checkpoints.
# TODO(content): year, gameplay video (YouTube link), repo.

# Basics
title: Finn Adventure
summary: "My first game: a 2D pixel platformer made solo in Unity, with three levels and a final boss."
status: released # prototype | in-development | complete | released | archived | planned
year: # e.g. 2026
order: 2
featured: false

# Key facts (hero)
role: Solo developer (design, programming, level design) # e.g. Game Designer, Solo developer
team: # size and disciplines; empty for a solo project
duration: 1.5 months
engine: Unity
type: personal # course | personal | jam | tfg
dates: # shown as Timeline, only when there's no year

# Home and Work cards: shorter text and role (the page's are used when empty)
card:
  summary: "My first game: a 2D pixel platformer with three levels and a final boss, made solo."
  role: Solo developer

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
    alt: Finn next to a flag pole at the top of some grass steps, with a banana on a floating platform.
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

# The case study: sections in this order. Each one has a title and any of
#   text (paragraphs) · diagram · lists (- label + items) · entries (- label + title + text) · note
sections:
  - title: Overview
    text: >-
      Finn Adventure was the first game I ever made. Inspired by classic platformers like Super
      Mario, it follows Finn through three levels of obstacles and enemies, ending in a boss fight.
      It's simple, and it shows it was made by a beginner, but it's where everything started and
      I'm proud to keep it here.

  - title: Level design & difficulty
    text: >-
      Difficulty grows through the layout of each level rather than through new mechanics: harder
      jumps, obstacles where you have to wait for the right moment to cross, and more enemies.
    diagram:
      steps: [Level 1, Level 2, Level 3, Boss]
      levers: [Harder jumps, Timing, More enemies]
      caption: Retrospective overview, made after the project.

  - title: The boss
    text: >-
      The levels teach one thing above all: patience, waiting for the right moment to move. The
      boss puts that to the test: every time you hit it, it gets faster.

  - title: My role
    lists:
      - items:
          - Gameplay programming in C#.
          - Player movement and jumping.
          - Enemies and the jump-to-defeat mechanic.
          - Level design for the three levels.
          - The final boss fight.
          - Menus and HUD.

  - title: What I'd change now
    text: >-
      Quite a lot: the level layouts, the enemies and, above all, the overall level design. Looking
      back, it's clearly the work of a beginner, and that's exactly why it's useful to see how far
      I've come.

# Short closing notes, shown at the end next to the links
technicalNotes: |
  Released on itch.io as a WebGL build that plays in the browser.

  Controls: A and D to move, Space to jump.

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
