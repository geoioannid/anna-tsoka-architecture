import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import * as yaml from 'js-yaml';

/**
 * The CMS writes flat YAML files ({ intro, carousel }); Astro's file() loader
 * treats a top-level object as a map of entries, so wrap it into one entry.
 */
const singleEntry =
  (id: string) =>
  (text: string): Array<Record<string, unknown>> => [
    { id, ...(yaml.load(text) as Record<string, unknown>) },
  ];

/** Optional string that tolerates the nulls/empty strings the CMS writes for untouched fields. */
const optionalString = z.preprocess(
  (v) => (v === null || v === '' ? undefined : v),
  z.string().optional(),
);

/**
 * Projects — one markdown file per project in src/content/projects/.
 * The CMS (Sveltia) writes these; `year` is coerce-string because the CMS
 * saves bare YAML numbers, and image fields store public URL paths
 * (`/uploads/...`) that resolveUpload() maps to files in src/uploads.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    location: z.coerce.string().default(''),
    year: z.coerce.string().default(''),
    phase: z.string().default('Built'),
    phaseCustom: optionalString,
    description: z.string().default(''),
    cover: z.string(),
    order: z.coerce.number().default(100),
    blocks: z
      .array(
        z.union([
          z.object({
            type: z.literal('text'),
            title: optionalString,
            subtitle: optionalString,
            text: z.string().default(''),
          }),
          z.object({
            type: z.literal('images'),
            images: z.array(
              z.object({
                image: z.string(),
                caption: optionalString,
              }),
            ),
          }),
        ]),
      )
      .default([]),
  }),
});

const home = defineCollection({
  loader: file('src/content/home.yml', { parser: singleEntry('home') }),
  schema: z.object({
    intro: z.string().default(''),
    carousel: z
      .array(
        z.object({
          image: z.string(),
          caption: optionalString,
        }),
      )
      .default([]),
  }),
});

const about = defineCollection({
  loader: file('src/content/about.yml', { parser: singleEntry('about') }),
  schema: z.object({
    portrait: z.string(),
    heading: z.string().default(''),
    bio: z.string().default(''),
    services: z.array(z.string()).default([]),
  }),
});

const settings = defineCollection({
  loader: file('src/content/settings.yml', { parser: singleEntry('settings') }),
  schema: z.object({
    email: z.string().default(''),
    instagram: z.string().default(''),
    city: z.string().default(''),
  }),
});

export const collections = { projects, home, about, settings };
