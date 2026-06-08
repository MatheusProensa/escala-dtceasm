import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Soldado, Escala } from '../../types';
import { computeQuadrinhos } from '../../utils/scheduler';

interface SoldadosProps {
  soldados: Soldado[];
  escalas: Escala[];
  onAdd: (s: Omit<Soldado, 'id'>) => Soldado;
  onUpdate: (id: string, updates: Partial<Omit<Soldado, 'id'>>) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
}

interface FormState {
  nome: string;
  patente: string;
  ativo: boolean;
}

const emptyForm: FormState = { nome: '', patente: '', ativo: true };

export default function Soldados({
  soldados,
  escalas,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: SoldadosProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const quadrinhos = computeQuadrinhos(escalas);
  const sorted = [...soldados].sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(s: Soldado) {
    setEditingId(s.id);
    setForm({ nome: s.nome, patente: s.patente, ativo: s.ativo });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;

    if (editingId) {
      onUpdate(editingId, { nome: form.nome.trim(), patente: form.patente.trim(), ativo: form.ativo });
    } else {
      const maxOrder = soldados.length > 0
        ? Math.max(...soldados.map(s => s.ordemAntiguidade))
        : 0;
      onAdd({
        nome: form.nome.trim(),
        patente: form.patente.trim(),
        ativo: form.ativo,
        ordemAntiguidade: maxOrder + 1,
      });
    }
    closeModal();
  }

  function handleDelete(id: string) {
    onDelete(id);
    setDeleteConfirmId(null);
  }

  function getQ(soldadoId: string) {
    return quadrinhos[soldadoId] ?? { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Gerenciar Militares</div>
          <div className="page-subtitle">{soldados.length} militar(es) cadastrado(s)</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} type="button">
          <Plus size={16} />
          Novo Militar
        </button>
      </div>

      {soldados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="empty-state-text">Nenhum militar cadastrado</div>
          <div className="empty-state-sub">Clique em "Novo Militar" para começar</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Patente</th>
                <th>Nome</th>
                <th>Quadrinhos</th>
                <th>Ativo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, idx) => {
                const q = getQ(s.id);
                const isFirst = idx === 0;
                const isLast = idx === sorted.length - 1;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-secondary" style={{ minWidth: 24 }}>{s.ordemAntiguidade}</span>
                        <div className="flex flex-col gap-1">
                          <button
                            className="btn-icon"
                            onClick={() => onReorder(s.id, 'up')}
                            disabled={isFirst}
                            title="Mover para cima"
                            type="button"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => onReorder(s.id, 'down')}
                            disabled={isLast}
                            title="Mover para baixo"
                            type="button"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-secondary">{s.patente || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{s.nome}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="q-count q-count-preta" title="Preta">{q.preta}</span>
                        <span className="q-count q-count-amarela" title="Amarela">{q.amarela}</span>
                        <span className="q-count q-count-vermelha" title="Vermelha">{q.vermelha}</span>
                        <span className="q-count q-count-roxa" title="Roxa">{q.roxa}</span>
                      </div>
                    </td>
                    <td>
                      <label className="toggle" title={s.ativo ? 'Ativo' : 'Inativo'}>
                        <input
                          type="checkbox"
                          checked={s.ativo}
                          onChange={(e) => onUpdate(s.id, { ativo: e.target.checked })}
                        />
                        <span className="toggle-track" />
                        <span className="toggle-thumb" />
                      </label>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-icon"
                          onClick={() => openEdit(s)}
                          title="Editar"
                          type="button"
                        >
                          <Pencil size={14} />
                        </button>
                        {deleteConfirmId === s.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-danger">Confirmar?</span>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(s.id)}
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
                            onClick={() => setDeleteConfirmId(s.id)}
                            title="Excluir"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {soldados.length > 0 && (
        <div className="flex items-center gap-3 mt-3" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>Legenda quadrinhos:</span>
          <span className="q-count q-count-preta">P</span> Preta
          <span className="q-count q-count-amarela">A</span> Amarela
          <span className="q-count q-count-vermelha">V</span> Vermelha
          <span className="q-count q-count-roxa">R</span> Roxa
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {editingId ? 'Editar Militar' : 'Novo Militar'}
              </span>
              <button className="btn-icon" onClick={closeModal} type="button">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="s-nome">Nome *</label>
                  <input
                    id="s-nome"
                    type="text"
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome completo"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="s-patente">Patente / Posto</label>
                  <input
                    id="s-patente"
                    type="text"
                    value={form.patente}
                    onChange={e => setForm(f => ({ ...f, patente: e.target.value }))}
                    placeholder="Ex: Sd, Cb, 3Sgt..."
                  />
                </div>
                <div className="form-group">
                  <div className="toggle-wrapper">
                    <label className="toggle" style={{ marginBottom: 0 }}>
                      <input
                        type="checkbox"
                        checked={form.ativo}
                        onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                      />
                      <span className="toggle-track" />
                      <span className="toggle-thumb" />
                    </label>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Ativo</span>
                  </div>
                </div>
                {!editingId && (
                  <div className="alert alert-info text-xs">
                    O militar será adicionado como o mais moderno (menor prioridade na escala). Use os botões ↑↓ para reordenar.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={closeModal} type="button">
                  Cancelar
                </button>
                <button className="btn btn-primary" type="submit" disabled={!form.nome.trim()}>
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
