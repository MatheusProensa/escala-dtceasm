import { useState } from 'react';
import type { Tela } from './types';
import { useAppData } from './hooks/useAppData';
import { useSettings } from './hooks/useSettings';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Soldados from './components/screens/Soldados';
import Indisponibilidade from './components/screens/Indisponibilidade';
import DatasEspeciais from './components/screens/DatasEspeciais';
import GerarEscala from './components/screens/GerarEscala';
import Historico from './components/screens/Historico';
import Configuracoes from './components/screens/Configuracoes';

const telaLabels: Record<Tela, string> = {
  soldados: 'Militares',
  indisponibilidade: 'Indisponibilidade',
  'datas-especiais': 'Datas Especiais',
  gerar: 'Gerar Escala',
  historico: 'Histórico de Escalas',
  configuracoes: 'Configurações',
};

export default function App() {
  const [currentTela, setCurrentTela] = useState<Tela>('soldados');
  const appData = useAppData();
  const settings = useSettings();

  function renderTela() {
    switch (currentTela) {
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
      case 'configuracoes':
        return (
          <Configuracoes
            escalante={settings.escalante}
            comandante={settings.comandante}
            theme={settings.theme}
            onSave={(e, c) => { settings.setEscalante(e); settings.setComandante(c); }}
            onToggleTheme={settings.toggleTheme}
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
