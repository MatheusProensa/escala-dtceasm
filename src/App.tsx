import { useState, useEffect } from 'react';
import type { Tela } from './types';
import { useAppData } from './hooks/useAppData';
import { useSettings } from './hooks/useSettings';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './components/screens/Login';
import Dashboard from './components/screens/Dashboard';
import Soldados from './components/screens/Soldados';
import Indisponibilidade from './components/screens/Indisponibilidade';
import DatasEspeciais from './components/screens/DatasEspeciais';
import GerarEscala from './components/screens/GerarEscala';
import Historico from './components/screens/Historico';
import Configuracoes from './components/screens/Configuracoes';
import Quadrinhos from './components/screens/Quadrinhos';
import Regulamento from './components/screens/Regulamento';

const telaLabels: Record<Tela, string> = {
  dashboard: 'Início',
  soldados: 'Militares',
  indisponibilidade: 'Indisponibilidade',
  'datas-especiais': 'Datas Especiais',
  gerar: 'Gerar Escala',
  historico: 'Histórico de Escalas',
  quadrinhos: 'Quadrinhos',
  regulamento: 'Regulamento',
  configuracoes: 'Configurações',
};

export default function App() {
  const [currentTela, setCurrentTela] = useState<Tela>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const appData = useAppData();
  const settings = useSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return 'Email ou senha incorretos.';
    return null;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentTela('dashboard');
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Verificando acesso...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (appData.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Carregando dados...</span>
      </div>
    );
  }

  if (appData.error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{appData.error}</span>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  function renderTela() {
    switch (currentTela) {
      case 'dashboard':
        return (
          <Dashboard
            data={appData.data}
            onNavigate={setCurrentTela}
          />
        );
      case 'soldados':
        return (
          <Soldados
            soldados={appData.data.soldados}
            escalas={appData.data.escalas}
            onAdd={appData.addSoldado}
            onUpdate={appData.updateSoldado}
            onDelete={appData.deleteSoldado}
            onReorder={appData.reorderSoldados}
          />
        );
      case 'indisponibilidade':
        return (
          <Indisponibilidade
            soldados={appData.data.soldados}
            indisponibilidades={appData.data.indisponibilidades}
            onAdd={appData.addIndisponibilidade}
            onDelete={appData.deleteIndisponibilidade}
          />
        );
      case 'datas-especiais':
        return (
          <DatasEspeciais
            datasEspeciais={appData.data.datasEspeciais}
            onAdd={appData.addDataEspecial}
            onDelete={appData.deleteDataEspecial}
          />
        );
      case 'gerar':
        return (
          <GerarEscala
            soldados={appData.data.soldados}
            indisponibilidades={appData.data.indisponibilidades}
            datasEspeciais={appData.data.datasEspeciais}
            escalas={appData.data.escalas}
            onSave={appData.saveEscala}
            onGoToHistorico={() => setCurrentTela('historico')}
          />
        );
      case 'historico':
        return (
          <Historico
            soldados={appData.data.soldados}
            escalas={appData.data.escalas}
            indisponibilidades={appData.data.indisponibilidades}
            onDelete={appData.deleteEscala}
            escalante={settings.escalante}
            comandante={settings.comandante}
          />
        );
      case 'quadrinhos':
        return (
          <Quadrinhos
            soldados={appData.data.soldados}
            escalas={appData.data.escalas}
          />
        );
      case 'regulamento':
        return <Regulamento />;
      case 'configuracoes':
        return (
          <Configuracoes
            escalante={settings.escalante}
            comandante={settings.comandante}
            theme={settings.theme}
            onSave={(e, c) => { settings.setEscalante(e); settings.setComandante(c); }}
            onToggleTheme={settings.toggleTheme}
            onLogout={handleLogout}
          />
        );
    }
  }

  return (
    <Layout
      sidebar={
        <Sidebar
          currentTela={currentTela}
          onNavigate={setCurrentTela}
        />
      }
      topbar={
        <Topbar
          title={telaLabels[currentTela]}
          theme={settings.theme}
          onToggleTheme={settings.toggleTheme}
        />
      }
    >
      {renderTela()}
    </Layout>
  );
}
