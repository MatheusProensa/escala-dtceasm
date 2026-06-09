import { Users, Archive, CalendarX, Zap, Star } from 'lucide-react';
import type { AppData, Tela } from '../../types';
import { formatDateBR } from '../../utils/dateUtils';

interface DashboardProps {
  data: AppData;
  onNavigate: (tela: Tela) => void;
}

export default function Dashboard({ data, onNavigate }: DashboardProps) {
  const today = new Date().toISOString().slice(0, 10);

  const activeIndisp = data.indisponibilidades.filter(
    i => i.dataInicio <= today && i.dataFim >= today
  );

  const lastEscala = data.escalas.length > 0
    ? [...data.escalas].sort((a, b) => b.geradaEm.localeCompare(a.geradaEm))[0]!
    : null;

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Início</div>
          <div className="page-subtitle" style={{ textTransform: 'capitalize' }}>{todayFormatted}</div>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('gerar')} type="button">
          <Zap size={16} />
          Gerar Escala
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card" onClick={() => onNavigate('soldados')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            <div className="stat-icon"><Users size={22} /></div>
          </div>
          <div className="stat-value">{data.soldados.filter(s => s.ativo).length}</div>
          <div className="stat-label">Militares</div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('historico')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
            <div className="stat-icon"><Archive size={22} /></div>
          </div>
          <div className="stat-value">{data.escalas.length}</div>
          <div className="stat-label">Escalas Salvas</div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('indisponibilidade')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            <div className="stat-icon"><CalendarX size={22} /></div>
          </div>
          <div className="stat-value">{activeIndisp.length}</div>
          <div className="stat-label">Indisponíveis Hoje</div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('datas-especiais')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
            <div className="stat-icon"><Star size={22} /></div>
          </div>
          <div className="stat-value">{data.datasEspeciais.length}</div>
          <div className="stat-label">Datas Especiais</div>
        </div>
      </div>

      {lastEscala && (
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Última Escala Gerada</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
            {lastEscala.nome}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {formatDateBR(lastEscala.periodo.inicio)} a {formatDateBR(lastEscala.periodo.fim)}
            {' · '}{lastEscala.dias.length} dias
          </div>
          <button
            className="btn btn-ghost btn-sm mt-3"
            onClick={() => onNavigate('historico')}
            type="button"
          >
            <Archive size={14} />
            Ver no histórico
          </button>
        </div>
      )}

      {data.soldados.length === 0 && (
        <div className="alert alert-info mt-4">
          <span>
            Para começar, cadastre os militares em <strong>Militares</strong> e
            configure o escalante/comandante em <strong>Configurações</strong>.
          </span>
        </div>
      )}
    </div>
  );
}
