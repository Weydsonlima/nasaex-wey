# NASA Pages — Overview pra devs

> Fonte de verdade do domínio. Atualize SEMPRE que mexer em `src/features/pages/`, `src/app/router/pages/`, rotas `/pages` e `/s/*`, ou models `NasaPage*` no Prisma.

Doc complementar: [`nasa-pages-evolution.md`](./nasa-pages-evolution.md) cobre as fases históricas que deram origem à arquitetura atual.

---

## O que é

Builder visual de landing pages multi-página, no estilo Webflow/Framer, integrado ao NASA. Cada `Organization` pode ter N **sites** (top-level `NasaPage`), cada site pode ter N **subpages** (`parentPageId` self-relation), e cada page guarda seu **layout em JSON** com elementos posicionáveis + sections compostas + tokens visuais.

URLs públicas:
- `/s/<rootSlug>` — home do site
- `/s/<rootSlug>/<subSlug>` — subpage
- `<customDomain>/` — vanity domain via `NasaPage.customDomain` (resolve via DNS + middleware)

Editor: `/pages/<id>?subpage=<id>` (Builder Shell com canvas + sidebar + painel direito).

---

## Stack do domínio

| Camada | Tecnologia |
|---|---|
| Estado do builder | **Zustand** (`pages-builder-store.ts`) com history undo/redo |
| Drag & drop | **@dnd-kit** (sortable + draggable cross-tab) |
| Sortable rows | `@dnd-kit/sortable` + `verticalListSortingStrategy` |
| Persistência | **Prisma JSON columns** (`layout`, `publishedLayout`, `palette`) |
| RPC | oRPC procedures em `src/app/router/pages/` |
| Upload de imagens | **Cloudflare R2** (S3-compat) via `/api/s3/upload-direct` server-side + fallback `/api/upload-local` em dev |
| Render público | Server Component `src/app/(public)/s/[[...slug]]/page.tsx` → `PublicPageView` → `PublicPageRenderer` |
| Analytics | `register-visit` + `PageTracker` (scroll/click/section/dwell) |

---

## Estrutura de pastas

