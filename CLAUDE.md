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
- **Audio Upload Unificado** - Sistema simplificado para todos os tamanhos de arquivo
  - **Todos os arquivos**: Client upload direto para Vercel Blob (evita erro 413)
  - Upload via Vercel Blob com `addRandomSuffix` automático
  - Validação de URL para links diretos de áudio
  - Extração automática de cover art de arquivos MP3
  - Limite de 100MB para arquivos
  - AI análise opcional (pode dar timeout mas upload sempre funciona)
  - Player de áudio integrado
- **Cover Images** - Upload de imagens de capa para cards e colunas
  - Suporte para JPEG, PNG, WebP, GIF
  - Limite de 5MB para imagens
  - Preview e remoção de covers

### ✅ UI/UX Melhorias
- **Dialog Modals** - Substituição de Sheet drawers por Dialog modais
- **Overlay Sutil** - Dialog overlay reduzido de 80% para 20% de opacidade
- **Validação de Formulários** - Validação robusta para uploads e URLs
- **Estados de Loading** - Indicadores visuais durante operações
- **Responsive Design** - Interface adaptável para diferentes tamanhos de tela
- **Tags Input** - Componente com navegação por teclado e autocomplete
- **Card Preview** - Toggles para mostrar/ocultar descrição e tags
- **Cover Image Hover** - Botões "Change" e "Remove" aparecem apenas no hover
- **Audio Player Dark** - Player redesenhado com tema escuro e ícones filled
- **Timeline Sempre Visível** - Progress bar clicável mesmo antes do play
- **Players Independentes** - CompactPlayer e MiniPlayer nunca conflitam
- **Layout Super Compacto** - CompactPlayer otimizado para mínimo espaço vertical

## 🗂️ Arquitetura de Componentes

### Audio Components
- `AudioUploadTabs.tsx` - Upload híbrido de áudio (refatorado e modular)
  - `hooks/useAudioUpload.ts` - Lógica de upload e validação
  - `hooks/useCoverExtraction.ts` - Extração de covers de MP3
  - `hooks/useBulkImport.ts` - Lógica de importação em massa
  - `AudioUploadForm.tsx` - Interface de upload
  - `CoverExtractionDialog.tsx` - Dialog para covers extraídas
  - `BulkImportDialog.tsx` - Dialog para importação em massa
  - `FileList.tsx` - Lista de arquivos com progress tracking
- `MiniPlayer.tsx` - Player completo para detalhes do card (playerId: 'detail')
- `CompactPlayer.tsx` - Player super compacto para preview do card (playerId: 'compact')

### Cover Components  
- `CoverUploadTabs.tsx` - Upload de cover com tabs (File/URL)
- `CoverUploadCompact.tsx` - Upload compacto para cards
- `InlineCoverEditor.tsx` - Editor inline para colunas (sem modal)

### Board Components
- `Board.tsx` - Container principal do quadro (refatorado e modular)
  - `hooks/useBoardState.ts` - Estado, mutations e handlers do board
  - `hooks/useDragAndDrop.ts` - Lógica completa de drag & drop
  - `BoardToolbar.tsx` - Barra de título e ações do board
  - `BoardGrid.tsx` - Grid de colunas e botão "Add Column"
- `Column.tsx` - Componente de coluna com drag & drop
- `Card.tsx` - Componente de card com drag & drop e preview de tags
- `CardDetailSheet.tsx` - Modal de edição de cards com campo AI Notes

### UI Components
- `TagsInput.tsx` - Input de tags com autocomplete e navegação por teclado
- `Badge.tsx` - Componente para exibição de tags

### API Routes
- `/api/upload/audio` - Server upload para arquivos pequenos com AI
- `/api/upload/audio-presigned` - Presigned URLs para client upload de arquivos grandes  
- `/api/ai/clap-music` - **NOVO**: Análise musical com CLAP (Contrastive Language-Audio Pretraining)

