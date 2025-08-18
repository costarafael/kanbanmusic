# Claude Code - Estado da Aplicação Kanban

## 📋 Funcionalidades Implementadas

### ✅ Core Features
- **Sistema de Boards** - Criação e gerenciamento de quadros kanban
- **Colunas** - Criação, edição, arquivamento e reordenação de colunas
- **Cards** - Criação, edição, arquivamento e drag & drop entre colunas
- **Auto-edição de Cards** - Cards recém-criados abrem automaticamente para edição
- **Sistema de Tags** - Tags com autocomplete baseado no histórico do board
- **Descrições Rich Text** - Editor baseado em textarea para descrições

### ✅ Uploads e Mídia - REFORMULADO
- **Audio Upload Híbrido** - Sistema otimizado para diferentes tamanhos de arquivo
  - **Arquivos ≤ 4.5MB**: Server upload com análise AI completa
  - **Arquivos > 4.5MB**: Client upload direto para Vercel Blob com AI opcional
  - Upload via Vercel Blob com `addRandomSuffix` automático
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
- **Tags Input** - Componente com navegação por teclado e autocomplete
- **Card Preview** - Toggles para mostrar/ocultar descrição e tags

## 🗂️ Arquitetura de Componentes

### Audio Components
- `AudioUploadTabs.tsx` - Upload híbrido de áudio com sistema dual (server/client)
- `MiniPlayer.tsx` - Player de áudio compacto

### Cover Components  
- `CoverUploadTabs.tsx` - Upload de cover com tabs (File/URL)
- `CoverUploadCompact.tsx` - Upload compacto para cards
- `InlineCoverEditor.tsx` - Editor inline para colunas (sem modal)

### Board Components
- `Board.tsx` - Container principal do quadro
- `Column.tsx` - Componente de coluna com drag & drop
- `Card.tsx` - Componente de card com drag & drop e preview de tags
- `CardDetailSheet.tsx` - Modal de edição de cards com campo AI Notes

### UI Components
- `TagsInput.tsx` - Input de tags com autocomplete e navegação por teclado
- `Badge.tsx` - Componente para exibição de tags

### API Routes
- `/api/upload/audio` - Server upload para arquivos pequenos com AI
- `/api/upload/audio-presigned` - Presigned URLs para client upload de arquivos grandes
- `/api/ai/lp-music-caps` - Análise AI de música com LP-MusicCaps

### Utilities
- `validation-helpers.ts` - Funções de validação consolidadas

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.4.6 com React 19
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: TanStack Query v5
- **Database**: MongoDB com Mongoose
- **File Storage**: Vercel Blob
- **Drag & Drop**: @dnd-kit
- **Audio Metadata**: music-metadata-browser
- **AI Integration**: LP-MusicCaps (seungheondoh/lp-music-caps)

## 🎵 Sistema de Upload de Áudio - DETALHADO

### Arquitetura Híbrida
O sistema foi redesenhado para otimizar performance e contornar limitações da Vercel:

#### Server Upload (≤ 4.5MB)
```
File → FormData → /api/upload/audio → AI Analysis → Vercel Blob → Complete
```
- ✅ Análise AI completa garantida
- ✅ Processamento no servidor 
- ✅ Logs detalhados

#### Client Upload (> 4.5MB) 
```
File → Vercel Blob Client → /api/upload/audio-presigned → Upload Success
                                    ↓
                             AI Analysis (opcional) → AI Notes ou Skip
```
- ✅ Contorna limite de 4.5MB das Vercel Functions
- ✅ Upload sempre bem-sucedido
- ✅ AI opcional para evitar timeouts

### Configurações de Segurança
- **Deployment Protection**: Desativado no projeto Vercel
- **BLOB_READ_WRITE_TOKEN**: Configurado em produção e desenvolvimento
- **addRandomSuffix**: Automático para evitar conflitos de nome

### Tipos de Arquivo Suportados
- MP3, WAV, OGG, M4A, AAC, MPEG
- Limite: 100MB
- Validação tanto no cliente quanto no servidor

## 🔄 Comandos Essenciais

### Desenvolvimento
```bash
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build de produção
npm run rebuild      # Limpeza e reinstalação completa
npm run backup       # Criar backup do projeto
```

### Limpeza Manual
```bash
# Limpeza de cache Next.js
rm -rf .next

# Limpeza completa
rm -rf .next node_modules package-lock.json
npm cache clean --force
```

### Vercel CLI - Comandos Úteis
```bash
vercel logs URL_DO_DEPLOYMENT     # Ver logs em tempo real
vercel env ls                     # Listar variáveis de ambiente
vercel link --project PROJECT_ID  # Conectar ao projeto
```

### Script de Backup
```bash
# Criar backup do projeto
npm run backup
# ou diretamente
./backup.sh
```

**O que inclui no backup:**
- ✅ Código fonte (src/)
- ✅ Arquivos de configuração (.env, package.json, etc.)
- ✅ Documentação
- ✅ Repositório Git (.git/)

**O que exclui do backup:**
- ❌ node_modules/
- ❌ .next/, dist/, build/, out/
- ❌ Diretórios de cache (.cache, .vercel, .turbo)
- ❌ Arquivos de log
- ❌ Arquivos temporários
- ❌ Arquivos específicos do OS/Editor (.DS_Store, .vscode, etc.)

