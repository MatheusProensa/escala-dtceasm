import { useState } from 'react';
import { Lock } from 'lucide-react';
import logoUrl from '../../assets/logo-dtceasm.png';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const err = await onLogin(email, password);
    if (err) {
      setError(err);
      setPassword('');
    }
    setLoading(false);
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
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="seu@email.com"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-pw">Senha</label>
            <input
              id="login-pw"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
            />
            {error && (
              <div className="text-danger text-sm mt-1">{error}</div>
            )}
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            <Lock size={16} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
