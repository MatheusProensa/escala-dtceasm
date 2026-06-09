import { Sun, Moon, Menu } from 'lucide-react';

interface TopbarProps {
  title: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
}

export default function Topbar({ title, theme, onToggleTheme, onToggleSidebar }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="btn-icon topbar-hamburger" onClick={onToggleSidebar} type="button" aria-label="Menu">
        <Menu size={18} />
      </button>
      <h1 className="topbar-title">{title}</h1>
      <div style={{ marginLeft: 'auto' }}>
        <button className="btn-icon" onClick={onToggleTheme} title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'} type="button">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
