#!/bin/bash

# Script para resolver problemas de build corrompido
# Uso: ./scripts/fix-build.sh

echo "🔧 Corrigindo problemas de build corrompido..."

echo "1. Parando processos Next.js..."
pkill -f "next dev" 2>/dev/null || echo "Nenhum processo Next.js encontrado"

echo "2. Removendo cache e dependências..."
rm -rf .next
rm -rf node_modules  
rm -f package-lock.json

echo "3. Limpando cache do npm..."
npm cache clean --force

echo "4. Reinstalando dependências..."
npm install

echo "5. Verificando integridade..."
npm audit --audit-level=moderate

echo "✅ Build corrigido! Execute 'npm run dev' para iniciar."
echo ""
echo "💡 Scripts disponíveis:"
echo "  npm run rebuild     - Executa este script"
echo "  npm run fresh-start - Executa este script + inicia o dev server"
echo "  npm run dev         - Inicia apenas o dev server"