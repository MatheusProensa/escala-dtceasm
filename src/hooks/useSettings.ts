import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const THEME_KEY = 'escala-dtceasm-theme';

export type Theme = 'dark' | 'light';

export function useSettings() {
  const [escalante, setEscalanteState] = useState('');
  const [comandante, setComandanteState] = useState('');
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) ?? 'dark');

  useEffect(() => {
    supabase.from('configuracoes')
      .select('chave, valor')
      .in('chave', ['escalante', 'comandante'])
      .then(({ data }) => {
        if (!data) return;
        for (const row of data) {
          if (row.chave === 'escalante') setEscalanteState(row.valor as string);
          if (row.chave === 'comandante') setComandanteState(row.valor as string);
        }
      });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setEscalante(v: string) {
    setEscalanteState(v);
    supabase.from('configuracoes')
      .upsert({ chave: 'escalante', valor: v, updated_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.error('setEscalante:', error); });
  }

  function setComandante(v: string) {
    setComandanteState(v);
    supabase.from('configuracoes')
      .upsert({ chave: 'comandante', valor: v, updated_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.error('setComandante:', error); });
  }

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
  }

  return {
    escalante, setEscalante,
    comandante, setComandante,
    theme, toggleTheme,
  };
}