```
src/features/pages/
├── components/
│   ├── builder/                    # Canvas + sidebar + topbar + drawer mobile
│   │   ├── builder.tsx             # Shell do editor (rota /pages/[id])
│   │   ├── builder-canvas.tsx      # Área editável (drag/drop, zoom, snap)
│   │   ├── builder-sidebar.tsx     # 5 abas: Elementos / Blocos / Camadas / Páginas / Ajustes
│   │   ├── builder-topbar.tsx      # Save / Publish / device switcher / zoom
│   │   ├── layers-panel.tsx        # Aba Camadas — lista reordenável estilo Canva
│   │   ├── pages-panel.tsx         # Aba Páginas — multi-page (subpages)
│   │   ├── blocks-panel.tsx        # Aba Blocos — biblioteca de 25+ blocos prontos
│   │   ├── url-slug-editor.tsx     # Editor de slug + sub-slug em Ajustes
│   │   └── sortable-layer-row.tsx  # Linha da aba Camadas
│   ├── elements/
│   │   ├── element-renderer.tsx    # Switch gigante: ElementType → componente
│   │   ├── element-box.tsx         # Wrapper draggable + resize handles no canvas
│   │   ├── group-renderer.tsx      # Renderer pro element type "group"
│   │   ├── carousel.tsx            # Elemento Carrossel principal
│   │   ├── chat-button.tsx         # Botão Chat IA flutuante (overlay singleton)
│   │   ├── marketing.tsx           # Marketing toolkit (toasts + countdown + scarcity)
│   │   ├── embedded-form.tsx       # Formulário nativo
│   │   ├── exit-intent.tsx         # Popup de saída
│   │   ├── data-bound.tsx          # Renderer pra dados em tempo real (planos/cursos)
│   │   ├── animated-border.tsx     # Borda animada estilo Explorer (efeito reusável)
│   │   ├── scroll-reveal.tsx       # Wrapper de animação de entrada/saída
│   │   ├── image-crop-editor.tsx   # Editor inline de crop pra imagem
│   │   ├── interactive/            # Marquee, Tabs, Accordion, Counter
│   │   └── sections/               # 10 sections compostas (ver abaixo)
│   ├── properties-panel/           # Painel direito (props do elemento selecionado)
│   │   ├── properties-panel.tsx    # Roteador: ElementType → *Props component
│   │   ├── typography-editor.tsx   # TextStyle editor reusável
│   │   ├── animated-border-editor.tsx
│   │   ├── scroll-reveal-editor.tsx
│   │   ├── interlude-zones-editor.tsx  # Editor dos blocos intermediários das sections
│   │   ├── color-picker-with-palette.tsx  # Color picker + swatches da paleta da page
│   │   ├── anchor-picker.tsx       # Dropdown das camadas pra usar como anchor target
│   │   ├── marketing-props.tsx     # Props do elemento Marketing (separado pelo tamanho)
│   │   ├── image-uploader-field.tsx
│   │   └── sortable-section-item.tsx  # Card draggable usado dentro das *Props
│   ├── public/
│   │   ├── public-page-view.tsx    # Decide se usuário é owner (mostra InlineEdit)
│   │   ├── public-page-renderer.tsx  # SSR do JSON → HTML; gerencia LandingFlow + NavbarOverlay
│   │   ├── page-context.tsx        # Context com rootSlug, siblingPages, orgSlug, availablePlans
│   │   ├── powered-by-nasa.tsx     # Footer "Powered by NASA" com link orbita
│   │   └── page-analytics.tsx      # Injeta Meta Pixel / GA / GTM no head
│   ├── inline-edit/
│   │   └── inline-edit-provider.tsx  # Botão "Modo edição" pro owner editar inline na página publicada
│   ├── pages-list/
│   │   └── pages-list.tsx          # Grid /pages — cards dos sites top-level
│   ├── wizard/                     # Wizard de criação (escolher template)
│   ├── publish-dialog/
│   ├── template-gallery.tsx
│   ├── template-preview-dialog.tsx
│   ├── analytics/                  # Charts de visitas/conversão
│   └── rocket-loader.tsx
├── context/
│   └── pages-builder-store.ts      # Zustand store (ver "Store" abaixo)
├── hooks/
│   ├── use-pages.ts                # Wrappers oRPC pra lista/get/create/update
│   └── use-nasa-page-subpages.ts   # Subpages do site atual + bulkApplyElement
├── lib/
│   ├── element-factory.ts          # createElement(type, prefs) → ElementBase com defaults
│   ├── insert-position.ts          # computeInsertPosition — onde átomo novo aparece no canvas
│   ├── visible-section.ts          # findVisibleSectionId + mapElementToInterludeBlock
│   ├── section-flow.ts             # isFlowSection(type) — quem participa do empilhamento Y
│   ├── layer-utils.ts              # getElementDisplayName / icon / flattenGroupsForRender
│   ├── resolve-nav-link.ts         # Link interno (subpageId) → URL /s/<root>/<sub>
│   ├── block-library.ts            # 25+ blocos prontos da aba "Blocos"
│   ├── page-templates.ts           # 4 templates iniciais (Institucional, Captura, etc)
│   ├── data-sources.ts             # Mock de fontes pra data-bound (planos, cursos)
│   ├── animations.ts + animations.css  # 15 keyframes nomeadas + CSS classes
│   ├── text-style.ts               # TextStyle interface + resolveTextStyle + textStyleToCSS
│   ├── upload-image.ts             # Helper de upload (R2 → local fallback)
│   ├── marketing-data.ts           # Names BR + cidades pra toasts de leads
│   ├── phone-br.ts                 # Máscara + validação de WhatsApp BR
│   ├── responsive.ts               # DEVICE_PRESETS + resolveElements por viewport
│   ├── domain-provider.ts          # Helpers Cloudflare pra custom domain
│   └── use-user-location.ts        # Geolocalização browser pra personalizar toasts
├── types.ts                        # ElementBase + ElementType + PageLayout + DesignTokens
└── constants.ts                    # ELEMENT_TYPES + ELEMENT_CATEGORIES + LABELS
```

---

## Modelos Prisma

