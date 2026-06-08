import { useState } from 'react';
import { Lock } from 'lucide-react';
import logoUrl from '../../assets/logo-dtceasm.png';

interface LoginProps {
  onLogin: (password: string) => boolean;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = onLogin(password);
    if (!ok) {
      setError(true);
      setPassword('');
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo-wrap">
          <img src={logoUrl} alt="DTCEA-SM" className="login-logo" />
        </div>
        <div className="login-title">DTCEA-SM</div>
        <div className="login-subtitle">Escala de Serviço — Permanência</div>
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', textAlign: 'left' }}>
          <div className="form-group">
            <label htmlFor="login-pw">Senha de acesso</label>
            <input
              id="login-pw"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="••••••••"
              autoFocus
            />
            {error && (
              <div className="text-danger text-sm mt-1">Senha incorreta. Tente novamente.</div>
            )}
          </div>
          <button className="btn btn-primary w-full" type="submit">
            <Lock size={16} />
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
