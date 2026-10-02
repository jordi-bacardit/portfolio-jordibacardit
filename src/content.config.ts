import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Projects are edited directly in their files; Game Library through Sveltia CMS at /administrador
// (config in public/administrador/config.yml: keep its fields in sync with the games schema).
// Image paths are root-relative ("/src/assets/..."), which the image() helper resolves and optimizes.

// The CMS can save a cleared field as "" or null: treat that as "not set" so the build never fails on it.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' || value === null ? undefined : value), schema.optional());

// A YouTube video, shown as a click-to-load player (nothing loads from YouTube until Play).
const youtubeUrl = z
  .string()
  .url()
  .refine((url) => /(?:youtube\.com|youtu\.be)\//.test(url), 'Must be a YouTube URL');

// One section of a project page: a heading plus any of these blocks, always rendered in this
// order (text, diagram, lists, entries, note). Sections appear in the order of the file.
const section = z.object({
  title: z.string(),
  // Paragraphs, separated by a blank line.
  text: optional(z.string()),
  // A rising-difficulty diagram: steps left to right, plus what makes it rise.
  diagram: optional(
    z.object({
      steps: z.array(z.string()).min(2),
      levers: optional(z.array(z.string())),
      caption: optional(z.string()),
    }),
  ),
  // Bullet lists; labelled lists sit side by side ("What I did" / "What my teammate did").
  lists: optional(z.array(z.object({ label: optional(z.string()), items: z.array(z.string()) }))),
  // Titled items: design decisions, roadmap phases (label: e.g. their dates).
  entries: optional(
    z.array(z.object({ label: optional(z.string()), title: z.string(), text: optional(z.string()) })),
  ),
  // A short line in muted text at the end.
  note: optional(z.string()),
});

// One Markdown file per project in src/content/projects/. The file name is the URL slug.
// Every field except title, summary and order is optional: empty ones are hidden on the page.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        summary: z.string(),
        // Hidden on the site while unknown (never shown as a placeholder). Prototypes are listed
        // apart, under Prototypes on /work.
        status: optional(
          z.enum([
            'prototype',
            'in-development',
            'complete',
            'released',
            'archived',
            'planned',
            'upcoming',
          ]),
        ),
        order: z.number(),
        featured: z.boolean().default(false),
        year: optional(z.number().int()),
        type: optional(z.enum(['course', 'personal', 'jam', 'tfg'])),
        engine: optional(z.string()),
        role: optional(z.string()),
        team: optional(z.string()),
        duration: optional(z.string()),
        // Shown as "Timeline" (only when there's no year).
        dates: optional(z.string()),
        // Shorter text for the Home and Work cards; the page's own values are used when empty.
        card: optional(
          z.object({ summary: optional(z.string()), role: optional(z.string()) }),
        ),
        cover: optional(image()),
        coverAlt: optional(z.string()),
        trailer: optional(youtubeUrl),
        // Poster shown on the trailer's play button; falls back to the cover.
        trailerPoster: optional(image()),
        gameplay: optional(
          z.array(z.object({ video: youtubeUrl, title: z.string(), poster: optional(image()) })),
        ),
        gallery: optional(z.array(z.object({ image: image(), alt: z.string() }))),
        links: optional(
          z.object({
            // Playable build, usually the itch.io page.
            build: optional(z.string().url()),
            repo: optional(z.string().url()),
            steam: optional(z.string().url()),
            download: optional(z.string().url()),
            other: optional(z.array(z.object({ label: z.string(), url: z.string().url() }))),
          }),
        ),
        // The case study, in the order written in the file.
        sections: optional(z.array(section)),
        // Short closing notes (build, controls), shown at the end next to the links.
        technicalNotes: optional(z.string()),
      })
      .refine((data) => !data.cover || data.coverAlt, {
        message: 'coverAlt is required when cover is set',
        path: ['coverAlt'],
      }),
});

// Game Library entries, one Markdown file per game in src/content/games/.
const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      platforms: z.array(z.string()).min(1),
      genre: z.string(),
      status: z.enum(['playing', 'played', 'favourite', 'formative']),
      note: z.string(),
      image: optional(image()),
      imageAlt: optional(z.string()),
    }),
});

export const collections = { projects, games };
