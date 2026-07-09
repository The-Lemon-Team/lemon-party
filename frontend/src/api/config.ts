/** Backend root, e.g. http://localhost:3008 — for Electron production without Vite proxy */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE?.replace(/\/$/, '');
  if (!base) return path;
  return `${base}${path.replace(/^\/api/, '')}`;
}

/** Resolve relative upload URLs when API runs on a separate host */
export function assetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = import.meta.env.VITE_API_BASE?.replace(/\/$/, '');
  if (base && path.startsWith('/')) return `${base}${path}`;
  return path;
}
