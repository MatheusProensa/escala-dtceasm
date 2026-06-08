import { useState, useEffect } from 'react';

const ESCALANTE_KEY = 'escala-dtceasm-escalante';
const COMANDANTE_KEY = 'escala-dtceasm-comandante';
const THEME_KEY = 'escala-dtceasm-theme';

export type Theme = 'dark' | 'light';

export function useSettings() {
  const [escalante, setEscalanteState] = useState(() => localStorage.getItem(ESCALANTE_KEY) ?? '');
  const [comandante, setComandanteState] = useState(() => localStorage.getItem(COMANDANTE_KEY) ?? '');
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) ?? 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setEscalante(v: string) { setEscalanteState(v); localStorage.setItem(ESCALANTE_KEY, v); }
  function setComandante(v: string) { setComandanteState(v); localStorage.setItem(COMANDANTE_KEY, v); }
  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
  }

  return { escalante, setEscalante, comandante, setComandante, theme, toggleTheme };
}
