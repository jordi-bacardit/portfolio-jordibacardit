import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

export type Game = CollectionEntry<'games'>;
type Status = Game['data']['status'];

// Display order of the groups on /game-library.
export const statusGroups: { status: Status; label: string }[] = [
  { status: 'playing', label: 'Playing' },
  { status: 'favourite', label: 'Favourites' },
  { status: 'formative', label: 'Formative' },
  { status: 'played', label: 'Played' },
];

// Screenshots uploaded through the CMS land in src/assets/games/ and are referenced
// as "/src/assets/games/<file>". Globbing them lets Astro optimize them like any asset.
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/games/*.{png,jpg,jpeg,webp,avif,gif}',
  { eager: true },
);

export function getGameImage(path: string | undefined): ImageMetadata | undefined {
  if (!path) return undefined;
  const image = images[path]?.default;
  if (!image) {
    throw new Error(`Game Library image not found: "${path}". It must be in src/assets/games/.`);
  }
  return image;
}

export async function getGameGroups() {
  const games = await getCollection('games');
  return statusGroups
    .map((group) => ({
      ...group,
      games: games
        .filter((game) => game.data.status === group.status)
        .sort((a, b) => a.data.title.localeCompare(b.data.title)),
    }))
    .filter((group) => group.games.length > 0);
}
