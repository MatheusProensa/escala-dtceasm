import { Users, Calendar, Star, Zap, Archive, CalendarX } from 'lucide-react';
import type { Tela } from '../types';

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
  { id: 'soldados', label: 'Soldados', icon: <Users size={18} /> },
  { id: 'indisponibilidade', label: 'Indisponibilidade', icon: <CalendarX size={18} /> },
  { id: 'datas-especiais', label: 'Datas Especiais', icon: <Star size={18} /> },
  { id: 'gerar', label: 'Gerar Escala', icon: <Zap size={18} /> },
  { id: 'historico', label: 'Histórico', icon: <Archive size={18} /> },
];

export default function Sidebar({ currentTela, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Calendar size={20} color="#fff" />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">DTCEA-SM</div>
          <div className="sidebar-brand-subtitle">Escala de Serviço</div>
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
        Destacamento de Controle do<br />
        Espaço Aéreo de Santa Maria
      </div>
    </aside>
  );
}
