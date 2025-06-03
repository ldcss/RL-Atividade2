# RocketShop

Api de e-commerce criado para a segunda atividade do RocketLab.

## Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (recomendado v18 ou superior)
- [pnpm](https://pnpm.io/) (gerenciador de pacotes)

### Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/ldcss/RL-Atividade2.git
   cd RL-Atividade2
   ```

2. **Instale as dependências:**

   ```bash
   pnpm install
   ```

3. **Configure o .env**

Crie um arquivo .env de acordo com o .env.example fornecido

3. **Gere e popule o banco de dados:**

```bash
   pnpm run create:db
```

4. **Inicie o servidor de desenvolvimento:**

```bash
   pnpm run start:dev
```

5. **Acesse a [Documentação do Swagger](http://localhost:3000/api)**

### Rodando a aplicação

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

Ou simplesmente acesse a documentação da API em [http://localhost:3000/api](https://rocket-shop-kappa.vercel.app/)

## Estrutura do Projeto

A estrutura do projeto segue as convenções do NestJS, promovendo modularidade e organização:

/prisma
  |- schema.prisma  # Define o schema do banco de dados e os modelos
  |- migrations/    # Contém os arquivos de migração do banco de dados
  |- seed.ts        # (Opcional) Script para popular o banco com dados iniciais
/src
  |- /auth          # Módulo de autenticação (login, registro, gerenciamento de token)
  |- /user         # Módulo para gerenciamento de usuários
  |- /product      # Módulo para gerenciamento de produtos
  |- /cart         # Módulo para gerenciamento de carrinhos de compra
  |- /order        # Módulo para gerenciamento de pedidos
  |- /favorite     # Módulo para gerenciamento de produtos favoritos
  |- /review       # Módulo para gerenciamento de avaliações de produtos
  |- app.module.ts  # Módulo raiz da aplicação
  |- main.ts        # Arquivo de entrada da aplicação
.env                # Arquivo para variáveis de ambiente (DATABASE_URL, JWT_SECRET, etc.)
.eslintrc.js
.prettierrc
nest-cli.json
package.json
tsconfig.json
README.md

## Funcionalidades

A API oferece as seguintes funcionalidaddes principais:

### Autenticação e Usuários
- Cadastro de novos usuários.
- Login de usuários com email e senha.
- Gerenciamento de perfil do usuário (visualização, atualização).
- Definição de papéis de usuário (ex: `CUSTOMER`, `ADMIN`).

### Produtos
- Criação, listagem, visualização, atualização e remoção de produtos (CRUD - para administradores).
- Listagem e busca de produtos para clientes.
- Visualização de detalhes de um produto específico.

### Favoritos
- Adicionar um produto à lista de favoritos de um usuário.
- Remover um produto da lista de favoritos.
- Listar produtos favoritos de um usuário.

### Carrinho de Compras
- Adicionar um produto ao carrinho de um usuário.
- Visualizar o conteúdo do carrinho.
- Atualizar a quantidade de um item no carrinho.
- Remover um item do carrinho.
- Limpar o carrinho.

### Pedidos
- Criação de um pedido a partir dos itens do carrinho.
- Listagem de pedidos de um usuário.
- Visualização de detalhes de um pedido específico.
- Atualização do status de um pedido (ex: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELED` - geralmente por administradores).

### Avaliações (Reviews)
- Adicionar uma avaliação (rating e comentário) para um produto.
- Visualizar avaliações de um produto.
- Usuário só pode avaliar um produto uma vez.

## Tecnologias e Principais Bibliotecas Utilizadas

**Backend & API:**

