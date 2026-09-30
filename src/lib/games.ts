import { getCollection, type CollectionEntry } from 'astro:content';

export type Game = CollectionEntry<'games'>;

export const statusLabels: Record<Game['data']['status'], string> = {
  playing: 'Playing',
  played: 'Played',
  favourite: 'Favourite',
  formative: 'Formative',
};

/** Every game, alphabetically: the page is one library, searchable by title. */
export async function getGames(): Promise<Game[]> {
  const games = await getCollection('games');
  return games.sort((a, b) => a.data.title.localeCompare(b.data.title));
}
