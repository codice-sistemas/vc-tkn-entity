# vc-tkn-entity
App da Entidade Centralizadora


# Projeto - Como Rodar

Este README descreve passo a passo como configurar e rodar o projeto, incluindo banco de dados, dependências e serviços auxiliares.

# Base de Dados

Usa do repositório vc-tkn


# Passos para Rodar o Projeto

Copie o arquivo .env.example para .env e ajuste as variáveis:

cp .env.example .env

Atualizar as varíaveis em .env

Variável ADDRESS_DISCOVERY deve ser atualizada com o endereço disponível no repositório vc-tkn em: src/configs/besu.json


**Instalar dependências do projeto:**

# vc-tkn

Utiliza cópia "local" dos contratos AccountFactory, AddressDiscovery e ComplianceTokenRegistry
Subir para o repositório de implantação a pasta: artifacts

Utiliza cópia "local" da abi dos contratos
Subir para o repositório de implantação a pasta: abi

*manter a estrutura para não quebrar o caminho das variáveis em .env*

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

# JWT / Criptografia
npm install jose

# Dependências gerais
pnpm install || npm install


# Rodar o projeto:

npm run dev

# Observações

Arquivos já versionados no Git não serão ignorados automaticamente pelo .gitignore.

Ajuste variáveis de ambiente no .env conforme seu ambiente local.

Certifique-se de que Besu, RPC e MySQL estão rodando antes de iniciar o projeto.
