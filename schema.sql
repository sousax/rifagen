-- Schema + RLS da rifa. Rodar UMA vez no SQL editor de um projeto Supabase novo.
-- O SQL editor ignora RLS: é por ele (ou pelo Table Editor) que se mexe em `organizadores`
-- e se corrige `ganhadores`.

-- ---------- tabelas ----------

create table public.organizadores (
  email text primary key check (email = lower(email))
);

-- Uma linha só (id sempre true).
create table public.rifa (
  id boolean primary key default true check (id),
  total integer not null check (total > 0),
  preco numeric(10, 2) not null check (preco > 0),
  data_sorteio date,
  premios text[] not null default '{}'  -- ordem: 1º, 2º, ...
);

create table public.compradores (
  id bigint generated always as identity primary key,
  nome text not null check (btrim(nome) <> ''),
  telefone text not null unique check (telefone ~ '^55[0-9]+$')  -- só dígitos com 55
);

-- Livre = não existe linha. A PK impede reserva dupla.
create table public.numeros (
  numero integer primary key check (numero > 0),
  comprador_id bigint not null references public.compradores (id) on delete restrict,
  estado text not null check (estado in ('reservado', 'pago')),
  atualizado_por text,  -- e-mail do JWT, preenchido pelo trigger abaixo
  atualizado_em timestamptz not null default now()
);

create table public.ganhadores (
  posicao integer primary key check (posicao > 0),  -- 1 = 1º prêmio
  numero integer not null unique references public.numeros (numero) on delete restrict,
  sorteado_em timestamptz not null default now()
);

-- ---------- atualizado_por vem do banco, nunca do cliente ----------

create function public.marcar_atualizacao() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_por := auth.jwt() ->> 'email';
  new.atualizado_em := now();
  return new;
end $$;

create trigger numeros_atualizacao before insert or update on public.numeros
for each row execute function public.marcar_atualizacao();

-- ---------- funções usadas pela RLS ----------
-- security definer: leem tabelas que o próprio usuário não consegue ler.

create function public.is_organizador() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organizadores o
    where o.email = lower((select auth.jwt() ->> 'email'))
  )
$$;

-- Existe qualquer ganhador → rifa só leitura.
create function public.rifa_encerrada() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ganhadores)
$$;

-- ---------- permissões (RLS decide linha a linha) ----------

revoke all on public.organizadores, public.rifa, public.compradores, public.numeros, public.ganhadores
  from anon, authenticated;
grant select, update on public.rifa to authenticated;
grant select, insert, update on public.compradores to authenticated;
grant select, insert, update, delete on public.numeros to authenticated;
grant select, insert on public.ganhadores to authenticated;
-- organizadores: sem grant nem política; só o painel do Supabase mexe.

alter table public.organizadores enable row level security;
alter table public.rifa enable row level security;
alter table public.compradores enable row level security;
alter table public.numeros enable row level security;
alter table public.ganhadores enable row level security;

-- rifa: a linha inicial é inserida pelo SQL editor; o site só lê e altera.
create policy rifa_ler on public.rifa for select to authenticated
  using ((select public.is_organizador()));
create policy rifa_alterar on public.rifa for update to authenticated
  using ((select public.is_organizador()) and not (select public.rifa_encerrada()))
  with check ((select public.is_organizador()) and not (select public.rifa_encerrada()));

-- compradores: sem delete pelo site (comprador sem números permanece).
create policy compradores_ler on public.compradores for select to authenticated
  using ((select public.is_organizador()));
create policy compradores_criar on public.compradores for insert to authenticated
  with check ((select public.is_organizador()) and not (select public.rifa_encerrada()));
create policy compradores_alterar on public.compradores for update to authenticated
  using ((select public.is_organizador()) and not (select public.rifa_encerrada()))
  with check ((select public.is_organizador()) and not (select public.rifa_encerrada()));

-- numeros: delete = liberar o número.
create policy numeros_ler on public.numeros for select to authenticated
  using ((select public.is_organizador()));
create policy numeros_criar on public.numeros for insert to authenticated
  with check ((select public.is_organizador()) and not (select public.rifa_encerrada()));
create policy numeros_alterar on public.numeros for update to authenticated
  using ((select public.is_organizador()) and not (select public.rifa_encerrada()))
  with check ((select public.is_organizador()) and not (select public.rifa_encerrada()));
create policy numeros_liberar on public.numeros for delete to authenticated
  using ((select public.is_organizador()) and not (select public.rifa_encerrada()));

-- ganhadores: só insert; o resultado não se desfaz pelo site.
create policy ganhadores_ler on public.ganhadores for select to authenticated
  using ((select public.is_organizador()));
create policy ganhadores_criar on public.ganhadores for insert to authenticated
  with check ((select public.is_organizador()));
