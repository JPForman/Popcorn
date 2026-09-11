export function randomLetter(): string {
  return "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
