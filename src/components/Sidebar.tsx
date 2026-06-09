import { Home, Users, Star, Zap, Archive, CalendarX, Settings, BarChart2, BookOpen } from 'lucide-react';
import type { Tela } from '../types';
import logoUrl from '../assets/logo-dtceasm.png';

interface SidebarProps {
  currentTela: Tela;
  onNavigate: (tela: Tela) => void;
}

interface NavItem {
  id: Tela;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Início', icon: <Home size={18} /> },
  { id: 'soldados', label: 'Militares', icon: <Users size={18} /> },
  { id: 'indisponibilidade', label: 'Indisponibilidade', icon: <CalendarX size={18} /> },
  { id: 'datas-especiais', label: 'Datas Especiais', icon: <Star size={18} /> },
  { id: 'gerar', label: 'Gerar Escala', icon: <Zap size={18} /> },
  { id: 'historico', label: 'Histórico', icon: <Archive size={18} /> },
  { id: 'quadrinhos', label: 'Quadrinhos', icon: <BarChart2 size={18} /> },
  { id: 'regulamento', label: 'Regulamento', icon: <BookOpen size={18} /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
];

export default function Sidebar({ currentTela, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logoUrl} alt="Logo DTCEA-SM" className="sidebar-brand-logo" />
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">
            <span style={{ fontWeight: 400 }}>Escala </span><span style={{ color: 'var(--accent)' }}>Permanência</span>
          </div>
          <div className="sidebar-brand-subtitle">DTCEA-SM</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-item${currentTela === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        Desenvolvido por Matheus Proensa<br />
        Ex Cb Proensa · DTCEA-SM
      </div>
    </aside>
  );
}
