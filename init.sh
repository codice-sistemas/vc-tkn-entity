#!/usr/bin/env bash
set -e

echo "🚀 Inicializando o projeto vc-tkn-entity (modo integrado)..."

# 1️⃣ Garantir que .env existe
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Arquivo .env criado — edite para apontar para o MySQL e Besu existentes"
fi

echo "📁 Usando variáveis de ambiente:"
grep -E "DATABASE_URL|BESU|REDIS" .env || true
echo ""

# 2️⃣ Subir apenas o Redis
echo "🐳 Subindo Redis (sem MySQL/Besu)..."
if command -v docker compose >/dev/null 2>&1; then
  docker compose up -d redis
else
  docker-compose up -d redis
fi

# 3️⃣ Instalar dependências
if command -v pnpm >/dev/null 2>&1; then
  PKG_MGR="pnpm"
elif command -v yarn >/dev/null 2>&1; then
  PKG_MGR="yarn"
else
  PKG_MGR="npm"
fi

echo "📦 Instalando dependências com $PKG_MGR..."
$PKG_MGR install

# 4️⃣ Gerar Prisma Client (sem tentar criar banco)
echo "🧩 Gerando Prisma Client..."
npx prisma generate

# 5️⃣ Testar conexão com o banco (opcional)
echo "🔍 Testando conexão com MySQL..."
if ! npx prisma db pull >/dev/null 2>&1; then
  echo "⚠️ Aviso: Prisma não conseguiu se conectar ao banco configurado."
  echo "Verifique a variável DATABASE_URL no .env"
else
  echo "✅ Conexão com MySQL verificada!"
fi

# 6️⃣ Rodar o app principal
echo "🚀 Iniciando servidor (npm run dev)..."
npm run dev &

# 7️⃣ Rodar o indexer em paralelo
sleep 3
echo "⚙️ Iniciando indexer (npm run indexer:dev)..."
npm run indexer:dev
