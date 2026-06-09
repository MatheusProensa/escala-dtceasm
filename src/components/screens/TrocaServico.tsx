import { useState } from 'react';
import { ArrowLeftRight, Trash2, Plus } from 'lucide-react';
import type { Soldado, TrocaServico as TrocaServicoType } from '../../types';
import { formatDateBR } from '../../utils/dateUtils';

interface TrocaServicoProps {
  soldados: Soldado[];
  trocas: TrocaServicoType[];
  onAdd: (troca: Omit<TrocaServicoType, 'id' | 'criadaEm'>) => void;
  onDelete: (id: string) => void;
}

function getSoldadoLabel(soldados: Soldado[], id: string): string {
  const s = soldados.find(x => x.id === id);
  if (!s) return '(removido)';
  return s.patente ? `${s.patente} ${s.nome}` : s.nome;
}

export default function TrocaServico({ soldados, trocas, onAdd, onDelete }: TrocaServicoProps) {
  const [data, setData] = useState('');
  const [substituidoId, setSubstituidoId] = useState('');
  const [substitutoId, setSubstitutoId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeSoldados = soldados.filter(s => s.ativo).sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);

  const isValid = data && substituidoId && substitutoId && substituidoId !== substitutoId;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onAdd({ data, soldadoSubstituidoId: substituidoId, soldadoSubstitutoId: substitutoId, observacao });
    setData('');
    setSubstituidoId('');
    setSubstitutoId('');
    setObservacao('');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Troca de Serviço</div>
          <div className="page-subtitle">{trocas.length} troca(s) registrada(s)</div>
        </div>
      </div>

      {/* Form */}
      <div className="card mb-4">
        <div className="card-title mb-3">Registrar Nova Troca</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ts-data">Data do Serviço *</label>
              <input
                id="ts-data"
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ts-substituido">Militar Substituído *</label>
              <select
                id="ts-substituido"
                value={substituidoId}
                onChange={e => setSubstituidoId(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {activeSoldados.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.patente ? `${s.patente} ${s.nome}` : s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="ts-substituto">Militar Substituto *</label>
              <select
                id="ts-substituto"
                value={substitutoId}
                onChange={e => setSubstitutoId(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {activeSoldados
                  .filter(s => s.id !== substituidoId)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.patente ? `${s.patente} ${s.nome}` : s.nome}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ts-obs">Observação (opcional)</label>
            <input
              id="ts-obs"
              type="text"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Autorizado pelo escalante"
              maxLength={200}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={!isValid}>
            <Plus size={16} />
            Registrar Troca
          </button>
        </form>
      </div>

      {/* List */}
      {trocas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ArrowLeftRight size={48} strokeWidth={1} /></div>
          <div className="empty-state-text">Nenhuma troca registrada</div>
          <div className="empty-state-sub">Registre uma troca de serviço usando o formulário acima</div>
        </div>
      ) : (
        <div className="escala-list">
          {trocas.map(troca => (
            <div key={troca.id} className="escala-list-item">
              <div className="escala-list-item-info">
                <div className="escala-list-item-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{formatDateBR(troca.data)}</span>
                  <ArrowLeftRight size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--danger)' }}>{getSoldadoLabel(soldados, troca.soldadoSubstituidoId)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>→</span>
                  <span style={{ color: 'var(--success)' }}>{getSoldadoLabel(soldados, troca.soldadoSubstitutoId)}</span>
                </div>
                {troca.observacao && (
                  <div className="escala-list-item-meta">{troca.observacao}</div>
                )}
              </div>
              <div className="escala-list-item-actions">
                {deleteConfirmId === troca.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-danger">Confirmar?</span>
                    <button className="btn btn-danger btn-sm" onClick={() => { onDelete(troca.id); setDeleteConfirmId(null); }} type="button">Sim</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmId(null)} type="button">Não</button>
                  </div>
                ) : (
                  <button className="btn-icon danger" onClick={() => setDeleteConfirmId(troca.id)} title="Excluir" type="button">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
