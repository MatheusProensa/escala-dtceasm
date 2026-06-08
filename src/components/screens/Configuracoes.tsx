import { useState } from 'react';
import { Sun, Moon, Info, Lock, Shield } from 'lucide-react';

interface ConfiguracoesProps {
  escalante: string;
  comandante: string;
  theme: 'dark' | 'light';
  hasPassword: boolean;
  onSave: (escalante: string, comandante: string) => void;
  onToggleTheme: () => void;
  onSetPassword: (password: string) => void;
  onLogout: () => void;
}

export default function Configuracoes({
  escalante, comandante, theme, hasPassword,
  onSave, onToggleTheme, onSetPassword, onLogout,
}: ConfiguracoesProps) {
  const [localEscalante, setLocalEscalante] = useState(escalante);
  const [localComandante, setLocalComandante] = useState(comandante);
  const [saved, setSaved] = useState(false);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const [senhaSalva, setSenhaSalva] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave(localEscalante, localComandante);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSalvarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha && novaSenha !== confirmarSenha) {
      setSenhaErro('As senhas não coincidem.');
      return;
    }
    onSetPassword(novaSenha);
    setNovaSenha('');
    setConfirmarSenha('');
    setSenhaErro('');
    setSenhaSalva(true);
    setTimeout(() => setSenhaSalva(false), 2500);
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
          <span className="card-title"><Shield size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />Segurança</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          {hasPassword
            ? 'O sistema está protegido por senha. Deixe os campos em branco para remover a senha.'
            : 'Defina uma senha para proteger o acesso ao sistema.'}
        </div>
        <form onSubmit={handleSalvarSenha}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cfg-senha">Nova senha</label>
              <input
                id="cfg-senha"
                type="password"
                value={novaSenha}
                onChange={e => { setNovaSenha(e.target.value); setSenhaErro(''); setSenhaSalva(false); }}
                placeholder={hasPassword ? 'Nova senha (ou vazio para remover)' : 'Digite a senha'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cfg-senha2">Confirmar senha</label>
              <input
                id="cfg-senha2"
                type="password"
                value={confirmarSenha}
                onChange={e => { setConfirmarSenha(e.target.value); setSenhaErro(''); }}
                placeholder="Repita a senha"
              />
            </div>
          </div>
          {senhaErro && <div className="text-danger text-sm mb-2">{senhaErro}</div>}
          {senhaSalva && <div className="text-sm mb-2" style={{ color: 'var(--success)' }}>✓ {novaSenha ? 'Senha definida com sucesso!' : 'Senha removida.'}</div>}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-primary" type="submit">
              <Lock size={15} />
              {hasPassword ? 'Alterar senha' : 'Definir senha'}
            </button>
            {hasPassword && (
              <button className="btn btn-ghost btn-sm" type="button" onClick={onLogout}>
                Sair (logout)
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
