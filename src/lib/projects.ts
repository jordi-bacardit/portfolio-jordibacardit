import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
type ProjectData = Project['data'];

export const statusLabels: Record<NonNullable<ProjectData['status']>, string> = {
  prototype: 'Prototype',
  'in-development': 'In development',
  complete: 'Completed',
  archived: 'Archived',
  upcoming: 'Upcoming',
};

export interface Category {
  /** Empty for a plain, ungrouped list. */
  category: string;
  items: string[];
}

/**
 * Highlights and technologies can be a plain list or grouped by category. Both become groups
 * (a plain list is one group without a name); blank entries and empty groups are dropped.
 */
export function toCategories(value: string[] | Category[] | undefined): Category[] {
  if (!value?.length) return [];
  const groups: Category[] =
    typeof value[0] === 'string'
      ? [{ category: '', items: value as string[] }]
      : (value as Category[]);
  return groups
    .map((group) => ({
      category: group.category.trim(),
      items: group.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((group) => group.items.length > 0);
}

/** Every item of a plain or grouped list, e.g. for the one-line technologies on cards. */
export function flatItems(value: string[] | Category[] | undefined): string[] {
  return toCategories(value).flatMap((group) => group.items);
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
  tfg: 'TFG (Final Degree Project)',
};

export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.order - b.data.order);
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
 * screenshots) or its write-up (responsibilities, development, production or challenges). Upcoming
 * projects don't count: their status already says they aren't built. The label disappears on its
 * own once filled.
 */
export function caseStudyInProgress(data: Project['data']) {
  const missing = caseStudyMissing(data);
  return missing.media || missing.writeUp;
}

/** Which half of the case study a built project still lacks (see caseStudyInProgress). */
export function caseStudyMissing(data: Project['data']) {
  if (data.status === 'upcoming') return { media: false, writeUp: false };
  const hasMedia = Boolean(
    data.cover || data.trailer || data.gameplay?.length || data.gallery?.length,
  );
  const hasWriteUp = Boolean(
    data.responsibilities?.length ||
      data.development?.length ||
      data.production ||
      data.challenges?.length,
  );
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
