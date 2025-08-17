#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Verificando configuração do projeto Kanban...\n');

const checks = [
  {
    name: 'Build do Next.js',
    command: 'npm run build',
    timeout: 30000
  },
  {
    name: 'Testes de Conexão com Banco',
    command: 'npm run test:integration -- --testPathPattern=database-connection --silent',
    timeout: 45000
  },
  {
    name: 'Testes Unitários',
    command: 'npm test -- --testPathPattern=boards.test.ts --silent',
    timeout: 20000
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    console.log(`⏳ Executando: ${check.name}...`);
    
    const startTime = Date.now();
    execSync(check.command, { 
      stdio: 'pipe',
      timeout: check.timeout,
      cwd: process.cwd()
    });
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${check.name} - OK (${duration}ms)\n`);
    passed++;
  } catch (error) {
    console.log(`❌ ${check.name} - FALHOU`);
    console.log(`   Erro: ${error.message}\n`);
    failed++;
  }
}

console.log('📊 RESUMO:');
console.log(`✅ Sucessos: ${passed}`);
console.log(`❌ Falhas: ${failed}`);
console.log(`🎯 Taxa de sucesso: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

if (failed === 0) {
  console.log('🎉 TODOS OS TESTES PASSARAM!');
  console.log('🚀 O projeto está pronto para desenvolvimento.');
  console.log('\n📝 Para executar os testes:');
  console.log('   npm test                    # Testes unitários');
  console.log('   npm run test:integration    # Testes de integração');
  console.log('   npm run test:coverage       # Cobertura de testes');
} else {
  console.log('⚠️  Alguns testes falharam. Verifique os erros acima.');
  process.exit(1);
}