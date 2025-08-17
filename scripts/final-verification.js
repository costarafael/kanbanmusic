#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('http');

console.log('🎯 Verificação Final da Aplicação Kanban');
console.log('=======================================\n');

const tests = [
  {
    name: '🌐 Servidor Web (localhost:3000)',
    test: () => {
      return new Promise((resolve, reject) => {
        const req = https.get('http://localhost:3000', (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
      });
    }
  },
  {
    name: '🔗 API Endpoint - Create Board',
    test: async () => {
      try {
        const result = execSync(`curl -s -X POST http://localhost:3000/api/boards -H "Content-Type: application/json" -d '{"title":"Test API"}'`, 
          { encoding: 'utf8', timeout: 10000 });
        const data = JSON.parse(result);
        return data.id && data.title === 'Test API';
      } catch {
        return false;
      }
    }
  },
  {
    name: '📊 MongoDB Connection',
    test: async () => {
      try {
        const result = execSync('npm run test:integration -- --testPathPattern=database-connection --silent', 
          { encoding: 'utf8', timeout: 30000 });
        return result.includes('Test Suites: 1 passed') && result.includes('7 passed');
      } catch (error) {
        console.log(`   Erro detalhado: ${error.message}`);
        return false;
      }
    }
  }
];

async function runVerification() {
  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      console.log(`⏳ Testando: ${test.name}...`);
      const result = await test.test();
      
      if (result) {
        console.log(`✅ ${test.name} - OK`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FALHOU`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERRO: ${error.message}`);
    }
    console.log();
  }

  console.log('📊 RESULTADO FINAL:');
  console.log(`✅ Sucessos: ${passed}/${total}`);
  console.log(`🎯 Taxa de sucesso: ${Math.round((passed / total) * 100)}%`);

  if (passed === total) {
    console.log('\n🎉 PARABÉNS! APLICAÇÃO FUNCIONANDO PERFEITAMENTE!');
    console.log('🚀 A aplicação Kanban está rodando em: http://localhost:3000');
    console.log('📋 APIs disponíveis:');
    console.log('   • POST /api/boards - Criar board');
    console.log('   • GET /api/boards/[id] - Buscar board');
    console.log('   • POST /api/boards/[id]/columns - Criar coluna');
    console.log('   • POST /api/columns/[id]/cards - Criar card');
    console.log('\n🧪 Para executar testes:');
    console.log('   • npm test - Testes unitários');
    console.log('   • npm run test:integration - Testes de integração');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
  }
}

runVerification().catch(console.error);