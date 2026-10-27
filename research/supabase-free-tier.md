# Supabase grátis: pausa, limites e login Google em site estático

Pesquisa do ticket #2 (out/2026). Fontes primárias citadas em cada item.

## 1. Pausa por inatividade

- Projeto Free **pausa após ~1 semana sem atividade de banco** ("sufficient user database activity over the past week"). Algumas requisições por dia já bastam para evitar. — [Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Pricing](https://supabase.com/pricing)
- O dono recebe **e-mail de aviso** cerca de uma semana antes e outro quando pausa. — [Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- **Reativar:** Dashboard → projeto → *Resume project*. Pode ser restaurado por **até 1 ano** após a pausa, com os dados. (Um changelog de 2024 dizia 90 dias; a doc atual diz 1 ano.) — [Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Upgrading](https://supabase.com/docs/guides/platform/upgrading)
- Passado o prazo, ainda dá para baixar o backup do banco pelo dashboard. — [Upgrading](https://supabase.com/docs/guides/platform/upgrading)
- Projetos pausados **não contam** no limite de 2 projetos grátis. — [Billing](https://supabase.com/docs/guides/platform/billing-on-supabase)
- Free **não tem backups automáticos**. — [Pricing](https://supabase.com/pricing)

**Como evitar:**
- Mais simples: aceitar a pausa e clicar *Resume* quando chegar o e-mail (dados preservados por 1 ano).
- Keep-alive com GitHub Actions `schedule` (ex.: `select` diário via REST): funciona, mas em repo público o GitHub **desativa workflows agendados após 60 dias sem atividade no repo**. — [GitHub Docs](https://docs.github.com/actions/managing-workflow-runs/disabling-and-enabling-a-workflow)

## 2. Limites do plano Free — [Pricing](https://supabase.com/pricing)

| Recurso | Free | Uso da rifa |
|---|---|---|
| Banco | 500 MB por projeto | ~1000 linhas de poucos centenas de bytes: < 1 MB |
| Egress | 5 GB/mês (+5 GB cached) | carga completa ~200–300 KB → milhares de cargas/mês |
| Auth MAU | 50.000 | 2–3 organizadores |
| Storage | 1 GB | não usa |
| Projetos ativos | 2 | 1 |
| Realtime | 200 conexões, 2 M msgs/mês | sobra |

Nenhum limite preocupa. O único risco real é a **pausa** e a **falta de backup**.

## 3. Login Google em site estático (GitHub Pages) — [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

Passos:
1. Google Cloud → Google Auth Platform → *Clients* → OAuth client tipo **Web application**.
   - *Authorized JavaScript origins*: a origem do site, sem caminho (ex.: `https://<usuario>.github.io`), + `http://localhost:<porta>` para dev.
   - *Authorized redirect URIs*: a **callback do Supabase** (`https://<ref>.supabase.co/auth/v1/callback`), copiada da página do provider Google no dashboard.
2. Supabase → Auth → Providers → Google: colar Client ID/Secret e habilitar.
3. Supabase → Auth → URL Configuration: *Site URL* = URL do site; *Redirect URLs* = allow list. Wildcards: `*` não cruza `/`, `**` cruza. Ex.: `https://<usuario>.github.io/rifagen/**`. — [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
4. No JS: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href } })`. No browser o fluxo implícito basta: o Google volta para o site com a sessão, sem rota de servidor.

**Domínio próprio:** não é necessário. O redirect do Google aponta para o Supabase, não para o site. O *custom domain* do Supabase (para a tela mostrar o seu domínio em vez de `<ref>.supabase.co`) é **add-on pago**, só em plano pago. — [Custom Domains](https://supabase.com/docs/guides/platform/custom-domains). Efeito: a tela do Google mostra "continuar para `<ref>.supabase.co`". Para família, aceitável.

**Tela de consentimento** — [Google: Manage App Audience](https://support.google.com/cloud/answer/15549945), [Verification exceptions](https://support.google.com/cloud/answer/13464323):
- Modo **Testing**: até 100 test users; autorizações normalmente expiram em 7 dias. **Exceção:** se o app pede só `openid`, `email`, `profile` (o padrão do Supabase), usuários não precisam estar na lista, não veem aviso e a autorização não expira em 7 dias.
- Apps em teste ou de uso pessoal (< 100 usuários) **não passam por verificação**.
- Recomendação: tipo **External**, só os escopos padrão, sem logo (logo/branding dispara verificação de marca, que leva dias). Pode ficar em Testing e cadastrar os 2–3 e-mails como test users, por garantia.
- A sessão do app é do Supabase (refresh próprio), não depende do token do Google.

## 4. Restringir a uma lista de e-mails

A chave `anon`/publishable vai no HTML e é pública; **qualquer conta Google consegue logar** se nada for feito. Duas camadas, ambas no Free:

1. **RLS (obrigatório)** em todas as tabelas expostas, com uma tabela `organizadores(email)`. Política tipo:
   ```sql
   using ( exists (select 1 from organizadores o where o.email = (select auth.jwt() ->> 'email')) )
   ```
   Usar `(select ...)` para cache por statement. Nunca autorizar por `user_metadata` (editável pelo usuário). A tabela `organizadores` também precisa de RLS (sem política de escrita para clientes). — [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
2. **Hook "Before User Created" (opcional, recomendado)**: função Postgres que recusa cadastro (`error` + 403) se o e-mail não estiver em `organizadores`. Evita que estranhos sequer virem usuários. Disponível em **Free e Pro**. — [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks), [Before User Created](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook)

O RLS sozinho já protege os dados; o hook só deixa a lista de usuários limpa e dá erro claro no login.

## Impacto nas decisões do mapa

- **Hospedagem:** GitHub Pages serve; não precisa domínio próprio.
- **Pausa:** a rifa vai pausar se ficar >1 semana parada. Decidir entre "reativar pelo e-mail" (zero esforço) e keep-alive agendado (frágil em repo público).
- **Backup:** Free não tem backup automático; vale um botão "exportar JSON" ou rotina manual (`pg_dump`/dashboard) antes do sorteio.
