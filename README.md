# Rifagen

Site da rifa familiar: página estática (`index.html`) + Supabase. Termos em [GLOSSARY.md](GLOSSARY.md).

| Arquivo | O que é |
|---|---|
| `index.html` | A página. `supabase-js` via CDN, sem build. |
| `rifa.js` | Módulo de domínio puro (sem DOM, sem Supabase). |
| `rifa.test.js` | Testes do domínio: `node --test` (Node 22+, sem dependências). |
| `schema.sql` | Schema + RLS. Roda uma vez no Supabase. |

Rodar local: `python3 -m http.server 8000` e abrir `http://localhost:8000`.

## Colocar no ar (passos manuais)

Troque `<usuario>` pelo seu usuário do GitHub. A URL do site fica `https://<usuario>.github.io/rifagen/`.

### 1. Projeto Supabase + schema

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project** → plano Free, região São Paulo. Guarde a senha do banco.
2. **SQL Editor** → **New query** → cole todo o `schema.sql` → **Run**. Deve terminar com "Success. No rows returned".

### 2. Login (e-mail e senha)

1. Supabase → **Authentication** → **Sign In / Providers** → **Email**: deixe ligado e **desligue** *Allow new users to sign up* (ninguém se cadastra pelo site).
2. **Authentication** → **Users** → **Add user** → **Create new user**: e-mail e senha (mínimo 6 caracteres), marque **Auto Confirm User**. Não coloque a senha no repo, que é público.
3. **Authentication** → **URL Configuration** → *Site URL*: `https://<usuario>.github.io/rifagen/`.

### 3. Organizadores e a rifa

Supabase → **SQL Editor**, ajuste e rode:

```sql
insert into organizadores (email) values
  ('voce@gmail.com'),
  ('mae@gmail.com'),
  ('pai@gmail.com');  -- sempre em minúsculas

insert into rifa (total, preco, data_sorteio, premios)
values (100, 10.00, '2026-12-20', array['1º prêmio', '2º prêmio']);
```

Para liberar alguém depois: **Table Editor** → `organizadores` → **Insert row**.

### 4. Chaves na página

Supabase → **Project Settings** → **API** (ou **Data API** / **API Keys**): copie a **Project URL** e a chave **anon** (*publishable*). Em `index.html`, troque:

```js
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-CHAVE-ANON';
```

Commit e push. São públicas por design; quem protege os dados é a RLS. **Nunca** use a chave `service_role`.

### 5. GitHub Pages

GitHub → repo → **Settings** → **Pages** → *Source*: **Deploy from a branch** → branch `main`, pasta `/ (root)` → **Save**. Em ~1 min o site está em `https://<usuario>.github.io/rifagen/`.

Conferir: abrir no celular, entrar com e-mail e senha, ver a grade; fechar e reabrir (continua logado); um usuário fora de `organizadores` vê "Sem acesso".

### 6. Conferir a segurança e o ao vivo

O `schema.sql` já liga o Realtime nas 4 tabelas (`alter publication supabase_realtime ...`). Para conferir: **Database** → **Publications** → `supabase_realtime` lista `rifa`, `compradores`, `numeros` e `ganhadores`.

1. **Ao vivo**: abra o site em dois celulares (dois organizadores). Reserve um número num deles: o outro muda de cor e o painel atualiza sozinho, sem recarregar.
2. **Quem está fora não lê nada**: entre com um e-mail fora de `organizadores` → aparece "Sem acesso". No **SQL Editor**:
   ```sql
   set role authenticated;
   set request.jwt.claims = '{"email":"fora@exemplo.com"}';
   select (select count(*) from rifa) r, (select count(*) from compradores) c,
          (select count(*) from numeros) n, (select count(*) from ganhadores) g;  -- tudo 0
   reset role;
   ```
3. **Número ocupado não reserva, e nada é salvo**: no celular A selecione o 5 e toque **Registrar** (painel aberto). No B registre o 5: o título do painel no A tira o 5 sozinho. Para o tudo ou nada, no **SQL Editor** (troque 5 por um número ocupado e 6 por um livre):
   ```sql
   set role authenticated;
   set request.jwt.claims = '{"email":"voce@gmail.com"}';
   select registrar('Novo', '5511911112222', array[6, 5], 'pago');  -- erro: duplicate key (numeros_pkey)
   ```
   Depois, numa query nova: `select count(*) from compradores where telefone = '5511911112222';` → 0, e o 6 continua livre.
4. **Depois do sorteio, nada muda** (com um ganhador já sorteado). No **SQL Editor**, com o e-mail de um organizador:
   ```sql
   set role authenticated;
   set request.jwt.claims = '{"email":"voce@gmail.com"}';
   update rifa set preco = 1;              -- UPDATE 0
   update compradores set nome = 'x';      -- UPDATE 0
   update numeros set estado = 'pago';     -- UPDATE 0
   delete from numeros;                    -- DELETE 0
   reset role;
   ```
   A RLS esconde as linhas da escrita: 0 linhas afetadas, não erro. O `registrar` do item 3 (com números livres) dá erro "new row violates row-level security policy".
5. **Ganhador não se altera pelo site**:
   ```sql
   set role authenticated;
   set request.jwt.claims = '{"email":"voce@gmail.com"}';
   update ganhadores set numero = numero;  -- erro: permission denied for table ganhadores
   ```
   Rode de novo com `delete from ganhadores;` no lugar do `update` → mesmo erro. (O erro desfaz também o `set role`.)
