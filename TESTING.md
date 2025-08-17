# Guia de Testes - Kanban App

Este projeto inclui uma suíte completa de testes unitários e de integração.

## 📋 Tipos de Testes

### Testes Unitários
- **Componentes React**: Testes para AudioUpload, MiniPlayer
- **API Routes**: Testes para endpoints de boards, columns, cards
- **Utilities**: Testes para funções utilitárias

### Testes de Integração
- **Conexão com Banco**: Testa conectividade com MongoDB Atlas
- **API Routes**: Testa fluxos completos de API com banco real
- **Integridade de Dados**: Testa consistência e validação de dados

## 🚀 Executando os Testes

### Testes Unitários
```bash
# Executar todos os testes unitários
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

### Testes de Integração
```bash
# Executar testes de integração
npm run test:integration

# Executar testes de integração em modo watch
npm run test:integration:watch

# Executar testes de integração com cobertura
npm run test:integration:coverage
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.test` com:
```env
NODE_ENV=test
MONGODB_URI=mongodb+srv://aredesrafael:CK9xu37yFnRkKL6R@cluster0.3q7dwcs.mongodb.net/kanban_test?retryWrites=true&w=majority&appName=Cluster0
MONGODB_TEST_DB=kanban_test
```

### Banco de Dados de Teste

Os testes de integração usam o MongoDB Atlas de produção, mas:
- Criam bancos de dados temporários com prefixo `kanban_test_`
- Limpam dados automaticamente após cada teste
- Removem bancos de teste ao final da suíte

## 📊 Estrutura dos Testes

```
src/
├── __tests__/
│   └── integration/              # Testes de integração
│       ├── database-connection.integration.test.ts
│       ├── api-routes.integration.test.ts
│       └── data-integrity.integration.test.ts
├── app/api/
│   └── **/__tests__/            # Testes unitários de API
├── components/
│   └── **/__tests__/            # Testes unitários de componentes
└── lib/
    └── test-utils/              # Utilitários de teste
        ├── database.ts
        └── setup-integration.ts
```

## 🧪 Cenários de Teste

### Testes de Conexão com Banco
- ✅ Conectividade com MongoDB Atlas
- ✅ Operações CRUD básicas
- ✅ Operações concorrentes
- ✅ Performance de queries

### Testes de API Routes
- ✅ CRUD completo para boards, columns, cards
- ✅ Validação de dados
- ✅ Tratamento de erros
- ✅ Fluxos de trabalho completos

### Testes de Integridade
- ✅ Validação de campos obrigatórios
- ✅ Unicidade de IDs
- ✅ Consistência de dados
- ✅ Performance com grandes datasets

### Testes de Componentes
- ✅ AudioUpload: Validação de URLs, interface
- ✅ MiniPlayer: Controles de áudio, estado global

## 🎯 Métricas de Cobertura

### Alvos de Cobertura
- **API Routes**: > 90%
- **Database Models**: > 95%
- **Components**: > 80%
- **Utilities**: > 95%

### Comandos para Visualizar Cobertura
```bash
# Cobertura geral
npm run test:coverage

# Cobertura de integração
npm run test:integration:coverage
```

## 🚨 Troubleshooting

### Erro de Conexão com MongoDB
1. Verifique se a URL do MongoDB está correta no `.env.test`
2. Confirme se o IP está liberado no MongoDB Atlas
3. Teste a conectividade manual

### Testes Lentos
1. Os testes de integração podem demorar mais (até 30s)
2. Use `--maxWorkers=1` se houver problemas de concorrência
3. Verifique a latência da conexão com o banco

### Limpeza de Dados de Teste
```bash
# Se necessário, limpe manualmente os bancos de teste
node -e "
const mongoose = require('mongoose');
mongoose.connect('MONGODB_URI').then(async () => {
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  for (const db of dbs.databases) {
    if (db.name.startsWith('kanban_test_')) {
      await mongoose.connection.db.dropDatabase();
    }
  }
  process.exit(0);
});
"
```

## 📈 CI/CD Integration

Para integração contínua, adicione:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:integration
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

## 🛡️ Boas Práticas

1. **Sempre limpe dados**: Use `beforeEach` e `afterEach` apropriadamente
2. **Isole testes**: Cada teste deve ser independente
3. **Use dados determinísticos**: Evite dependências de timing
4. **Teste casos extremos**: IDs inválidos, dados malformados
5. **Monitore performance**: Testes não devem ser muito lentos