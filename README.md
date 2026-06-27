# AvaliaMed

Sistema web para avaliação de médicos credenciados em convênios médicos.

## Stack

- React 18 + Vite
- React Router v6
- Supabase (banco, auth, API)
- React Hook Form
- Lucide React (ícones)
- CSS Modules

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

## Configuração do Supabase

### 1. Criar o projeto

Acesse [supabase.com](https://supabase.com), crie um novo projeto e guarde a **URL** e a **anon key**.

### 2. Criar o banco de dados

No painel do Supabase, abra **SQL Editor** e execute o conteúdo de `supabase/schema.sql`.

Isso criará:
- Tabelas: `medicos`, `avaliacoes`, `favoritos`, `curtidas_avaliacoes`, `denuncias`
- View: `medicos_com_stats` (médicos com nota média e total de avaliações)
- Funções RPC: `curtir_avaliacao`, `descurtir_avaliacao`
- Policies RLS para cada tabela

### 3. Ativar autenticação Google (opcional)

Em **Authentication → Providers → Google**, habilite e configure as credenciais OAuth do Google Cloud Console.

Adicione `http://localhost:5173` como **Redirect URL** para desenvolvimento.

### 4. Variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Executar localmente

```bash
npm install
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

## Build de produção

```bash
npm run build
npm run preview
```

## Deploy na Vercel

1. Importe o repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Framework Preset: **Vite**
4. Clique em **Deploy**

O arquivo `vercel.json` já configura o rewrite para SPA.

## Funcionalidades

| Funcionalidade | Autenticação |
|---|---|
| Visualizar médicos e avaliações | Pública |
| Buscar médicos | Pública |
| Ranking | Público |
| Avaliar médico | Requer login |
| Editar própria avaliação | Requer login |
| Favoritar médico | Requer login |
| Curtir avaliação | Requer login |
| Denunciar avaliação | Requer login |

## Estrutura do projeto

```
src/
  components/        # Componentes reutilizáveis
    DoctorCard/      # Card de médico
    DoctorForm/      # Formulário de cadastro de médico
    EmptyState/      # Estado vazio
    Header/          # Cabeçalho/nav
    LoadingSpinner/  # Indicador de carregamento
    Modal/           # Modal base
    NoteDisplay/     # Exibição colorida da nota
    RatingCard/      # Card de avaliação
    RatingForm/      # Formulário de avaliação
    SearchBar/       # Barra de busca
  contexts/
    AuthContext.jsx  # Contexto de autenticação
  hooks/
    useAuth.js       # (reexportado do contexto)
    useFavorite.js   # Toggle de favorito
    useSearch.js     # Busca com debounce
  pages/
    Auth/            # Login / cadastro
    DoctorProfile/   # Perfil do médico + avaliações
    Favorites/       # Médicos favoritados
    Home/            # Início com hero e ranking
    Ranking/         # Ranking completo com filtros
    Search/          # Busca de médicos
  services/
    auth.js          # Autenticação via Supabase
    avaliacoes.js    # CRUD de avaliações
    favoritos.js     # CRUD de favoritos
    medicos.js       # CRUD de médicos + ranking
  styles/
    global.css       # Reset + utilitários globais
    variables.css    # Design tokens CSS
  supabase/
    client.js        # Instância do Supabase
  utils/
    formatters.js    # Formatação de dados
    validators.js    # Listas de UFs e especialidades
```