| Model | Função |
|---|---|
| **`NasaPage`** | Page raiz. Top-level (`parentPageId = null`) ou subpage. Slug único por org top-level / único dentro do parent pra subpages. Guarda `layout` (draft) e `publishedLayout` (snapshot publicado). |
| **`NasaPageVersion`** | Snapshots do `layout` em cada publish — base do timeline de versions com restore. |
| **`NasaPageAsset`** | Tracking de imagens enviadas (R2 keys) pra cleanup de órfãs. |
| **`NasaPageVisit`** | Pageview + UTM + device + duration. Alimentado por `/api/pages/<id>/track`. |
| **`NasaPageDomainPurchase`** | Estado de compra de custom domain via Cloudflare/Stripe. |

Campos críticos do `NasaPage`:

- `layout: Json` — rascunho editado pelo owner. Estrutura em **`PageLayout`** (ver `types.ts:229`).
- `publishedLayout: Json?` — snapshot público. `/s/*` renderiza esse, não o `layout`.
- `palette: Json` — Record<string, string> de cores da página (primary, accent, bg…). Aparece como swatches nos color pickers.
- `fontFamily: String?` — fonte global da page.
- `parentPageId: String?` + `subpageOrder: Int?` — multi-page sites.
- `customDomain: String?` — vanity domain único globalmente.

---

## Procedures oRPC (`src/app/router/pages/`)

