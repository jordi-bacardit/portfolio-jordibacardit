import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
type ProjectData = Project['data'];

export const statusLabels: Record<NonNullable<ProjectData['status']>, string> = {
  prototype: 'Prototype',
  'in-development': 'In development',
  complete: 'Completed',
  released: 'Released',
  archived: 'Archived',
  planned: 'Planned',
  upcoming: 'Upcoming',
};

export interface Category {
  /** Empty for a plain, ungrouped list. */
  category: string;
  items: string[];
}

/** A section's bullet lists as CategoryList groups; blank items and empty lists are dropped. */
export function toCategories(lists: { label?: string; items: string[] }[] | undefined): Category[] {
  return (lists ?? [])
    .map((list) => ({
      category: list.label?.trim() ?? '',
      items: list.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((group) => group.items.length > 0);
}

/** All of a project's links as buttons, the playable build first; only links that exist. */
export function projectLinks(links: ProjectData['links']) {
  if (!links) return [];
  const host = (url: string) => new URL(url).hostname;
  return [
    links.build ? { label: playLabel(links.build), href: links.build } : null,
    links.steam ? { label: 'View on Steam', href: links.steam } : null,
    links.download ? { label: 'Download the build', href: links.download } : null,
    links.repo
      ? {
          label: host(links.repo).endsWith('github.com') ? 'View on GitHub' : 'View the source code',
          href: links.repo,
        }
      : null,
    ...(links.other ?? []).map((link) => ({ label: link.label, href: link.url })),
  ].filter((link) => link !== null);
}

export const typeLabels: Record<NonNullable<ProjectData['type']>, string> = {
  course: 'Course project',
  personal: 'Personal project',
  jam: 'Game jam',
  tfg: 'Final Degree Project (TFG), UVic',
};

/** Prototypes are listed apart: not on Home, not in the main Work grid, not in prev/next. */
export function isPrototype(project: Project) {
  return project.data.status === 'prototype';
}

/** Every project, in order. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.order - b.data.order);
}

/** The main projects (Home, Work grid, prev/next) and the prototypes, each in order. */
export async function getProjectGroups() {
  const projects = await getProjects();
  return {
    main: projects.filter((project) => !isPrototype(project)),
    prototypes: projects.filter(isPrototype),
  };
}

/**
 * Shared view-transition names: a card's title and cover morph into the same elements on the
 * project page. Covers also get the "project-cover" class so global.css can keep them cropped.
 */
export function transitionStyles(id: string) {
  return {
    title: `view-transition-name: project-title-${id}`,
    cover: `view-transition-name: project-cover-${id}; view-transition-class: project-cover`,
  };
}

/**
 * A case study is "in progress" while a built project still lacks media (cover, trailer, clips or
 * screenshots) or its write-up (sections). Planned projects don't count: their status already says
 * they aren't built; nor do prototypes, which stay a short description. The label disappears on
 * its own once filled.
 */
export function caseStudyInProgress(data: Project['data']) {
  const missing = caseStudyMissing(data);
  return missing.media || missing.writeUp;
}

/** Which half of the case study a built project still lacks (see caseStudyInProgress). */
export function caseStudyMissing(data: Project['data']) {
  if (data.status && ['planned', 'upcoming', 'prototype'].includes(data.status)) {
    return { media: false, writeUp: false };
  }
  const hasMedia = Boolean(
    data.cover || data.trailer || data.gameplay?.length || data.gallery?.length,
  );
  const hasWriteUp = Boolean(data.sections?.length);
  return { media: !hasMedia, writeUp: !hasWriteUp };
}

/** Button label for a playable build: names itch.io when the link points there. */
export function playLabel(url: string) {
  return new URL(url).hostname.endsWith('itch.io') ? 'Play on itch.io' : 'Play the build';
}

/** The project marked `featured` (or the first one) plus the rest, in order. */
export function splitFeatured(projects: Project[]) {
  const featured = projects.find((project) => project.data.featured) ?? projects[0];
  return { featured, rest: projects.filter((project) => project !== featured) };
}