- **[NestJS](https://nestjs.com/):** Framework Node.js progressivo para construir aplicações backend eficientes, escaláveis e robustas.
- **[Prisma](https://www.prisma.io/):** ORM (Object-Relational Mapper) moderno para Node.js e TypeScript, utilizado para interagir com o banco de dados.
- **[TypeScript](https://www.typescriptlang.org/):** Superset do JavaScript que adiciona tipagem estática e funcionalidades de orientação a objetos.
- **Banco de Dados:** [SQLite](https://www.sqlite.org/index.html) (para desenvolvimento/padrão inicial), facilmente substituível por PostgreSQL, MySQL, etc., via configuração do Prisma.
- **Autenticação:**
  - `passport`: Middleware de autenticação para Node.js.
  - `passport-local`: Estratégia Passport para autenticação com username/password.
  - `passport-jwt`: Estratégia Passport para autenticação baseada em JWT.
  - `@nestjs/jwt`: Módulo NestJS para trabalhar com JSON Web Tokens.
  - `bcrypt`: Biblioteca para hashing de senhas.
- **Validação:**
  - `class-validator`: Para validação de DTOs (Data Transfer Objects) baseada em decorators.
  - `class-transformer`: Para transformar plain objects em instâncias de classes e vice-versa.
- **Linting e Formatação:**
  - ESLint
  - Prettier

## Explicação das Regras de Negócio

Com base no schema Prisma, as seguintes regras de negócio são aplicadas:

- **Usuários:**
    - O email do usuário deve ser único.
    - Por padrão, um novo usuário tem o papel (`role`) "CUSTOMER".
- **Favoritos:**
    - Um usuário pode favoritar um mesmo produto apenas uma vez (`@@unique([userId, productId])`).
    - Se um usuário ou produto for deletado, as entradas correspondentes em `Favorite` são removidas em cascata (`onDelete: Cascade`).
- **Carrinho:**
    - Cada usuário possui um único carrinho (`userId @unique` em `Cart`).
    - Um produto específico pode aparecer apenas uma vez como um item no carrinho (`CartItem`), sendo sua quantidade controlada pelo campo `quantity` (`@@unique([cartId, productId])` em `CartItem`).
    - Se um usuário ou produto for deletado, o carrinho ou os itens do carrinho associados são removidos em cascata.
- **Pedidos:**
    - O status padrão de um novo pedido é "PENDING".
    - `OrderItem.priceAtPurchase` armazena o preço do produto no exato momento da compra, garantindo a integridade do valor mesmo que o preço do produto mude posteriormente.
    - A exclusão de um produto da loja (`Product`) não remove os `OrderItem` relacionados a ele, permitindo manter o histórico de pedidos. Para isso, a relação em `OrderItem` para `Product` não deve usar `onDelete: Cascade` se essa for a intenção.
- **Avaliações:**
    - Um usuário pode avaliar um mesmo produto apenas uma vez (`@@unique([userId, productId])`).
    - As avaliações são indexadas por `productId` para buscas mais eficientes.
    - Se um usuário ou produto for deletado, as avaliações correspondentes são removidas em cascata.


## Estratégia de Autenticação Utilizada

A autenticação é implementada utilizando uma combinação de:

1.  **Estratégia Local (Username/Password):**
    - Os usuários se autenticam fornecendo email e senha.
    - As senhas são armazenadas de forma segura no banco de dados utilizando hashing (ex: bcrypt).
    - O módulo `@nestjs/passport` com `passport-local` é utilizado para validar as credenciais.
2.  **JSON Web Tokens (JWT):**
    - Após o login bem-sucedido, um JWT é gerado e retornado ao cliente.
    - O cliente deve incluir este token no cabeçalho `Authorization` (como um Bearer Token) em requisições subsequentes para acessar rotas protegidas.
    - O módulo `@nestjs/jwt` e `passport-jwt` são utilizados para gerar e validar os tokens.
3.  **Guards:**
    - Rotas protegidas utilizam `AuthGuards` do NestJS para garantir que apenas usuários autenticados possam acessá-las.

## Uso de IA

No projeto foram utilizados o Github Copilot e Google Gemini, para economizar esforço na estilização de componentes mais complexos utilizando Tailwind, além da resolução de problemas e erros no código.

---

O projeto foi criado utilizado [Nest](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) e [SQLite](https://vitejs.dev/).
