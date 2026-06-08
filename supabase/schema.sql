-- Tabela de militares
create table if not exists soldados (
  id text primary key,
  nome text not null,
  patente text not null default '',
  ativo boolean not null default true,
  ordem_antiguidade integer not null,
  created_at timestamptz default now()
);

-- Tabela de indisponibilidades
create table if not exists indisponibilidades (
  id text primary key,
  soldado_id text not null references soldados(id) on delete cascade,
  data_inicio text not null,
  data_fim text not null,
  motivo text not null default '',
  created_at timestamptz default now()
);

-- Tabela de datas especiais
create table if not exists datas_especiais (
  id text primary key,
  data text not null,
  tipo text not null check (tipo in ('preta', 'amarela', 'vermelha', 'roxa')),
  descricao text not null default '',
  created_at timestamptz default now()
);

-- Tabela de escalas (dias salvos como JSONB)
create table if not exists escalas (
  id text primary key,
  nome text not null,
  periodo_inicio text not null,
  periodo_fim text not null,
  dias jsonb not null default '[]'::jsonb,
  gerada_em text not null
);

-- Tabela de configurações
create table if not exists configuracoes (
  chave text primary key,
  valor text not null default '',
  updated_at timestamptz default now()
);

-- Habilitar RLS em todas as tabelas
alter table soldados enable row level security;
alter table indisponibilidades enable row level security;
alter table datas_especiais enable row level security;
alter table escalas enable row level security;
alter table configuracoes enable row level security;

-- Políticas: usuários autenticados têm acesso total
create policy "auth_all" on soldados for all to authenticated using (true) with check (true);
create policy "auth_all" on indisponibilidades for all to authenticated using (true) with check (true);
create policy "auth_all" on datas_especiais for all to authenticated using (true) with check (true);
create policy "auth_all" on escalas for all to authenticated using (true) with check (true);
create policy "auth_all" on configuracoes for all to authenticated using (true) with check (true);
