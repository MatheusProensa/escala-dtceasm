import { useState } from 'react';
import { Plus, Trash2, X, CalendarX } from 'lucide-react';
import type { Soldado, Indisponibilidade as IndisponibilidadeType } from '../../types';
import { formatDateBR } from '../../utils/dateUtils';

interface IndisponibilidadeProps {
  soldados: Soldado[];
  indisponibilidades: IndisponibilidadeType[];
  onAdd: (ind: Omit<IndisponibilidadeType, 'id'>) => void;
  onDelete: (id: string) => void;
}

interface FormState {
  soldadoId: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
}

function emptyForm(defaultSoldadoId = ''): FormState {
  return { soldadoId: defaultSoldadoId, dataInicio: '', dataFim: '', motivo: '' };
}

export default function Indisponibilidade({
  soldados,
  indisponibilidades,
  onAdd,
  onDelete,
}: IndisponibilidadeProps) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterSoldadoId, setFilterSoldadoId] = useState<string>('');

  const activeSoldados = soldados.filter(s => s.ativo).sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);

  const filtered = filterSoldadoId
    ? indisponibilidades.filter(i => i.soldadoId === filterSoldadoId)
    : indisponibilidades;

  const sorted = [...filtered].sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

  function getSoldadoLabel(id: string) {
    const s = soldados.find(x => x.id === id);
    if (!s) return '(removido)';
    return s.patente ? `${s.patente} ${s.nome}` : s.nome;
  }

  function openAdd() {
    setForm(emptyForm(activeSoldados[0]?.id ?? ''));
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm(emptyForm());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.soldadoId || !form.dataInicio || !form.dataFim) return;
    if (form.dataFim < form.dataInicio) return;

    onAdd({
      soldadoId: form.soldadoId,
      dataInicio: form.dataInicio,
      dataFim: form.dataFim,
      motivo: form.motivo.trim(),
    });
    closeModal();
  }

  const isFormValid = form.soldadoId && form.dataInicio && form.dataFim && form.dataFim >= form.dataInicio;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Indisponibilidade</div>
          <div className="page-subtitle">Períodos em que militares não podem ser escalados</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} type="button">
          <Plus size={16} />
          Registrar
        </button>
      </div>

      {/* Filter */}
      {soldados.length > 0 && (
        <div className="flex items-center gap-3 mb-4" style={{ maxWidth: 360 }}>
          <label style={{ marginBottom: 0, whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Filtrar por militar:
          </label>
          <select
            value={filterSoldadoId}
            onChange={e => setFilterSoldadoId(e.target.value)}
          >
            <option value="">Todos</option>
            {activeSoldados.map(s => (
              <option key={s.id} value={s.id}>
                {s.patente ? `${s.patente} ${s.nome}` : s.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {indisponibilidades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CalendarX size={48} strokeWidth={1} />
          </div>
          <div className="empty-state-text">Nenhuma indisponibilidade registrada</div>
          <div className="empty-state-sub">Registre períodos em que soldados não podem ser escalados</div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-text">Nenhum resultado para o filtro selecionado</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Soldado</th>
                <th>Data de Início</th>
                <th>Data de Fim</th>
                <th>Motivo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(ind => (
                <tr key={ind.id}>
                  <td style={{ fontWeight: 500 }}>{getSoldadoLabel(ind.soldadoId)}</td>
                  <td>{formatDateBR(ind.dataInicio)}</td>
                  <td>{formatDateBR(ind.dataFim)}</td>
                  <td className="text-secondary">{ind.motivo || '—'}</td>
                  <td>
                    {deleteConfirmId === ind.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-danger">Confirmar?</span>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { onDelete(ind.id); setDeleteConfirmId(null); }}
                          type="button"
                        >
                          Sim
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteConfirmId(null)}
                          type="button"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-icon danger"
                        onClick={() => setDeleteConfirmId(ind.id)}
                        title="Excluir"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Registrar Indisponibilidade</span>
              <button className="btn-icon" onClick={closeModal} type="button">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {activeSoldados.length === 0 ? (
                  <div className="alert alert-warning">
                    Não há soldados ativos cadastrados.
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label htmlFor="ind-soldado">Soldado *</label>
                      <select
                        id="ind-soldado"
                        value={form.soldadoId}
                        onChange={e => setForm(f => ({ ...f, soldadoId: e.target.value }))}
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
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="ind-inicio">Data de Início *</label>
                        <input
                          id="ind-inicio"
                          type="date"
                          value={form.dataInicio}
                          onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="ind-fim">Data de Fim *</label>
                        <input
                          id="ind-fim"
                          type="date"
                          value={form.dataFim}
                          min={form.dataInicio}
                          onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    {form.dataFim && form.dataInicio && form.dataFim < form.dataInicio && (
                      <div className="alert alert-danger mb-2">
                        A data de fim deve ser igual ou posterior à data de início.
                      </div>
                    )}
                    <div className="form-group">
                      <label htmlFor="ind-motivo">Motivo</label>
                      <input
                        id="ind-motivo"
                        type="text"
                        value={form.motivo}
                        onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                        placeholder="Férias, licença, dispensa médica..."
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={closeModal} type="button">
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!isFormValid || activeSoldados.length === 0}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
