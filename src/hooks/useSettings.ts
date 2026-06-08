import { useState, useEffect } from 'react';

const ESCALANTE_KEY = 'escala-dtceasm-escalante';
const COMANDANTE_KEY = 'escala-dtceasm-comandante';
const THEME_KEY = 'escala-dtceasm-theme';
const PASSWORD_KEY = 'escala-dtceasm-password';

export type Theme = 'dark' | 'light';

export function useSettings() {
  const [escalante, setEscalanteState] = useState(() => localStorage.getItem(ESCALANTE_KEY) ?? '');
  const [comandante, setComandanteState] = useState(() => localStorage.getItem(COMANDANTE_KEY) ?? '');
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) ?? 'dark');
  const [passwordHash, setPasswordHashState] = useState(() => localStorage.getItem(PASSWORD_KEY) ?? '');

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

  function setPassword(plain: string) {
    const hash = plain.trim() ? btoa(encodeURIComponent(plain.trim())) : '';
    setPasswordHashState(hash);
    if (hash) localStorage.setItem(PASSWORD_KEY, hash);
    else localStorage.removeItem(PASSWORD_KEY);
  }

  function checkPassword(plain: string): boolean {
    if (!passwordHash) return true;
    return btoa(encodeURIComponent(plain)) === passwordHash;
  }

  return {
    escalante, setEscalante,
    comandante, setComandante,
    theme, toggleTheme,
    hasPassword: !!passwordHash,
    setPassword, checkPassword,
  };
}
