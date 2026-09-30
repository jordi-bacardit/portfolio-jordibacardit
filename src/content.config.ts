import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per project in src/content/projects/. The file name is the URL slug.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        summary: z.string(),
        // Required: while unknown it renders as a visible [TODO: status] placeholder.
        status: z.enum(['prototype', 'in-development', 'complete', 'upcoming']).optional(),
        order: z.number(),
        featured: z.boolean().default(false),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        gallery: z.array(z.object({ image: image(), alt: z.string() })).optional(),
        role: z.string().optional(),
        engine: z.string().optional(),
        technologies: z.array(z.string()).optional(),
        type: z.enum(['course', 'personal', 'jam', 'tfg']).optional(),
        dates: z.string().optional(),
        team: z.string().optional(),
        links: z
          .object({
            build: z.string().url().optional(),
            repo: z.string().url().optional(),
            video: z.string().url().optional(),
          })
          .optional(),
      })
      .refine((data) => !data.cover || data.coverAlt, {
        message: 'coverAlt is required when cover is set',
        path: ['coverAlt'],
      }),
});

// Game Library entries, edited through Sveltia CMS at /administrador/ (public/administrador/config.yml).
const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(),
    platforms: z.array(z.string()).min(1),
    genre: z.string(),
    status: z.enum(['playing', 'played', 'favourite', 'formative']),
    note: z.string(),
    // The CMS writes "/src/assets/games/<file>"; src/lib/games.ts resolves it to an optimizable image.
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

export const collections = { projects, games };
