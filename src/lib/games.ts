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