### Utilities
- `validation-helpers.ts` - Funções de validação consolidadas

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.4.6 com React 19
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: TanStack Query v5 + Zustand (audio)
- **Database**: MongoDB com Mongoose
- **File Storage**: Vercel Blob
- **Drag & Drop**: @dnd-kit
- **Audio Metadata**: music-metadata-browser
- **AI Integration**: LP-MusicCaps (seungheondoh/lp-music-caps)

## 🎵 Sistema de Upload de Áudio - DETALHADO

### Arquitetura Unificada
O sistema foi simplificado para usar sempre client upload, evitando limitações do servidor:

#### Client Upload (Todos os arquivos)
```
File → Vercel Blob Client → /api/upload/audio-presigned → Upload Success
                                    ↓
                             AI Analysis (opcional) → AI Notes ou Skip
```
- ✅ Sem limite de 4.5MB das Vercel Functions (evita erro 413)
- ✅ Upload sempre bem-sucedido para arquivos até 100MB
- ✅ AI opcional para evitar timeouts
- ✅ Processo consistente para todos os tamanhos

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

### ✅ Sistema de Playlists Completo (2025-08-19)
- **Toggle switch** para alternar entre modo áudio único e playlist
- **Busca e adição** de cards existentes para formar playlists
- **Drag & drop reordering** para reorganizar items da playlist
- **Player simplificado** com play/pause/stop e tempo total (sem timeline)
- **Suporte para cards sem áudio** em playlists organizacionais
- **Preview no card** mostra primeiros 3 items + "+X outros"
- **População automática** de dados (título, audioUrl) via API
- **Gradiente animado** nos players quando tocando música

### ✅ Processamento Avançado de Imagens (2025-08-19) 
- **API de processamento** `/api/upload/cover-processed` com Sharp
- **Conversão automática** para JPEG (85% qualidade)
- **Redimensionamento proporcional** para largura máxima 600px
- **Otimização de tamanho** para melhor performance
- **Integração completa** em todos os componentes de cover
- **Upload server-side** antes do Vercel Blob storage

### ✅ UX Melhorada para Tags (2025-08-19)
- **Vírgula como separador** além do Enter para criar tags
- **Múltiplas tags simultâneas** (ex: "rock, indie, 80s" → 3 tags)
- **Processamento inteligente** remove vírgulas extras e espaços
- **Compatibilidade total** com autocomplete e sugestões existentes
- **Parsing automático** durante digitação

### ✅ Colaboração em Tempo Real - Base (2025-08-19)
- **Polling inteligente** atualiza board a cada 2 minutos automaticamente
- **Background polling** continua funcionando em abas inativas  
- **Reconexão automática** ao retornar para a tab
- **Network-aware** recarrega quando conexão é restaurada
- **Arquitetura SSE preparada** para migração futura instantânea
- **Sistema de eventos** preparado para broadcast real-time

### ✅ Upload de Áudio Reformulado (2025-08-19)
- Sistema unificado client upload para todos os tamanhos de arquivo
- Eliminação do erro 413 (Payload Too Large) ao remover server upload
- Integração com Vercel Blob storage via presigned URLs
- Análise AI opcional para todos os arquivos (pode dar timeout)
- Upload sempre bem-sucedido até 100MB, independente do resultado da AI
- **Interface simplificada**: Removidas tabs, apenas botão "Choose Audio File"

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

### ✅ Melhorias de UX (2025-08-19)
- **Cover Image Hover**: Botões "Change" e "Remove" aparecem apenas no hover sobre a imagem
- **Estado sem Cover**: Botão ghost "Add Cover" em vez de "Choose Cover"
- **Audio Player Dark Theme**: Redesenhado com background `slate-700` e ícones filled
- **Timeline Interativa**: Progress bar sempre visível e clicável, mesmo antes do play
- **Dialog Overlay Sutil**: Reduzida opacidade de 80% para 20% para melhor UX
- **Players Independentes**: Eliminado conflito entre CompactPlayer e MiniPlayer
- **Layout Super Compacto**: CompactPlayer otimizado para mínimo espaço vertical

