# vc-tkn-entity
App da Entidade Centralizadora

# Projeto - Como Rodar

Este README descreve passo a passo como configurar e rodar o projeto, incluindo banco de dados, dependências e serviços auxiliares.

## Base de Dados

- Criação da base de dados: `app/libs/mysql/db-mysql.ts`
- Criação das tabelas e inserção de dados: `prisma/schema.prisma` e `prisma/seed.ts`

> No `package.json`, adicione a seguinte configuração de seed (comentada para não quebrar o arquivo):
```
"prisma": {
    "seed": "node --loader ts-node/esm prisma/seed.ts"
 }
````

Passos para Rodar o Projeto

Copie o arquivo .env.example para .env e ajuste as variáveis:

cp .env.example .env


(Opcional) Rodar serviços via Docker (MySQL, Redis, Besu):

docker compose up -d


Instalar dependências do projeto:

# TailwindCSS e PostCSS
npm install -D tailwindcss@3 postcss@8 autoprefixer@10
npx tailwindcss init -p

# Hardhat
npm install hardhat

# MySQL driver
npm install mysql2

# React Query
npm install @tanstack/react-query
npm install lucide-react
yarn add @tanstack/react-query

# Tipagens do React
npm install -D @types/react

# Outras bibliotecas
npm install react-hot-toast
npm install @heroicons/react
npm install @headlessui/react

# Prisma
npm install prisma @prisma/client

# JWT / Criptografia
npm install jose

# Dependências gerais
pnpm install || npm install


Gerar Prisma Client e aplicar migrações:

npx prisma generate
npx prisma migrate dev --name init


Rodar o projeto:

npm run dev


Rodar o indexer em outro terminal:

npm run indexer:dev

Observações

Arquivos já versionados no Git não serão ignorados automaticamente pelo .gitignore.

Ajuste variáveis de ambiente no .env conforme seu ambiente local.

Certifique-se de que MySQL, Redis e Besu estão rodando antes de iniciar o projeto.
