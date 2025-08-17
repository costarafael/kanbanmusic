# Arquitetura do Projeto - Kanban App

## Estrutura Organizada

### Principais Melhorias Implementadas

#### 1. **Limpeza de Código Morto**
- ✅ Removido `CardDetailDrawer.tsx` (não utilizado)
- ✅ Removido `drawer.tsx` UI component (não utilizado)
- ✅ Removido `utils/validation.ts` (consolidado)

#### 2. **Consolidação de Validações**
- ✅ Criado `utils/validation-helpers.ts` centralizado
- ✅ Removidas validações duplicadas de URLs
- ✅ Funções reutilizáveis: `isValidUrl`, `isValidAudioUrl`, `generateUniqueId`

#### 3. **Imports e Variáveis Limpas**
- ✅ Removidos imports não utilizados em todos os componentes
- ✅ Removidas variáveis não utilizadas (activeId, activeCardIndex, etc.)
- ✅ Limpeza de tipos TypeScript não referenciados

## Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── boards/        # Board operations
│   │   ├── cards/         # Card operations  
│   │   ├── columns/       # Column operations
│   │   └── upload/        # File upload endpoints
│   └── b/[id]/           # Board pages
├── components/            # React components
│   ├── audio/            # Audio functionality
│   ├── board/            # Core board components
│   ├── cover/            # Cover image functionality
│   ├── drawer/           # Modal/drawer components
│   ├── editor/           # Text editor
│   └── ui/               # Reusable UI components
└── lib/                  # Utilities and configurations
    ├── config/           # Environment configuration
    ├── db/               # Database models and connection
    ├── utils/            # Utility functions
    └── validators.ts     # Zod validation schemas
```

## Componentes Principais

### Core Components
- **Board.tsx**: Gerenciamento principal do board com drag & drop
- **Card.tsx**: Componente de card individual com cover e audio
- **Column.tsx**: Componente de coluna com cover support
- **CardDetailSheet.tsx**: Modal para edição detalhada de cards

### Feature Components
- **CoverUpload.tsx**: Upload de imagens de cover (1:1 ratio)
- **RichTextEditor.tsx**: Editor de texto simples para descrições
- **AudioUpload.tsx**: Upload e gerenciamento de áudio
- **TrashView.tsx**: Visualização de itens arquivados

## Utilitários Consolidados

### `validation-helpers.ts`
```typescript
- generateUniqueId(): string
- validateNanoId(id: string): boolean  
- isValidUrl(url: string): boolean
- isValidAudioUrl(url: string): boolean
- sanitizeHtml(html: string): string
```

### `validators.ts`
- Schemas Zod para validação de dados
- Tipos TypeScript gerados automaticamente
- Validações reutilizáveis para boards, columns e cards

## Benefícios da Arquitetura Atual

1. **Separação de Responsabilidades**
   - Componentes focados em uma única responsabilidade
   - Utilitários centralizados e reutilizáveis
   - APIs organizadas por domínio

2. **Manutenibilidade**
   - Código limpo sem duplicações
   - Imports organizados e necessários
   - Funções pequenas e testáveis

3. **Performance**
   - Componentes otimizados sem código morto
   - Bundle size reduzido
   - Imports apenas do necessário

4. **Extensibilidade**
   - Estrutura modular para novos features
   - Utilitários reutilizáveis
   - Padrões consistentes

## Próximos Passos Recomendados

1. **Testes**
   - Adicionar testes unitários para utilitários
   - Testes de integração para componentes principais

2. **Performance**
   - Implementar lazy loading para componentes pesados
   - Otimizar re-renders com React.memo onde necessário

3. **Acessibilidade**
   - Adicionar alt texts para imagens
   - Melhorar navegação por teclado

4. **Documentação**
   - JSDoc para funções utilitárias
   - Storybook para componentes UI