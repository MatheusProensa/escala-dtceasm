import { Users, Archive, CalendarX, Zap, Star } from 'lucide-react';
import type { AppData, Tela } from '../../types';
import { formatDateBR } from '../../utils/dateUtils';

interface DashboardProps {
  data: AppData;
  onNavigate: (tela: Tela) => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
  sub: string;
  onClick: () => void;
}

function StatCard({ icon, iconBg, iconColor, value, label, sub, onClick }: StatCardProps) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>{value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>{sub}</div>
        </div>
      </div>
    </div>
  );
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
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle" style={{ textTransform: 'capitalize' }}>{todayFormatted}</div>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('gerar')} type="button">
          <Zap size={16} />
          Gerar Escala
        </button>
      </div>

      <div className="dashboard-stats">
        <StatCard
          icon={<Users size={24} />}
          iconBg="rgba(59,130,246,0.15)" iconColor="#3b82f6"
          value={data.soldados.filter(s => s.ativo).length}
          label="Militares" sub="Ativos no sistema"
          onClick={() => onNavigate('soldados')}
        />
        <StatCard
          icon={<Archive size={24} />}
          iconBg="rgba(34,197,94,0.15)" iconColor="#22c55e"
          value={data.escalas.length}
          label="Escalas Salvas" sub="No histórico"
          onClick={() => onNavigate('historico')}
        />
        <StatCard
          icon={<CalendarX size={24} />}
          iconBg="rgba(239,68,68,0.15)" iconColor="#ef4444"
          value={activeIndisp.length}
          label="Indisponíveis Hoje" sub="Militares afastados"
          onClick={() => onNavigate('indisponibilidade')}
        />
        <StatCard
          icon={<Star size={24} />}
          iconBg="rgba(168,85,247,0.15)" iconColor="#a855f7"
          value={data.datasEspeciais.length}
          label="Escala Roxa" sub="Datas registradas"
          onClick={() => onNavigate('datas-especiais')}
        />
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
