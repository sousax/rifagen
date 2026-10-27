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

### 2. Login Google

1. Supabase → **Authentication** → **Sign In / Providers** → **Google**: copie a **Callback URL** (`https://<ref>.supabase.co/auth/v1/callback`). Deixe a aba aberta.
2. [console.cloud.google.com](https://console.cloud.google.com) → crie um projeto (ex.: "rifa").
3. **Google Auth Platform** → **Get started** (tela de consentimento): nome "Rifa", seu e-mail de suporte, público **External**, seu e-mail de contato. **Não envie logo** (logo exige verificação).
4. **Audience**: deixe em **Testing** e, em **Test users**, adicione os e-mails dos organizadores.
5. **Data Access**: não adicione escopos (ficam só `openid`, `email`, `profile`).
6. **Clients** → **Create client** → tipo **Web application**:
   - *Authorized JavaScript origins*: `https://<usuario>.github.io` e `http://localhost:8000`
   - *Authorized redirect URIs*: a Callback URL do passo 2.1
   - **Create** e copie o **Client ID** e o **Client secret**.
7. De volta ao Supabase (provider Google): cole Client ID e Client secret, ligue **Enable Sign in with Google** → **Save**.
8. Supabase → **Authentication** → **URL Configuration**:
   - *Site URL*: `https://<usuario>.github.io/rifagen/`
   - *Redirect URLs* → **Add URL**: `https://<usuario>.github.io/rifagen/**` e `http://localhost:8000/**`

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

Conferir: abrir no celular, entrar com Google, ver a grade; fechar e reabrir (continua logado); entrar com um e-mail fora da lista (vê "Sem acesso").