### ✅ Sistema de Áudio Avançado (2025-08-19)
- **Bulk Import**: Importação em massa de arquivos de áudio via menu da coluna
- **Players Únicos**: Zustand store garante apenas um player ativo por vez
- **CompactPlayer**: Layout horizontal ultra-compacto (controles + timeline + tempo)
- **MiniPlayer**: Player completo para detalhes do card com tema escuro
- **Extração Automática**: Cover art de MP3s extraída automaticamente no bulk import
- **Progress Tracking**: Feedback visual detalhado durante importação em massa

## 🎵 Status Atual da Integração AI

### ✅ SOLUÇÃO IMPLEMENTADA: CLAP Music Analysis
- **Modelo CLAP (laion/larger_clap_music_and_speech)** implementado com sucesso
- **Disponível via Hugging Face Inference API**
- **Funcionalidades**: Genre classification, mood detection, instrument identification, musical style analysis

### ✅ Capacidades do CLAP
- **[X] Zero-shot Audio Classification**: Classifica música sem treino específico
- **[X] Genre Detection**: Rock, Pop, Jazz, Classical, Electronic, Hip Hop, Folk, etc.
- **[X] Mood Analysis**: Happy, Sad, Energetic, Calm, Intense, Romantic, Dramatic
- **[X] Instrument Recognition**: Guitar, Piano, Violin, Drums, Synthesizer, Saxophone
- **[X] Style Classification**: Instrumental, Vocal, Acoustic, Electronic, Slow, Fast
- **[X] Confidence Scoring**: Retorna score de confiança da análise

### 🔧 Configuração Técnica
- **Endpoint**: `/api/ai/clap-music`
- **Limite de arquivo**: 10MB (otimizado para performance)
- **Formatos suportados**: MP3, WAV, OGG, M4A, AAC
- **Token necessário**: `HUGGINGFACE_API_TOKEN` (já configurado)

## 🔧 Configurações Importantes

### Environment Variables (.env.local)
```
MONGODB_URI=your_mongodb_connection_string
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
HUGGINGFACE_API_TOKEN=your_hf_token
```

### Environment Variables (Vercel Production)
```
MONGODB_URI=production_mongodb_uri
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token
HUGGINGFACE_API_TOKEN=production_hf_token
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

## 🔄 Real-time Collaboration - ROADMAP

### **Atual: Polling Inteligente (Implementado)**
```typescript
// useBoardState.ts - Configuração atual
refetchInterval: 1000 * 60 * 2,          // Poll a cada 2 minutos
refetchIntervalInBackground: true,        // Continua em background
refetchOnWindowFocus: true,              // Atualiza ao voltar à tab
refetchOnReconnect: true,                // Reconecta automaticamente
```

**Status**: ✅ **FUNCIONAL** - Colaboração com latência de 0-120 segundos

### **Futuro: Server-Sent Events (Preparado)**

**Arquitetura SSE já criada**:
```
src/
├── app/api/boards/[id]/events/route.ts      # SSE endpoint (base pronta)
├── lib/hooks/useBoardEvents.ts              # Hook para eventos (pronto)
├── lib/utils/board-events.ts                # Sistema de eventos (pronto)
└── components/board/hooks/useBoardState.ts  # Polling atual (funcional)
```

**Migração SSE - Passos definidos**:
1. **Ativar SSE endpoint** - Ajustar streaming de eventos
2. **Integrar emissores** - Adicionar em 8 APIs de mutação
3. **Substituir polling** - Remover refetchInterval
4. **Teste colaborativo** - 2+ usuários simultâneos

**Eventos preparados**:
- `card-created` | `card-updated` | `card-moved` | `card-deleted`
- `column-created` | `column-updated` | `column-deleted`  
- `board-updated`
- `playlist-updated`

**Fluxo de funcionamento**:
```typescript
// 1. Usuário A move card
emitCardEvent(boardId, cardId, 'moved', { fromColumn, toColumn })

