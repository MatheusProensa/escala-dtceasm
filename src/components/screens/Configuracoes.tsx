import { useState } from 'react';
import { Sun, Moon, Info, LogOut } from 'lucide-react';

interface ConfiguracoesProps {
  escalante: string;
  comandante: string;
  theme: 'dark' | 'light';
  onSave: (escalante: string, comandante: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export default function Configuracoes({
  escalante, comandante, theme,
  onSave, onToggleTheme, onLogout,
}: ConfiguracoesProps) {
  const [localEscalante, setLocalEscalante] = useState(escalante);
  const [localComandante, setLocalComandante] = useState(comandante);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave(localEscalante, localComandante);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Configurações</div>
          <div className="page-subtitle">Preferências gerais do sistema</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Dados do PDF Oficial</span>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="cfg-escalante">Escalante (nome e posto completo)</label>
            <input
              id="cfg-escalante"
              type="text"
              value={localEscalante}
              onChange={e => { setLocalEscalante(e.target.value); setSaved(false); }}
              placeholder="Ex: RODRIGO ZIMMERMANN CB SAD"
            />
          </div>
          <div className="form-group">
            <label htmlFor="cfg-comandante">Comandante do DTCEA-SM (nome e posto)</label>
            <input
              id="cfg-comandante"
              type="text"
              value={localComandante}
              onChange={e => { setLocalComandante(e.target.value); setSaved(false); }}
              placeholder="Ex: REINALDO FERRAZ DE OLIVEIRA CASTILHA MAJ AV"
            />
          </div>
          <div className="alert alert-info mb-3" style={{ fontSize: '0.8125rem' }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>Estes dados são preenchidos automaticamente no PDF do modelo oficial.</span>
          </div>
          <button className="btn btn-primary" type="submit">
            {saved ? '✓ Salvo!' : 'Salvar'}
          </button>
        </form>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Aparência</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Tema atual: <strong>{theme === 'dark' ? 'Escuro' : 'Claro'}</strong>
          </span>
          <button className="btn btn-ghost" onClick={onToggleTheme} type="button">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Sessão</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Encerra a sessão atual e retorna à tela de login.
        </div>
        <button className="btn btn-ghost" type="button" onClick={onLogout}>
          <LogOut size={15} />
          Sair (logout)
        </button>
      </div>
    </div>
  );
}
