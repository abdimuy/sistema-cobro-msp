import Fuse from 'fuse.js';

export const search = <T>(
  list: T[],
  keys: string[],
  search: string,
  threshold: number,
): T[] => {
  const fuse = new Fuse(list, {
    keys,
    includeScore: true,
    threshold,
    shouldSort: true,
    distance: 100,
  });

  return fuse.search(search).map(result => result.item);
};