// 2. SSE broadcasteado para todos
GET /api/boards/[boardId]/events
-> event: update
-> data: { type: 'card-moved', cardId: 'abc', ... }

// 3. Hook detecta mudança
const { lastEvent } = useBoardEvents(boardId)
-> queryClient.invalidateQueries(['board', boardId])

// 4. UI atualiza instantaneamente
```

### **Avançado: WebSockets (Planejado)**

**Para funcionalidades futuras**:
- Collaborative cursors (cursores de outros usuários)
- Presence indicators (quem está online)
- Chat em tempo real
- Edição simultânea de texto
- Conflict resolution

**Estimativa de implementação**:
- **SSE**: 1-2 dias (base já criada)
- **WebSockets**: 1 semana (implementação completa)
- **Collaborative features**: 2-3 semanas

**Comparação de latência**:
| Método | Latência | Tráfego | Complexidade |
|--------|----------|---------|--------------|
| Polling atual | 0-120s | Alto | ⭐ Simples |
| SSE futuro | <1s | Baixo | ⭐⭐ Médio |
| WebSocket avançado | <100ms | Mínimo | ⭐⭐⭐ Alto |

## 📝 Notas de Desenvolvimento

1. **Upload Strategy** - Sistema híbrido baseado no tamanho do arquivo
2. **Validar uploads** - Todos os uploads têm validação de tipo e tamanho
3. **Gerenciamento de estado** - TanStack Query para cache e sincronização
4. **TypeScript** - Tipagem rigorosa em todos os componentes
5. **Accessibility** - Componentes seguem padrões de acessibilidade
6. **Error Handling** - Logs detalhados para debugging em produção
7. **Real-time Ready** - Arquitetura preparada para evolução gradual

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

**Última atualização**: 2025-08-19  
**Versão**: 4.0.0 - Enterprise Collaboration & Content Optimization  
**Status**: 
- ✅ **SISTEMA PLAYLIST COMPLETO** - Cards de playlist com busca, reordenação e player simplificado
- ✅ **PROCESSAMENTO DE IMAGENS** - Conversão automática para JPG e redimensionamento para 600px
- ✅ **TAGS APRIMORADAS** - Vírgula como separador para UX mais intuitiva
- ✅ **COLABORAÇÃO TEMPO REAL** - Polling inteligente com updates automáticos (2min)
- ✅ **ARQUITETURA SSE PREPARADA** - Base completa para tempo real instantâneo (<1s)
- ✅ **GRADIENTE ANIMADO** - Players com visual dinâmico quando tocando
- ✅ **PREVIEW DE PLAYLISTS** - Cards mostram primeiros 3 items + contador
- ✅ **POPULAÇÃO DE DADOS** - API popula automaticamente títulos e audioUrls das playlists
- ✅ **PLAYERS INDEPENDENTES** - Eliminado conflito entre CompactPlayer e MiniPlayer
- ✅ **BULK IMPORT** - Importação em massa de arquivos de áudio
- ✅ **LAYOUT SUPER COMPACTO** - CompactPlayer otimizado para mínimo espaço vertical
- ✅ **ARQUIVAMENTO CORRIGIDO** - Fix do freeze ao arquivar cards
- ✅ **REFATORAÇÃO COMPLETA** - Código modular, hooks organizados, zustand integrado
- ❌ AI de música indisponível (modelo não deployado na HF)
- 🔄 **PRÓXIMOS PASSOS**:
  - Real-time SSE (1-2 dias de implementação)
  - WebSocket collaboration (1 semana)
  - Presence indicators & collaborative cursors (2-3 semanas)