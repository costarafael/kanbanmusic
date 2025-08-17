# Claude Code - Estado da Aplicação Kanban

## 📋 Funcionalidades Implementadas

### ✅ Core Features
- **Sistema de Boards** - Criação e gerenciamento de quadros kanban
- **Colunas** - Criação, edição, arquivamento e reordenação de colunas
- **Cards** - Criação, edição, arquivamento e drag & drop entre colunas
- **Auto-edição de Cards** - Cards recém-criados abrem automaticamente para edição
- **Descrições Rich Text** - Editor simples baseado em textarea para descrições

### ✅ Uploads e Mídia
- **Audio Upload** - Upload de arquivos de áudio (MP3, WAV, OGG, M4A, AAC)
  - Validação de URL para links diretos de áudio
  - Extração automática de cover art de arquivos MP3
  - Limite de 100MB para arquivos
  - Player de áudio integrado
- **Cover Images** - Upload de imagens de capa para cards e colunas
  - Suporte para JPEG, PNG, WebP, GIF
  - Limite de 5MB para imagens
  - Preview e remoção de covers

### ✅ UI/UX Melhorias
- **Dialog Modals** - Substituição de Sheet drawers por Dialog modals
- **Validação de Formulários** - Validação robusta para uploads e URLs
- **Estados de Loading** - Indicadores visuais durante operações
- **Responsive Design** - Interface adaptável para diferentes tamanhos de tela

## 🗂️ Arquitetura de Componentes

### Audio Components
- `AudioUploadTabs.tsx` - Upload de áudio com tabs (File/URL) e validação
- `MiniPlayer.tsx` - Player de áudio compacto

### Cover Components  
- `CoverUploadTabs.tsx` - Upload de cover com tabs (File/URL)
- `CoverUploadCompact.tsx` - Upload compacto para cards
- `InlineCoverEditor.tsx` - Editor inline para colunas (sem modal)

### Board Components
- `Board.tsx` - Container principal do quadro
- `Column.tsx` - Componente de coluna com drag & drop
- `Card.tsx` - Componente de card com drag & drop
- `CardDetailSheet.tsx` - Modal de edição de cards

### Utilities
- `validation-helpers.ts` - Funções de validação consolidadas

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.4.6 com React 19
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: TanStack Query v5
- **Database**: MongoDB com Mongoose
- **Drag & Drop**: @dnd-kit
- **Audio Metadata**: music-metadata-browser
- **File Uploads**: API routes personalizadas

## ⚠️ Problema Conhecido: Build Corrompido

### Erro Recorrente
```
Error: Cannot find module './vendor-chunks/@tanstack.js'
```

### Solução: Rebuild Completo
Sempre que houver mudanças significativas, execute:

```bash
# 1. Parar o servidor de desenvolvimento
# Ctrl+C ou kill do processo

# 2. Limpeza completa
rm -rf .next node_modules package-lock.json
npm cache clean --force

# 3. Reinstalar dependências
npm install

# 4. Iniciar novamente
npm run dev
```

### Scripts de Rebuild Automático
Scripts já configurados no package.json:

```bash
npm run rebuild      # Limpeza completa e reinstalação
npm run fresh-start  # Rebuild + iniciar dev server
./scripts/fix-build.sh # Script bash alternativo
```

Scripts disponíveis:
- `npm run rebuild` - Executa limpeza completa
- `npm run fresh-start` - Rebuild + start development server  
- `./scripts/fix-build.sh` - Script bash com mais verbosidade

### Possíveis Causas do Problema
- Cache corrompido do Next.js (.next directory)
- Conflitos de versão de dependências
- Problemas com vendor chunks do TanStack Query
- Hot reload conflicts durante development

### Possível Solução Permanente
Criado `next.config.js` com configurações para:
- Controle manual de vendor chunks
- Otimizações de package imports
- Configurações experimentais para estabilidade
- Setup de domínios para imagens

⚠️ **IMPORTANTE**: Mesmo com as configurações do next.config.js, o problema persiste. O rebuild manual continua sendo necessário sempre que o erro aparecer.

**Recomendação**: Use sempre `npm run fresh-start` após fazer mudanças significativas na aplicação para evitar perder tempo com debugging.

## 🔄 Comandos Essenciais

### Desenvolvimento
```bash
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build de produção
npm run rebuild      # Limpeza e reinstalação completa
```

### Limpeza Manual
```bash
# Limpeza de cache Next.js
rm -rf .next

# Limpeza completa
rm -rf .next node_modules package-lock.json
npm cache clean --force
```

## 📁 Estrutura de Arquivos Importante

```
src/
├── components/
│   ├── audio/           # Componentes de áudio
│   ├── board/           # Componentes do quadro kanban
│   ├── cover/           # Componentes de upload de cover
│   ├── drawer/          # Modais e drawers
│   ├── editor/          # Editor de texto
│   └── ui/              # Componentes UI base (shadcn)
├── app/
│   ├── api/             # API routes
│   └── b/[id]/          # Páginas de board
└── lib/
    └── utils/           # Utilitários e helpers
```

## 🚀 Funcionalidades em Desenvolvimento

### Concluído Recentemente
- ✅ Validação de URL de áudio para evitar erros de player
- ✅ Extração de cover art de arquivos MP3
- ✅ Modal de confirmação para substituição de covers
- ✅ Editor inline para covers de coluna (sem modals problemáticos)
- ✅ Correção definitiva do problema de interface travada
- ✅ Remoção de componentes Dialog problemáticos para covers de coluna
- ✅ Auto-abertura de cards recém-criados para edição imediata

### Próximos Passos Sugeridos
- [ ] Implementar autenticação de usuários
- [ ] Sistema de colaboração em tempo real
- [ ] Histórico de atividades
- [ ] Templates de boards
- [ ] Exportação de dados

## 🔧 Configurações Importantes

### Environment Variables (.env.local)
```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Dependencies Principais
```json
{
  "@tanstack/react-query": "^5.x",
  "@dnd-kit/core": "^6.x",
  "next": "15.4.6",
  "react": "^19.x",
  "music-metadata-browser": "^2.5.11"
}
```

## 📝 Notas de Desenvolvimento

1. **Sempre usar rebuild** após mudanças significativas na estrutura de componentes
2. **Validar uploads** - Todos os uploads têm validação de tipo e tamanho
3. **Gerenciamento de estado** - TanStack Query para cache e sincronização
4. **TypeScript** - Tipagem rigorosa em todos os componentes
5. **Accessibility** - Componentes seguem padrões de acessibilidade

## 🐛 Debug Tips

### Verificar logs do servidor
```bash
# Logs do Next.js development server
tail -f .next/server.log

# Console errors no browser
# Abrir DevTools > Console
```

### Problemas comuns
1. **Module not found** → Fazer rebuild completo
2. **React hydration errors** → Verificar SSR/CSR compatibility  
3. **Audio não carrega** → Verificar se URL é link direto para arquivo
4. **Upload falha** → Verificar tamanhos de arquivo e tipos permitidos

---

**Última atualização**: 2025-08-17  
**Versão**: 1.0.0  
**Status**: Em desenvolvimento ativo