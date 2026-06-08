import { ExternalLink } from 'lucide-react';

const artigos = [
  {
    num: 'Art. 14.',
    texto: 'Escala de Serviço é o documento configurado em relação nominal de militares ou fração de tropa destinadas à execução dos serviços previstos neste Regulamento.',
    paragrafos: [
      '§ 1º Poderá, a critério do Comandante, Chefe ou Diretor da OM e com periodicidade prevista em NPA, ser divulgado ao efetivo, planilha que contenha a contabilização atualizada da situação dos militares nas respectivas escalas.',
      '§ 2º A Escala de Serviço para os feriados e demais dias em que não haja expediente será elaborada separadamente daquela prevista para os dias de expediente normal.',
    ],
  },
  {
    num: 'Art. 15.',
    texto: 'As OM manterão controle, em setor específico, de todas as Escalas de Serviço, dos militares que a elas concorrerem, da escrituração e das alterações que nelas ocorram.',
    paragrafos: [
      'Parágrafo único. As Escalas de Serviço são regidas por NPA própria.',
    ],
  },
  {
    num: 'Art. 16.',
    texto: 'Deverá ser observado entre dois serviços de igual natureza ou não, quando da confecção da escala, para o mesmo militar, uma folga mínima de 48 horas.',
    paragrafos: [
      'Parágrafo único. O Comandante, Chefe ou Diretor da OM poderá, caso a situação assim o exija, reduzir o intervalo previsto no caput do artigo.',
    ],
  },
  {
    num: 'Art. 17.',
    texto: 'A designação para determinado serviço deve recair em quem tenha maior folga na escala, atendendo ao disposto no art. 7º.',
    paragrafos: [
      '§ 1º Em situação de igualdade, a Escala de Serviço será organizada obedecendo a sequência do militar mais moderno para o mais antigo.',
      '§ 2º Para contagem de folga, o serviço é considerado como executado desde que o militar escalado o tenha iniciado e permanecido no seu cumprimento por período igual ou superior a doze horas.',
      '§ 3º Ocorrendo atraso na rendição do serviço por lapso de tempo igual ou superior a quatro horas, será computado, para efeito de folga, mais um serviço executado pelo militar que não foi rendido no horário previsto.',
      '§ 4º No caso de restabelecimento de um serviço que se encontrava desativado, deve-se levar em consideração, sempre que possível, para contagem de folgas, a escala anterior desse serviço.',
    ],
  },
  {
    num: 'Art. 18.',
    texto: 'A designação de militar ou civil para os diversos Serviços de Escala da OM será feita até o último dia útil anterior à execução do serviço, conforme o disposto no Art. 11 deste Regulamento.',
    paragrafos: [
      'Parágrafo único. O Comandante, Chefe ou Diretor da OM ou seu representante legal acionará, a qualquer tempo, componente do seu efetivo para atender necessidades do serviço.',
    ],
  },
  {
    num: 'Art. 19.',
    texto: 'Quando o número de praças da graduação prevista para a execução de determinado serviço for menor que o exigido, podem ser incluídas as praças de graduação imediatamente inferior, dentro do mesmo círculo, a fim de completarem o número necessário.',
    paragrafos: [],
  },
  {
    num: 'Art. 20.',
    texto: 'Ao Serviço de Escala concorrem os oficiais e praças prontos, quaisquer que sejam os quadros e especialidades, exceto os casos previstos em legislação específica.',
    paragrafos: [],
  },
  {
    num: 'Art. 21.',
    texto: 'Os militares adidos à OM, desde que não haja incompatibilidade funcional ou administrativa, concorrem aos Serviços de Escala.',
    paragrafos: [],
  },
  {
    num: 'Art. 22.',
    texto: 'As praças prontas para o serviço são escaladas levando-se em consideração a sua capacitação e instrução.',
    paragrafos: [
      'Parágrafo único. Os militares do Quadro Especial de Sargentos da Aeronáutica (QESA) e os SO/SGT do Quadro de Taifeiros (QTA) são mantidos ou incluídos no mesmo tipo de Serviço de Escala da qual concorriam antes de suas promoções.',
    ],
  },
  {
    num: 'Art. 23.',
    texto: 'Os cadetes e alunos dos cursos de formação ou estágios de adaptação concorrem aos serviços normatizados pelos regulamentos e instruções das Organizações de Ensino, adequando-se, tanto quanto possível, ao estabelecido neste Regulamento.',
    paragrafos: [
      'Parágrafo único. As Organizações de Ensino devem organizar os Serviços de Escala, visando à preparação dos cadetes e alunos para o futuro desempenho dos serviços previstos neste Regulamento.',
    ],
  },
];

export default function Regulamento() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Regulamento</div>
          <div className="page-subtitle">RCA 34-1/2005 — Capítulo II: Escala de Serviço (Art. 14 a 23)</div>
        </div>
        <a
          href="/risaer.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          <ExternalLink size={15} />
          RISAER Completo (PDF)
        </a>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-elevated)', borderRadius: 6, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            CAPÍTULO II
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>ESCALA DE SERVIÇO</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {artigos.map(artigo => (
            <div key={artigo.num} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7, textAlign: 'justify' }}>
                <strong>{artigo.num}</strong>{' '}{artigo.texto}
              </p>
              {artigo.paragrafos.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-light)' }}>
                  {artigo.paragrafos.map((p, i) => (
                    <p key={i} style={{ fontSize: '0.8375rem', lineHeight: 1.65, color: 'var(--text-secondary)', textAlign: 'justify' }}>
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
          Fonte: RCA 34-1/2005 — Regulamento Interno dos Serviços das Organizações da Aeronáutica
        </div>
      </div>
    </div>
  );
}
