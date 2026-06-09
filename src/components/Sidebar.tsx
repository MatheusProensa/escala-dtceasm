import { Home, Users, Star, Zap, Archive, CalendarX, Settings, BarChart2, BookOpen, ArrowLeftRight } from 'lucide-react';
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

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Início', icon: <Home size={17} /> },
      { id: 'soldados', label: 'Militares', icon: <Users size={17} /> },
    ],
  },
  {
    label: 'Escala',
    items: [
      { id: 'indisponibilidade', label: 'Indisponibilidade', icon: <CalendarX size={17} /> },
      { id: 'datas-especiais', label: 'Escala Roxa', icon: <Star size={17} /> },
      { id: 'gerar', label: 'Gerar Escala', icon: <Zap size={17} /> },
      { id: 'historico', label: 'Histórico', icon: <Archive size={17} /> },
      { id: 'troca-servico', label: 'Troca de Serviço', icon: <ArrowLeftRight size={17} /> },
      { id: 'quadrinhos', label: 'Quadrinhos', icon: <BarChart2 size={17} /> },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { id: 'regulamento', label: 'Regulamento', icon: <BookOpen size={17} /> },
      { id: 'configuracoes', label: 'Configurações', icon: <Settings size={17} /> },
    ],
  },
];

export default function Sidebar({ currentTela, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logoUrl} alt="Logo DTCEA-SM" className="sidebar-brand-logo" />
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">
            Escala <span style={{ color: '#2C8FE0', fontWeight: 700 }}>Permanência</span>
          </div>
          <div className="sidebar-brand-subtitle">DTCEA-SM</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.label} className="sidebar-nav-group">
            <div className="sidebar-nav-group-label">{group.label}</div>
            {group.items.map(item => (
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
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        Desenvolvido por Matheus Proensa<br />
        Ex Cb Proensa · DTCEA-SM
      </div>
    </aside>
  );
}
