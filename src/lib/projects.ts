import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
type ProjectData = Project['data'];

export const statusLabels: Record<NonNullable<ProjectData['status']>, string> = {
  prototype: 'Prototype',
  'in-development': 'In development',
  complete: 'Complete',
  upcoming: 'Upcoming',
};

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

/** The project marked `featured` (or the first one) plus the rest, in order. */
export function splitFeatured(projects: Project[]) {
  const featured = projects.find((project) => project.data.featured) ?? projects[0];
  return { featured, rest: projects.filter((project) => project !== featured) };
}
