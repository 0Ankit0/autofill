export function createRng(seed = Date.now()): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function pickOne<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)] as T;
}
