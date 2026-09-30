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

// One Markdown file per project in src/content/projects/. The file name is the URL slug.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        summary: z.string(),
        // Required: while unknown it renders as a visible [TODO: status] placeholder.
        status: optional(z.enum(['prototype', 'in-development', 'complete', 'upcoming'])),
        order: z.number(),
        featured: z.boolean().default(false),
        type: optional(z.enum(['course', 'personal', 'jam', 'tfg'])),
        engine: optional(z.string()),
        technologies: optional(z.array(z.string())),
        role: optional(z.string()),
        team: optional(z.string()),
        dates: optional(z.string()),
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
          }),
        ),
        // Page sections, always in this order with fixed headings; empty ones are hidden.
        overview: optional(z.string()),
        responsibilities: optional(z.string()),
        production: optional(z.string()),
        highlights: optional(z.array(z.string())),
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