**Localização:** O backup é salvo um nível acima do projeto com timestamp:
`../kanban-app_backup_YYYYMMDD_HHMMSS.zip`

## 📁 Estrutura de Arquivos Importante

```
src/
├── components/
│   ├── audio/           # Sistema de upload híbrido de áudio
│   ├── board/           # Componentes do quadro kanban
│   ├── cover/           # Componentes de upload de cover
│   ├── drawer/          # Modais e drawers
│   ├── editor/          # Editor de texto
│   └── ui/              # Componentes UI base (shadcn) + TagsInput
├── app/
│   ├── api/
│   │   ├── upload/      # Endpoints de upload (audio, presigned)
│   │   ├── ai/          # Integração LP-MusicCaps
│   │   └── boards/      # API do kanban + tags
│   └── b/[id]/          # Páginas de board
└── lib/
    ├── db/              # Models MongoDB + schema de tags
    └── utils/           # Utilitários e helpers
```

## 🚀 Funcionalidades Recentemente Implementadas

### ✅ Upload de Áudio Reformulado (2025-08-18)
- Sistema híbrido server/client upload baseado no tamanho do arquivo
- Resolução de problemas com Vercel Functions (limite 4.5MB)
- Integração com Vercel Blob storage
- Presigned URLs para arquivos grandes
- Análise AI opcional para arquivos grandes

### ✅ Sistema de Tags Completo
- Tags com autocomplete baseado no histórico do board
- Navegação por teclado (setas, Enter, Backspace)
- Exibição em cards com limite visual (máx 3 + overflow)
- Toggle para mostrar/ocultar tags no preview
- API para persistir e recuperar tags do board

### ✅ Music AI Notes Field
- Campo editável para notas de análise AI
- Integração com LP-MusicCaps
- Exibição condicional (só aparece se houver análise)
- Formatação automática com emoji e estrutura

## 🎯 Próximos Passos - PRIORIDADES

### 🔥 Alta Prioridade
- **[ ] Integração LP-MusicCaps Melhorada**: Otimizar análise AI para arquivos grandes
  - Implementar timeout configurável
  - Análise em background para arquivos > 4.5MB
  - Retry mechanism para falhas temporárias
  - Interface para re-processar análise AI manualmente

### 🟡 Média Prioridade
- **[ ] Interface de Re-análise**: Botão para refazer análise AI de arquivos já uploaded
- **[ ] Melhorias de Performance**: Otimizar carregamento de boards grandes
- **[ ] Tags Avançadas**: Filtros por tags, tags populares, sugestões inteligentes

### 🔵 Baixa Prioridade
- **[ ] Autenticação de usuários**: Sistema de login/registro
- **[ ] Colaboração em tempo real**: WebSockets para updates simultâneos
- **[ ] Histórico de atividades**: Timeline de mudanças
- **[ ] Templates de boards**: Boards pré-configurados
- **[ ] Exportação de dados**: CSV, JSON export

## 🔧 Configurações Importantes

### Environment Variables (.env.local)
```
MONGODB_URI=your_mongodb_connection_string
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Environment Variables (Vercel Production)
```
MONGODB_URI=production_mongodb_uri
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token
```

### Dependencies Principais
```json
{
  "@tanstack/react-query": "^5.x",
  "@dnd-kit/core": "^6.x", 
  "@vercel/blob": "^1.1.1",
  "next": "15.4.6",
  "react": "^19.x",
  "music-metadata-browser": "^2.5.11"
}
```

### Vercel Configuration (vercel.json)
```json
{
  "functions": {
    "src/app/api/upload/audio/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/upload/cover/route.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["gru1"],
  "framework": "nextjs"
}
```

## 📝 Notas de Desenvolvimento

1. **Upload Strategy** - Sistema híbrido baseado no tamanho do arquivo
2. **Validar uploads** - Todos os uploads têm validação de tipo e tamanho
3. **Gerenciamento de estado** - TanStack Query para cache e sincronização
4. **TypeScript** - Tipagem rigorosa em todos os componentes
5. **Accessibility** - Componentes seguem padrões de acessibilidade
6. **Error Handling** - Logs detalhados para debugging em produção

## 🐛 Debug Tips

### Verificar logs do servidor
```bash
# Logs do Next.js development server
tail -f .next/server.log

# Console errors no browser
# Abrir DevTools > Console

# Vercel logs (production)
vercel logs DEPLOYMENT_URL
```

### Problemas comuns
1. **Upload falha** → Verificar tamanhos de arquivo e BLOB_READ_WRITE_TOKEN
2. **AI timeout** → Normal para arquivos grandes, upload ainda funciona
3. **Audio não carrega** → Verificar se URL é link direto para arquivo
4. **Tags não salvam** → Verificar API /api/boards/[id]/tags
5. **Build errors** → Verificar ESLint warnings e TypeScript errors

### Debugging Upload Issues
```bash
# Testar endpoint presigned diretamente
curl -X POST https://kanbanmusic.vercel.app/api/upload/audio-presigned \
  -H "Content-Type: application/json" \
  -d '{"type":"uploadUrl","pathname":"test.mp3"}'

# Verificar variáveis de ambiente  
vercel env ls
```

---

**Última atualização**: 2025-08-18  
**Versão**: 2.0.0 - Audio Upload Reformulado  
**Status**: Sistema de upload estável, próximo foco na otimização da IA