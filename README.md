# Sistema de Gerenciamento de Restaurante & Cardápio Digital — UPF (Web & Mobile)

Este projeto **Full-Stack** foi desenvolvido para a disciplina de **Programação Web e Mobile** da Universidade de Passo Fundo (UPF). Ele integra o gerenciamento completo das rotinas de atendimento de um restaurante com uma interface moderna de gestão (**Restaurante Mesa**) e um **Cardápio Digital de Autoatendimento** para os clientes pedirem diretamente das mesas.

- **Back-end (`/` raiz)**: Desenvolvido em **TypeScript** com **NestJS**, **Prisma ORM**, banco de dados **SQLite**, documentação **Swagger** e autenticação **JWT**.
- **Front-end (`/frontend`)**: Desenvolvido em **Next.js (App Router)**, **React**, **TypeScript** e **Tailwind CSS**.

---

## 📋 Pré-requisitos

- **Node.js**: Versão 18 ou superior instalada ([https://nodejs.org](https://nodejs.org) ou via `winget install OpenJS.NodeJS.LTS`).
- **npm**: Gerenciador de pacotes padrão do Node.js.

---

## 🚀 Como Rodar o Projeto Completo (Back-end + Front-end)

> **💡 Dica para Windows PowerShell**: Caso você tenha acabado de instalar o Node.js e o terminal integrado do editor não reconheça o comando `npm`, execute antes no terminal:
> ```powershell
> $env:Path += ";C:\Program Files\nodejs"
> ```

### Passo 1: Iniciar o Back-end (Porta `3000`)

No **primeiro terminal**, na pasta raiz do projeto:

```powershell
# 1. Instalar as dependências do back-end
npm.cmd install

# 2. Configurar as variáveis de ambiente (copia .env.example para .env)
Copy-Item .env.example .env

# Conteúdo padrão do arquivo .env:
# PORT=3000
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="dev-secret"

# 3. Rodar as migrações do banco de dados (SQLite) e gerar o Prisma Client
npx.cmd prisma migrate dev
npx.cmd prisma generate

# 4. Popular o banco com os dados iniciais (Funcionários, 6 Mesas, 6 Produtos, Reservas e Comandas)
npm.cmd run seed

# 5. Iniciar a API Back-end em modo desenvolvimento
npm.cmd run start:dev
```

- **API Back-end em execução**: `http://localhost:3000/api`
- **Documentação interativa Swagger**: `http://localhost:3000/api/docs`

---

### Passo 2: Iniciar o Front-end Next.js (Porta `3001`)

Abra um **segundo terminal** (mantendo o back-end rodando no primeiro) e execute:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Acesse as telas no navegador:
- **Tela de Login e Cadastro de Equipe**: `http://localhost:3001/login`
  - **Administrador**: `admin@restaurant.com` | Senha: `admin123`
  - **Garçom**: `waiter@restaurant.com` | Senha: `admin123`
- **Área de Atendimento (Sistema de Gestão)**: `http://localhost:3001/atendimento`
- **Cardápio Digital do Cliente (Autoatendimento)**: `http://localhost:3001/cardapio`
- **Cardápio Digital por Mesa específica (QR Code)**: `http://localhost:3001/cardapio/4` (abre direto na Mesa 04)

---

## 🖥️ Arquitetura e Conceitos do Front-end (Next.js & React)

A aplicação front-end localizada na pasta `frontend/` foi construída utilizando o **Next.js App Router** e aplica os seguintes conceitos arquiteturais:

### 1. Client Components vs Server Components
- **Server Components (Padrão no App Router)**:
  - Arquivos: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(public)/layout.tsx`, `src/app/(admin)/layout.tsx`, `src/components/admin/AdminFooter.tsx` e páginas `page.tsx`.
  - Executam exclusivamente no servidor, lendo cookies de sessão via `next/headers` antes da renderização e reduzindo o bundle JavaScript enviado ao navegador.
- **Client Components (`'use client'`)**:
  - Arquivos: `LoginFormClient.tsx`, `PosDashboardClient.tsx`, `CustomerMenuClient.tsx`, `AdminHeader.tsx`, `AdminModals.tsx` e `AdminSectionClient.tsx`.
  - Responsáveis pela interatividade no navegador: estados React (`useState`, `useEffect`, `useMemo`), busca rápida com atalho `⌘K` / `Ctrl+K`, filtros dinâmicos por categoria e status de mesa, manipulação de `localStorage` e sincronização em tempo real entre abas via `BroadcastChannel`.

### 2. Roteamento por Pastas (`frontend/src/app/`)
```text
frontend/src/
├── middleware.ts                           # Proteção de rotas Admin vs Área Pública via Cookies (Edge)
├── app/
│   ├── layout.tsx                          # Root Layout global (Server Component)
│   ├── page.tsx                            # Redirecionamento inicial inteligente (/atendimento ou /login)
│   ├── api/auth/
│   │   ├── session/route.ts                # Route Handler: grava/lê cookies seguros de sessão
│   │   └── logout/route.ts                 # Route Handler: limpa os cookies de sessão
│   ├── (public)/                           # Grupo de rotas da ÁREA PÚBLICA
│   │   ├── layout.tsx                      # Layout público herdado por /login e /cardapio
│   │   ├── login/page.tsx                  # Rota /login (Login e Cadastro da equipe)
│   │   └── cardapio/
│   │       ├── page.tsx                    # Rota /cardapio (Cardápio Digital para clientes)
│   │       └── [mesa]/page.tsx             # Rota dinâmica /cardapio/[mesa] (ex.: /cardapio/4)
│   └── (admin)/                            # Grupo de rotas da ÁREA ADMIN PROTEGIDA
│       ├── layout.tsx                      # Layout administrativo herdado (Header, Modais e Footer)
│       ├── atendimento/page.tsx            # Rota /atendimento (Salão, Catálogo e Pedido Ativo)
│       ├── mesas/page.tsx                  # Rota /mesas (Gestão de mesas e links QR)
│       ├── reservas/page.tsx               # Rota /reservas (Controle de reservas)
│       ├── produtos/page.tsx               # Rota /produtos (Catálogo de produtos)
│       ├── pedidos/page.tsx                # Rota /pedidos (Comandas abertas e fechadas)
│       └── funcionarios/page.tsx           # Rota /funcionarios (Equipe e cargos)
```

### 3. Herança de Layouts por Pastas
- **Layout Raiz (`src/app/layout.tsx`)**: Define a estrutura HTML/Body, fontes e tema escuro (`#09090b`) para toda a aplicação.
- **Layout Público (`src/app/(public)/layout.tsx`)**: Herdado automaticamente pelas pastas `login/` e `cardapio/`, exibindo uma barra superior pública de navegação rápida entre o Cardápio do Cliente e o Acesso de Gestão.
- **Layout Administrativo (`src/app/(admin)/layout.tsx`)**: Herdado por todas as pastas dentro de `(admin)` (`atendimento`, `mesas`, `reservas`, `produtos`, `pedidos`, `funcionarios`). Mantém fixos o cabeçalho de gestão (`+ Nova mesa`, `+ Novo produto`, `+ Nova reserva`, `+ Cadastrar funcionário`, identificação do usuário logado e botão `Sair`), os modais globais de cadastro e o rodapé.

### 4. Área Pública e Proteção de Rotas Admin
- O arquivo `frontend/src/middleware.ts` intercepta todas as requisições antes da renderização:
  - **Rotas Protegidas (`/atendimento`, `/mesas`, `/reservas`, `/produtos`, `/pedidos`, `/funcionarios`)**: Exigem o cookie de autenticação `restaurant_token`. Caso ausente, o usuário é redirecionado automaticamente para `/login`.
  - **Rotas Públicas (`/login`, `/cardapio`, `/cardapio/[mesa]`)**: Acessíveis livremente para que qualquer cliente na mesa possa consultar o cardápio e enviar pedidos sem precisar de login administrativo.

### 5. Login, `localStorage` e Armazenamento Seguro com Cookies
- Implementado em `frontend/src/lib/auth-cookies.ts` e nos Route Handlers `/api/auth/session` e `/api/auth/logout`:
  - **Cookies Seguros (`SameSite=Lax`, `Path=/`, `Max-Age=8h`)**: Armazenam `restaurant_token` e `restaurant_user` para validação no servidor (SSR) e no Middleware do Next.js.
  - **`localStorage`**: Armazena o token JWT e os dados do funcionário para leitura imediata nas chamadas de API dos Client Components, além de persistir a sacola de pedidos do cliente (`restaurant_customer_cart`) e a mesa selecionada (`restaurant_customer_table`) no Cardápio Digital.

### 6. Integração em Tempo Real entre Cardápio do Cliente e Gestão
- Na tela `/cardapio`, o cliente seleciona sua mesa (ex.: **Mesa 04**), escolhe os itens do catálogo, adiciona observações opcionais (ex.: *"sem gelo"*, *"ao ponto"*) e clica em **Confirmar e Enviar para Mesa**.
- O pedido é gravado no banco SQLite pela rota `POST /api/public/orders`:
  - Se a mesa estava `DISPONÍVEL`, o sistema abre automaticamente uma nova comanda (`OPEN`) e altera o status da mesa para `OCUPADA`.
  - Se a mesa já possuía comanda aberta, os novos itens são somados ao pedido ativo (`#1042`) com identificação do cliente e recálculo automático do subtotal e da taxa de serviço de 10%.
- A tela `/atendimento` recebe a notificação instantaneamente e atualiza o painel **Pedido ativo** sem necessidade de recarregar a página.

---

## 💡 Como o Back-end Funciona

### 1. Autenticação e Segurança (JWT)
- A aplicação utiliza um **Guard Global** (`JwtAuthGuard`) que protege as rotas administrativas com token Bearer JWT.
- A rota de login (`POST /api/auth/login`) e as rotas de autoatendimento do cardápio do cliente (`/api/public/*`) são públicas.
- Usuários padrão criados pelo Seed (`npm run seed`):
  - **Administrador**: `admin@restaurant.com` | senha: `admin123`
  - **Garçom**: `waiter@restaurant.com` | senha: `admin123`

### 2. Módulos e Endpoints da API

| Módulo | Método | Rota | Descrição |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Realiza login e gera o token de acesso JWT |
| | `POST` | `/api/auth/register` | Cadastra novos funcionários (`ADMIN`, `MANAGER`, `WAITER`, `RECEPTIONIST`) |
| | `GET` | `/api/auth/staff` | Lista todos os funcionários cadastrados |
| **Mesas** | `POST` | `/api/tables` | Cadastra uma nova mesa |
| | `GET` | `/api/tables` | Lista todas as mesas e seus status (`AVAILABLE`, `OCCUPIED`, `RESERVED`) |
| | `GET` | `/api/tables/:id` | Busca detalhes de uma mesa |
| **Produtos** | `POST` | `/api/products` | Cadastra um produto no cardápio |
| | `GET` | `/api/products` | Lista todos os produtos ordenados por categoria |
| | `GET` | `/api/products/:id` | Busca um produto por ID |
| | `DELETE`| `/api/products/:id` | Remove um produto do cardápio |
| **Reservas** | `POST` | `/api/reservations` | Cria uma reserva para cliente com data, convidados e marca a mesa como `RESERVED` |
| | `GET` | `/api/reservations` | Lista todas as reservas com os dados da mesa |
| | `GET` | `/api/reservations/:id` | Busca uma reserva por ID |
| **Comandas** | `POST` | `/api/orders` | Abre comanda para uma mesa (Mesa muda para `OCCUPIED`) |
| | `POST` | `/api/orders/:id/items`| Adiciona itens ao pedido (calcula e soma o total automaticamente) |
| | `PATCH` | `/api/orders/:id/items/:itemId` | Atualiza a quantidade de um item do pedido e recalcula o total |
| | `DELETE`| `/api/orders/:id/items/:itemId` | Remove um item do pedido aberto e recalcula o total |
| | `PATCH` | `/api/orders/:id/transfer` | Transfere o pedido aberto para outra mesa disponível |
| | `GET` | `/api/orders` | Lista todas as comandas com mesa, atendente e itens |
| | `GET` | `/api/orders/:id` | Detalha uma comanda completa (itens, valores, mesa e garçom) |
| | `PATCH`| `/api/orders/:id/close`| Encerra a comanda e libera a mesa de volta para `AVAILABLE` |
| **Cardápio do Cliente** | `GET` | `/api/public/menu` | Retorna produtos, mesas e comandas ativas para a tela `/cardapio` |
| | `GET` | `/api/public/tables/:tableId/order` | Consulta a comanda aberta de uma mesa específica em tempo real |
| | `POST` | `/api/public/orders` | Recebe o pedido do cliente na mesa e integra direto na comanda ativa |

---

## 🧪 Como Testar a API Back-end

### Opção 1: Pela Interface Web Next.js (Recomendado)
1. Com o back-end (`porta 3000`) e o front-end (`porta 3001`) em execução, acesse `http://localhost:3001/login`.
2. Entre com `admin@restaurant.com` / `admin123` para usar a **Área de Atendimento** (`/atendimento`) e abra `http://localhost:3001/cardapio` para testar pedidos feitos pelos clientes.

### Opção 2: Pelo Swagger Docs
1. Acesse `http://localhost:3000/api/docs/`.
2. Insira em `Authorize` o token gerado pelo `POST http://localhost:3000/api/auth/login` para testar as rotas protegidas.

### Opção 3: Pelo arquivo `restaurant.http` (no VS Code)
O arquivo `restaurant.http` contém todas as requisições prontas em ordem lógica:
1. Instale a extensão **REST Client** no VS Code.
2. Abra o arquivo `restaurant.http` e clique em **Send Request** acima da requisição de login (`POST /api/auth/login`).
3. O token JWT retornado é capturado automaticamente na variável `@authToken` para as demais requisições.

### Opção 4: Testes Automatizados e Linter
```powershell
# Rodar testes unitários
npm.cmd test

# Rodar testes de ponta a ponta (E2E)
npm.cmd run test:e2e

# Verificar qualidade do código com o linter
npm.cmd run lint
```
