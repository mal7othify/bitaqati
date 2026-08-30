/* Light/dark toggle. Compiled as a classic (non-module) script and loaded
   blocking in <head> so the stored choice applies before first paint.
   Without a stored choice the system preference decides (pure CSS). */

(() => {
  const KEY = 'bitaqati:colorScheme';
  const root = document.documentElement;

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch { /* storage unavailable */ }
  if (stored === 'dark' || stored === 'light') root.dataset.theme = stored;

  const isDark = (): boolean =>
    root.dataset.theme === 'dark' ||
    (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const paint = (): void => {
      btn.textContent = isDark() ? '☀️' : '🌙';
    };
    paint();
    btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem(KEY, next);
      } catch { /* storage unavailable */ }
      paint();
    });
  });
})();
