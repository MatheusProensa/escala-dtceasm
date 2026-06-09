import { useState } from 'react';
import { Plus, Trash2, X, Star } from 'lucide-react';
import type { DataEspecial, TipoQuadrinho } from '../../types';
import { formatDateBR, getDayName } from '../../utils/dateUtils';

interface DatasEspeciaisProps {
  datasEspeciais: DataEspecial[];
  onAdd: (de: Omit<DataEspecial, 'id'>) => void;
  onDelete: (id: string) => void;
}

interface FormState {
  data: string;
  tipo: TipoQuadrinho;
  descricao: string;
}

const tipoOptions: { value: TipoQuadrinho; label: string; hint: string }[] = [
  { value: 'vermelha', label: 'Vermelha', hint: 'Feriados comuns (Tiradentes, 7 de Setembro, etc.)' },
  { value: 'roxa', label: 'Roxa', hint: 'Carnaval, Natal, Ano Novo e vésperas' },
];

function emptyForm(): FormState {
  return { data: '', tipo: 'vermelha', descricao: '' };
}

function tipoLabel(tipo: TipoQuadrinho): string {
  switch (tipo) {
    case 'preta': return 'Preta';
    case 'amarela': return 'Amarela';
    case 'vermelha': return 'Vermelha';
    case 'roxa': return 'Roxa';
  }
}

export default function DatasEspeciais({
  datasEspeciais,
  onAdd,
  onDelete,
}: DatasEspeciaisProps) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sorted = [...datasEspeciais].sort((a, b) => a.data.localeCompare(b.data));

  function openAdd() {
    setForm(emptyForm());
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm(emptyForm());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.data) return;
    onAdd({
      data: form.data,
      tipo: form.tipo,
      descricao: form.descricao.trim(),
    });
    closeModal();
  }

  function quickAdd(data: string, descricao: string, tipo: TipoQuadrinho = 'roxa') {
    // Check if already exists
    if (datasEspeciais.some(d => d.data === data)) return;
    onAdd({ data, tipo, descricao });
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  function isAlreadyAdded(data: string) {
    return datasEspeciais.some(d => d.data === data);
  }

  // Carnaval dates (need manual entry) - provide examples
  function getCarnavalExample(year: number): string {
    // Carnaval is 47 days before Easter. Easter varies. Just show the year.
    return `${year} (calcular manualmente)`;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Feriados</div>
          <div className="page-subtitle">Gerencie os feriados que afetam a escala</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} type="button">
          <Plus size={16} />
          Adicionar Data
        </button>
      </div>

      {/* Quick Add Section */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Adicionar Datas Padrão</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Datas fixas do ano — clique para adicionar:
        </div>
        <div className="quick-add-grid">
          {years.flatMap(year => [
            {
              data: `${year}-12-24`,
              label: `Véspera Natal ${year}`,
              descricao: `Véspera de Natal ${year}`,
            },
            {
              data: `${year}-12-25`,
              label: `Natal ${year}`,
              descricao: `Natal ${year}`,
            },
            {
              data: `${year}-12-31`,
              label: `Véspera Ano Novo ${year}`,
              descricao: `Véspera de Ano Novo ${year}`,
            },
            {
              data: `${year}-01-01`,
              label: `Ano Novo ${year}`,
              descricao: `Ano Novo ${year}`,
            },
          ]).map(item => {
            const today = new Date().toISOString().slice(0, 10);
            const isPast = item.data < today;
            const added = isAlreadyAdded(item.data);
            if (isPast && !added) return null;
            return (
              <button
                key={item.data}
                className={`btn ${added ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                onClick={() => quickAdd(item.data, item.descricao)}
                disabled={added}
                type="button"
                title={added ? 'Já adicionado' : `Adicionar ${item.label} como roxa`}
              >
                {added ? '✓ ' : '+ '}{item.label}
              </button>
            );
          })}
        </div>
        <div className="alert alert-warning mt-3">
          <strong>Carnaval:</strong> As datas do Carnaval variam a cada ano ({years.map(y => getCarnavalExample(y)).join(', ')}).
          Adicione manualmente usando o botão "Adicionar Data" acima.
        </div>
      </div>

      {datasEspeciais.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Star size={48} strokeWidth={1} />
          </div>
          <div className="empty-state-text">Nenhum feriado cadastrado</div>
          <div className="empty-state-sub">Adicione feriados usando o botão acima</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Dia da Semana</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(de => {
                const today = new Date().toISOString().slice(0, 10);
                const isPast = de.data < today;
                const added = isAlreadyAdded(de.data);
                if (isPast && !added) return null;
                return (
                  <tr key={de.id} style={{ opacity: isPast ? 0.6 : 1 }}>
                    <td style={{ fontFamily: 'monospace' }}>{formatDateBR(de.data)}</td>
                    <td className="text-secondary">{getDayName(de.data)}</td>
                    <td>
                      <span className={`badge badge-${de.tipo}`}>{tipoLabel(de.tipo)}</span>
                    </td>
                    <td>{de.descricao || '—'}</td>
                    <td>
                      {deleteConfirmId === de.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-danger">Confirmar?</span>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => { onDelete(de.id); setDeleteConfirmId(null); }}
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
                          onClick={() => setDeleteConfirmId(de.id)}
                          title="Excluir"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Adicionar Feriado</span>
              <button className="btn-icon" onClick={closeModal} type="button">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="de-data">Data *</label>
                  <input
                    id="de-data"
                    type="date"
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    required
                    autoFocus
                  />
                  {form.data && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {getDayName(form.data)}, {formatDateBR(form.data)}
                      {isAlreadyAdded(form.data) && (
                        <span className="text-danger"> — Esta data já foi cadastrada</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="de-tipo">Tipo *</label>
                  <select
                    id="de-tipo"
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoQuadrinho }))}
                  >
                    {tipoOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span className={`badge badge-${form.tipo}`} style={{ marginRight: '0.5rem' }}>{tipoLabel(form.tipo)}</span>
                    {tipoOptions.find(o => o.value === form.tipo)?.hint}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="de-desc">Descrição</label>
                  <input
                    id="de-desc"
                    type="text"
                    value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Ex: Carnaval 2025, Natal..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={closeModal} type="button">
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!form.data || isAlreadyAdded(form.data)}
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