| Procedure | Função |
|---|---|
| `listPages` | Grid /pages — filtra `parentPageId: null` + include `_count.subpages` |
| `getPage` | Editor — retorna page + subpages do site (pra navbar resolver links internos) |
| `createPage` | Wizard / "+Nova página" |
| `createSubpage` | Aba Páginas — cria subpage filho do root atual |
| `updatePage` | Save do builder |
| `updatePageSlug` | Editor de slug em Ajustes (com validação de colisão) |
| `inlineEditSave` | Save quando owner edita inline na página publicada |
| `publishPage` | Snapshot `layout` → `publishedLayout` + cria `NasaPageVersion` + bump status |
| `unpublishPage` | Remove `publishedLayout`, page volta a DRAFT |
| `deletePage` | Hard delete (com cascade nos versions/visits/assets/subpages) |
| `duplicatePage` | Clona page + versions + assets |
| `cloneFromUrl` | Clona uma page pública (assets baixados + re-uploaded pro R2 do owner) |
| `listSubpages` / `reorderSubpages` / `setAsHome` / `bulkUpdateSubpagesElement` | Painel "Páginas" multi-page |
| `listVersions` / `restoreVersion` | Histórico de publishes |
| `getAnalytics` | Visits agregados por dia/source/device pro painel /pages/[id]/analytics |
| `registerVisit` | Tracker público chamado pelo `PageTracker` em /s/* |
| `publicGet` / `publicGetByDomain` | Render público (uma usa slug, outra `customDomain`) |
| `listTemplates` / `getResources` / `getCost` | Wizard de criação |
| `domainSearch` / `domainStartPurchase` / `domainPurchaseStatus` / `setCustomDomain` / `verifyCustomDomain` | Fluxo de custom domain via Stripe + Cloudflare |

Schemas Zod em `_schemas.ts`. Index registra tudo em `index.ts`.

---

## Conceitos chave

### `ElementType` (26+ tipos)

Discriminated union em `types.ts:129`. Quatro famílias:

1. **Átomos** — `text`, `image`, `svg`, `shape`, `divider`, `icon`, `button`, `video`, `social`, `spacer`, `nasa-link`, `embed`, `group`
2. **Flow sections** (10) — `section-hero`, `section-features`, `section-pricing`, `section-cta`, `section-stats`, `section-testimonials`, `section-faq`, `section-logo-cloud`, `section-navbar`, `section-footer`. Detectadas por `isFlowSection()` — empilham verticalmente no modo landing.
3. **Blocos interativos** — `marquee`, `tabs`, `accordion`, `counter`, `carousel`
4. **Lead capture & marketing** — `chat-button`, `embedded-form`, `exit-intent`, `marketing`, `data-bound`

Singletons (só 1× por page, definidos em `SINGLETON_TYPES`): `chat-button`, `exit-intent`, `section-navbar`, `section-footer`, `marketing`.

### `PageLayout`

```ts
type PageLayout =
  | { mode: "single"; main: Layer; artboard; meta?; tokens?; parallax?; ... }
  | { mode: "parallax"; back: Layer; front: Layer; artboard; ... }

interface Layer { elements: ElementBase[] }
```

Cada `ElementBase` tem `id`, `type`, `x`, `y`, `w`, `h`, `rotation?`, `opacity?`, `zIndex?`, `hidden?`, `locked?`, `interlude?`, `responsive?`, props específicas do tipo.

### Modo "landing" vs "canvas"

- **landing**: tem ≥1 flow section. Renderer ordena por `y` ASC, ignora `x` (full-width), aplica `LandingFlow`. É o default das pages modernas.
- **canvas**: só átomos posicionados absolutamente. Layout livre estilo Figma. Detecção em `pageRenderMode()`.

### Interlude blocks

Sections compostas (testimonials, features, etc) têm **3 zonas internas** onde o user pode injetar mini-elementos sem criar novo átomo:

```ts
interlude: {
  aboveHeading?: InterludeBlock[]
  betweenHeadingAndCards?: InterludeBlock[]
  afterCards?: InterludeBlock[]
}
```

Kinds suportados: `text`, `image`, `button`, `divider`, `spacer`, `badge`, `video`, `embed`, `carousel`, **`inline-element`** (wrapper genérico que carrega `ElementBase` via `ElementRenderer` — permite QUALQUER átomo virar interlude).

Editor: `interlude-zones-editor.tsx`. Renderer: `interlude-block.tsx` + `RenderInterludeBlocks`.

### Multi-page sites

`NasaPage.parentPageId` faz self-relation. Cada site é o conjunto de `{ root + N subpages }`. Subpages compartilham `organizationId` mas têm seu próprio `layout`/`publishedLayout`/`palette`/etc.

Catch-all `/s/[[...slug]]/page.tsx`:
- `/s/<root>` → home do site
- `/s/<root>/<sub>` → subpage publicada
- inexistente → 404

Navbar: `NavLink.subpageId` resolve via `resolveNavLinkHref(link, rootSlug, siblingPages)` pra montar URL interna estilo `/s/<root>/<sub>`. "Aplicar em todas as páginas" copia navbar/footer entre as irmãs via `bulkUpdateSubpagesElement`.

### Design tokens & paleta

Dois campos no JSON da page (separados de propósito):

- **`palette: Record<string, string>`** — paleta do usuário, editada em Ajustes → "Padrão de cores da página". Cada cor vira swatch nos color pickers via `ColorPickerWithPalette` / `PaletteSwatchesRow`.
- **`tokens: DesignTokens`** (interface em `types.ts`) — semântico (primary, accent, bg, fg, muted…) usado pelos renderers das sections. Resolvido por `bgColor()` / `primaryColor()` etc em `sections/types.ts`.

### Camadas (Layer Z)

Não confundir "camada" do user (=section/elemento no array) com `Layer` do schema (`back`/`main`/`front` no modo parallax). No builder a aba "Camadas" mostra os elementos do array atual.

### Animações

- **`animations.ts`** — 15 presets nomeados (`fadeUp`, `slideLeft`, `zoomIn`, etc).
- **`animations.css`** — keyframes globais importadas em `public-page-view.tsx`.
- **Scroll Reveal** — wrapper React que dispara animação ao entrar no viewport (`ScrollReveal` + `getScrollRevealProps`).
- **Animated Border** — efeito Explorer reusável por element (`AnimatedBorder` + `getAnimatedBorderProps`).

---

## Store (Zustand)

`src/features/pages/context/pages-builder-store.ts` — único source of truth no editor. Ações principais:

```ts
setPage(pageId, layout)
setLayout(layout, pushHistory?)
setDevice(device) / setZoom(zoom) / setActiveLayer(layer)
setSelected(ids) / toggleSelected(id, additive)
setActiveSubpage(id)

addElement(el)
insertElementAt(el, targetIndex)
appendInterludeBlockToSection(sectionId, block, zone)
updateElement(id, patch)              // reindexa Y em cascata se h muda numa flow section
removeElement(id)
duplicateSelected()
moveElement(id, targetIndex)          // reordena no array + reindex Y
groupElements(ids) → groupId
ungroupElement(id)
toggleVisibility(id) / toggleLock(id)

updateArtboard(patch)
updateMeta(patch)
updatePalette(patch)                  // chave → cor (undefined remove)

undo() / redo() / canUndo() / canRedo()
```

History é array de snapshots do `PageLayout`. Bumps fazem branch a partir do `historyIndex` atual.

---

## Render público (SSR + client)

Fluxo de uma request a `/s/aulao-liftbumbum`:

1. **`src/app/(public)/s/[[...slug]]/page.tsx`** (Server Component)
   - Busca `NasaPage` por slug + `parentPageId: null` + `status: PUBLISHED`
   - Inclui `subpages` publicadas pro contexto da navbar
   - Renderiza `<PublicPageView>`

2. **`PublicPageView`** (Client)
   - Checa se usuário logado é owner → renderiza `<InlineEditProvider>` (Modo edição)
   - Caso contrário renderiza `<PublicPageRenderer>` direto
   - Sempre injeta `<PoweredByNasa>` no fim

3. **`PublicPageRenderer`** (Client)
   - Hidrata `PageRenderContextProvider` com `{ organizationSlug, pageSlug, rootSlug, siblingPages, availablePlans }`
   - Aplica `SmoothScrollStyle` + `PageAnalytics` (Pixel/GA/GTM do `layout.meta`)
   - Extrai navbar do array e renderiza FORA do flex-col em `<NavbarOverlay>` pra garantir `position: fixed` real (`isolation: isolate` + `translateZ(0)` + `will-change`)
   - Renderiza `<LandingFlow>` (modo landing) ou `<LayerSurface>` (modo canvas)

4. **`LandingFlow`** — para cada elemento ordena por Y, expande grupos, filtra `hidden`, dedup singletons, envolve em `wrapWithEffects` (border animada + scroll reveal).

5. **`PageTracker`** — registra visita assíncrona via `register-visit` quando há `slug` (ignora preview).

---

## Upload de imagens

Helper único: `lib/upload-image.ts` → `uploadImage(file)`. Estratégia em cascata:

1. **`/api/s3/upload-direct`** — POST `multipart/form-data` server-side pro R2 (sem CORS browser). Retorna `{ key }`. URL pública = `https://${NEXT_PUBLIC_S3_BUCKET_CONSTRUCTOR_URL}/${key}`.
2. **`/api/upload-local`** — fallback dev. Grava em `public/uploads/`. NÃO funciona em prod (Vercel filesystem read-only).

Quando R2 retorna 503 (env vars ausentes), cai pro local automaticamente. Em produção sem R2 configurado, mostra warning no console.

Plugado em: `ImageUploaderField`, `LogoUploader`, `HeroImageUploader`, `HeroBackgroundUploader`, `ImageProps` (todos no `properties-panel.tsx`).

---

## Como adicionar um novo ElementType

1. Adicionar literal em `types.ts:129` (`ElementType`)
2. Adicionar em `constants.ts` → `ELEMENT_TYPES`, `ELEMENT_TYPE_CATEGORIES`, `ELEMENT_TYPE_LABELS`
3. Criar factory em `lib/element-factory.ts` (defaults pra `x`, `y`, `w`, `h`, props custom)
4. Adicionar ícone + label em `builder-sidebar.tsx` (Records `ICONS` e `LABELS`) e em `ELEMENT_ORDER` se for um átomo que aparece no sidebar
5. Adicionar renderer no `element-renderer.tsx` (`switch (element.type)`)
6. Se tiver props editáveis, criar `<TipoProps el={el} update={update} />` e plugar em `properties-panel.tsx`
7. Se for singleton, adicionar em `SINGLETON_TYPES`
8. (Opcional) Mapear em `mapElementToInterludeBlock` (`visible-section.ts`) — se não, cai no fallback `inline-element`
9. (Opcional) Definir helpers em `layer-utils.ts` pra nome amigável e ícone na aba Camadas

---

## Como adicionar uma nova flow section

1. Criar `components/elements/sections/section-foo.tsx` (renderer)
2. Adicionar literal `"section-foo"` em `ElementType`
3. Atualizar `isFlowSection()` em `lib/section-flow.ts` (geralmente já cobre via prefixo `section-`)
4. Adicionar case no `element-renderer.tsx`
5. Criar `<FooProps>` em `properties-panel.tsx` com `SortableSectionItem` se tiver lista de cards
6. (Opcional) Adicionar bloco pronto em `lib/block-library.ts` pra aparecer na aba Blocos

Pattern recomendado pra sections compostas (ver `section-testimonials.tsx` como referência):
- Header (eyebrow + heading + sub) editável via `TypographyEditor`
- Lista de cards com `SortableSectionItem` (drag-reorder)
- Suporte aos 3 interlude zones via `<RenderInterludeBlocks>`

---

## Variáveis de ambiente relevantes

| Var | Função |
|---|---|
| `NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES` | Bucket R2 onde imagens são gravadas |
| `NEXT_PUBLIC_S3_BUCKET_CONSTRUCTOR_URL` | Host público pra montar URL final `https://<host>/<key>` |
| `AWS_ENDPOINT_URL_S3` | Endpoint do R2 (estilo S3) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credenciais R2 |
| `CLOUDFLARE_API_TOKEN` | Custom domain (DNS + zone) |
| `STRIPE_SECRET_KEY` | Compra de domínio via Stripe |

CORS do bucket R2 documentado em `CLOUDFLARE_R2_CORS_PENDING.md` na raiz (uso obsoleto — hoje preferimos `upload-direct` server-side).

---

## Rotas

**Editor (auth required)**
- `/pages` — grid de sites do org
- `/pages/[id]` — builder shell
- `/pages/[id]?subpage=<id>` — editor de subpage
- `/pages/[id]/analytics` — charts de visitas
- `/pages/templates` — galeria de templates

**Público**
- `/s/[[...slug]]` — catch-all (root ou root/sub)
- `<customDomain>/*` — middleware resolve `customDomain` → page; usa mesmo render

**API**
- `/api/upload-local` — dev fallback de upload
- `/api/s3/upload-direct` — upload server-side pro R2 (sem CORS)
- `/api/s3/upload` — presigned URL (legado, exige CORS)
- `/api/s3/delete` — apaga chave do R2

---

## Padrões obrigatórios (CLAUDE.md)

1. **Hooks oRPC**: toda chamada client-side mora num hook em `hooks/use-<recurso>.ts`. Componentes/pages importam só os hooks, nunca `orpc` direto.
2. **Estado global**: Zustand (`pages-builder-store`), nunca Context.
3. **Server-only imports**: nada do `server/` em Client Component.
4. **Migrations**: `pnpm db:migrate` (NUNCA `db push`). Ritual pós-migration: `db:generate` → bumpar `SCHEMA_VERSION` em `src/lib/prisma.ts` → `touch` nos catch-all routes (`auth/[...all]/route.ts` + `rpc/[[...rest]]/route.ts`).
5. **Upload de imagem em código novo**: usar `uploadImage()` de `lib/upload-image.ts`, nunca chamar `/api/upload-local` direto.
6. **Clean Code**: nomes semânticos (`payload`, `response`, `isSignatureValid` — nunca `p`, `res`, `ok` soltos). Boy-scout rule ao mexer em arquivos legados.

---

## Pontos de extensão conhecidos

- **Global components Webflow-style** — hoje "Aplicar navbar em todas as páginas" copia snapshots. Falta entidade própria de "componente global" com edição num lugar único.
- **Sub-subpages** (>2 níveis) — schema permite via `parentPageId` recursivo, mas UX/rota só renderiza 2 níveis.
- **Sitemap.xml automático** — gerar SEO map cobrindo root + todas subpages publicadas.
- **Drop zones cross-tab pra aba Páginas** — hoje só Camadas tem drop zones.
- **R2 CORS** pendente em `CLOUDFLARE_R2_CORS_PENDING.md` (workaround atual: `upload-direct` server-side).

---

## Histórico de PRs grandes

- **#87** — Builder evolution: multi-page, Marketing, animations, in-chat hardening
- **#88** — Correções 2: upload prod, navbar fixed, paleta, hamburguer mobile, mover entre camadas, kind inline-element universal

Sempre adicione referência ao PR aqui quando merger uma mudança grande em NASA Pages.
