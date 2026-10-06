# Backend de Gerenciamento de Restaurante — UPF (Web & Mobile)

Este projeto é a API backend desenvolvida para a disciplina de **Programação Web e Mobile** da Universidade de Passo Fundo (UPF). Ele fornece os serviços para autenticação de funcionários, gerenciamento de mesas, cardápio de produtos, controle de reservas e lançamento de comandas/pedidos.

A aplicação foi desenvolvida em **TypeScript** utilizando o framework **NestJS**, com o ORM **Prisma**, banco de dados **SQLite** e autenticação via **JWT**.

---

## 📋 Pré-requisitos

- **Node.js**: Versão 18 ou superior instalada.
- **npm**: Gerenciador de pacotes padrão do Node.js.

---

## 🚀 Como Rodar o Projeto

Execute os passos a seguir no terminal, na pasta raiz do projeto:

### 1. Instalar as dependências
```bash
npm install
```

### 2. Configurar as variáveis de ambiente
Copie o arquivo `.env.example` para `.env` (ou crie um arquivo `.env` na raiz):
```bash
# No Windows PowerShell:
Copy-Item .env.example .env

# Conteúdo padrão do arquivo .env:
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret"
```

### 3. Rodar as migrações do banco de dados (SQLite)
```bash
npx prisma migrate dev
```

### 4. Gerar os tipos do cliente Prisma
```bash
npx prisma generate
```

### 5. Popular o banco com dados iniciais (Seed)
Cria os usuários padrão de Administrador e Garçom para testes:
```bash
npm run seed
# ou: npx prisma db seed
```

### 6. Iniciar a aplicação

- **Modo Desenvolvimento (com recarregamento automático)**:
  ```bash
  npm run start:dev
  ```

- **Modo Produção (Compilação e execução)**:
  ```bash
  npm run build
  npm run start:prod
  ```

A API estará em execução no endereço: `http://localhost:3000/api`.

---

## 💡 Como o Projeto Funciona

O sistema gerencia as rotinas de atendimento de um restaurante:

### 1. Autenticação e Segurança (JWT)
- A aplicação utiliza um **Guard Global** (`JwtAuthGuard`) que protege todas as rotas com token Bearer JWT.
- Apenas a rota de login (`POST /api/auth/login`) é pública.
- Usuários padrão criados pelo Seed:
  - **Administrador**: `admin@restaurant.com` | senha: `admin123`
  - **Garçom**: `waiter@restaurant.com` | senha: `admin123`

### 2. Módulos e Endpoints

| Módulo | Método | Rota | Descrição |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Realiza login e gera o token de acesso |
| | `POST` | `/api/auth/register` | Cadastra novos funcionários (ADMIN, MANAGER, WAITER, RECEPTIONIST) |
| **Mesas** | `POST` | `/api/tables` | Cadastra uma nova mesa |
| | `GET` | `/api/tables` | Lista todas as mesas e seus status (`AVAILABLE`, `OCCUPIED`, `RESERVED`) |
| | `GET` | `/api/tables/:id` | Busca detalhes de uma mesa |
| **Produtos** | `POST` | `/api/products` | Cadastra um produto no cardápio |
| | `GET` | `/api/products` | Lista todos os produtos ordenados por categoria |
| | `GET` | `/api/products/:id` | Busca um produto por ID |
| | `DELETE`| `/api/products/:id` | Remove um produto do cardápio |
| **Reservas** | `POST` | `/api/reservations` | Cria uma reserva para cliente com data, convidados e mesa opcional |
| | `GET` | `/api/reservations` | Lista todas as reservas com os dados da mesa |
| | `GET` | `/api/reservations/:id` | Busca uma reserva por ID |
| **Comandas** | `POST` | `/api/orders` | Abre comanda para uma mesa (Mesa muda para `OCCUPIED`) |
| | `POST` | `/api/orders/:id/items`| Adiciona itens ao pedido (calcula e soma o total automaticamente) |
| | `GET` | `/api/orders` | Lista todas as comandas |
| | `GET` | `/api/orders/:id` | Detalha uma comanda completa (itens, valores, mesa e garçom) |
| | `PATCH`| `/api/orders/:id/close`| Encerra a comanda e libera a mesa de volta para `AVAILABLE` |

---

## 🧪 Como Testar o Projeto

### Opção 1: Pelo arquivo `restaurant.http` (Recomendado no VS Code)
O arquivo [restaurant.http](file:///c:/ProgramacaoWebMobile/web_UPF_2026-02_backend-main/web_UPF_2026-02_backend-main/restaurant.http) contém todas as requisições prontas em ordem lógica:
1. Instale a extensão **REST Client** no VS Code (ou use a extensão **Thunder Client**).
2. Abra o arquivo `restaurant.http`.
3. Clique em **Send Request** acima da requisição de login:
   ```http
   POST http://localhost:3000/api/auth/login
   ```
4. O token JWT retornado é capturado automaticamente na variável `@authToken`.
5. Em seguida, clique em **Send Request** nas demais requisições na ordem (Mesas, Produtos, Reservas, Pedidos, Adicionar Itens e Fechar Comanda).

### Opção 2: Pelo Postman / Insomnia / cURL
Basta enviar as requisições para `http://localhost:3000/api/<rota>`. Lembre-se de adicionar o cabeçalho:
```
Authorization: Bearer <seu_token_jwt>
```
exceto para a rota pública `/api/auth/login`.

### Opção 3: Testes Automatizados e Linter
Você também pode rodar a suíte de testes automatizados e o linter pelo terminal:
```bash
# Rodar testes unitários
npm test

# Rodar testes de ponta a ponta (E2E)
npm run test:e2e

# Verificar qualidade do código com o linter
npm run lint
```

---
