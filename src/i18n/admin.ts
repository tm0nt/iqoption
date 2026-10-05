/**
 * Copy for the administration screens.
 *
 * Separate from the cabinet's dictionary because the audiences are different:
 * the cabinet speaks to whoever is trading, and this speaks to whoever runs
 * the platform. Keeping them apart means a word can be plain in one and
 * precise in the other — "balance" is a number to a trader and a row to an
 * operator.
 */
import type { AvalonLocale } from "@/types/avalon-login";

export type AdminCopy = {
  shell: {
    title: string;
    overview: string;
    instruments: string;
    deals: string;
    content: string;
    promo: string;
    cashier: string;
    brand: string;
    settings: string;
    traderoom: string;
    signedInAs: string;
  };
  brand: {
    heading: string;
    lead: string;
    name: string;
    nameHint: string;
    supportEmail: string;
    accent: string;
    accentHint: string;
    accentSample: string;
    theme: string;
    themeHint: string;
    themes: Record<"black" | "white" | "blue" | "grey", string>;
    logo: string;
    logoBig: string;
    icon: string;
    tagline: string;
    taglineHint: string;
    description: string;
    descriptionHint: string;
    siteUrl: string;
    siteUrlHint: string;
    preview: string;
    usingBuilt: string;
    chooseFile: string;
    revert: string;
    reachNote: string;
    saved: string;
    saveFailed: string;
    uploadFailed: string;
  };
  common: {
    edit: string;
    save: string;
    cancel: string;
    delete: string;
    unreachable: string;
    refused: string;
    saved: string;
  };
  overview: {
    heading: string;
    lead: string;
    instrumentsEnabled: string;
    instrumentsNote: (live: number, synthetic: number) => string;
    accounts: string;
    deals: string;
    dealsNote: string;
    marketFeed: string;
    serving: (n: number) => string;
    checking: string;
    notAnswering: string;
    startItWith: string;
    feedUnreachable: string;
    reloadRefused: string;
    reload: string;
    reloading: string;
    feedNote: string;
    engine: string;
    feed: string;
    engineBuild: string;
    brand: string;
    countryReported: string;
    theseLiveIn: string;
    settingsLink: string;
    catalogue: (assets: number, groups: number) => string;
    liveFeeds: string;
    noFeed: string;
  };
  assets: {
    heading: string;
    lead: string;
    deleteNote: string;
    binance: string;
    synthetic: string;
    id: string;
    ticker: string;
    name: string;
    group: string;
    source: string;
    precision: string;
    payout: string;
    priority: string;
    enable: string;
    disable: string;
    savedReloadBefore: string;
    overviewLink: string;
    savedReloadAfter: string;
  };
  deals: {
    heading: string;
    running: string;
    settled: string;
    instrument: string;
    showAll: string;
    older: string;
    none: string;
    staked: string;
    paidOut: string;
    kept: string;
    deal: string;
    account: string;
    side: string;
    stake: string;
    opened: string;
    expiry: string;
    quotes: string;
    outcome: string;
    call: string;
    put: string;
    win: string;
    loss: string;
    refunded: string;
    inProgress: string;
    lead: string;
    filteredTo: (account: number) => string;
    all: string;
    count: (n: number) => string;
    newer: string;
    pageOf: (page: number, pages: number) => string;
  };
  content: {
    heading: string;
    lead: string;
    everyPanel: string;
    newItem: string;
    reReads: string;
    panel: string;
    language: string;
    allLanguages: string;
    group: string;
    groupHint: string;
    title: string;
    summary: string;
    body: string;
    picture: string;
    link: string;
    author: string;
    minutes: string;
    starts: string;
    stops: string;
    priority: string;
    shown: string;
    shownHint: string;
    empty: string;
    panels: Record<string, string>;
    startsShort: string;
    priorityShort: string;
    yes: string;
    no: string;
    allShort: string;
    saving: string;
    saveFailed: string;
    deleteFailed: string;
  };
  promo: {
    heading: string;
    lead: string;
    newCode: string;
    applyNote: string;
    code: string;
    kind: string;
    title: string;
    oneLine: string;
    longDescription: string;
    steps: string;
    details: string;
    stops: string;
    offered: string;
    offeredHint: string;
    used: string;
    ends: string;
    never: string;
    none: string;
    kinds: Record<string, string>;
    yes: string;
    no: string;
    saving: string;
    saveFailed: string;
    deleteFailed: string;
    titleExample: string;
  };
  cashier: {
    heading: string;
    lead: string;
    waiting: (n: number) => string;
    nothingToSettle: string;
    settled: string;
    nothingSettled: string;
    deposit: string;
    withdrawal: string;
    to: string;
    notePlaceholder: string;
    approve: string;
    reject: string;
    credits: string;
    refunds: string;
    movesNothing: string;
    alreadyLeft: string;
    kind: string;
    amount: string;
    account: string;
    method: string;
    outcome: string;
    when: string;
    note: string;
    settleFailed: string;
    approved: string;
    rejected: string;
  };
  settings: { heading: string; lead: string; revert: string; badJson: string; changedAt: (when: string) => string; saving: string };
};

const en: AdminCopy = {
  shell: {
    title: "Administration",
    overview: "Overview",
    instruments: "Instruments",
    deals: "Deals",
    content: "Content",
    promo: "Promo",
    cashier: "Cashier",
    brand: "Brand",
    settings: "Settings",
    traderoom: "Traderoom",
    signedInAs: "Signed in as",
  },
  brand: {
    heading: "Brand",
    lead: "What makes this platform yours. Everything here is a setting, so rebranding is an edit rather than a deploy — and the logo and theme reach the traderoom's engine too, not only these pages.",
    name: "Platform name",
    nameHint: "Shown in the header, the page titles and the emails.",
    supportEmail: "Support address",
    accent: "Accent colour",
    accentHint: "Buttons, links and the active state throughout the platform.",
    accentSample: "Button",
    theme: "Traderoom theme",
    themeHint: "The engine carries four. This is what the chart and the panels around it look like when someone opens the traderoom.",
    themes: { black: "Black", white: "White", blue: "Blue", grey: "Grey" },
    logo: "Logo",
    logoBig: "Large logo",
    icon: "Tab icon",
    tagline: "Tagline",
    taglineHint: "The headline a shared link shows, above the platform's name.",
    description: "Description",
    descriptionHint: "The sentence search results and link previews show.",
    siteUrl: "Address",
    siteUrlHint: "Where this platform lives, for the canonical and the link preview. Empty leaves both out, which is better than pointing at the wrong host.",
    preview: "What a shared link shows",
    usingBuilt: "Using the built-in logo",
    chooseFile: "Upload an image",
    revert: "Use the built-in one",
    reachNote: "PNG, JPG or SVG, up to 2 MB. An SVG carrying script is refused rather than cleaned. The traderoom reads its logo from the same place, so a change here reaches the chart's corner within a reload.",
    saved: "Saved.",
    saveFailed: "Could not save that.",
    uploadFailed: "Could not upload that image.",
  },
  common: {
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    unreachable: "Could not reach the server.",
    refused: "The change was refused.",
    saved: "Saved.",
  },
  overview: {
    heading: "Overview",
    lead: "What the platform is currently serving.",
    instrumentsEnabled: "Instruments enabled",
    instrumentsNote: (live, synthetic) => `${live} with a live feed, ${synthetic} on the synthetic curve`,
    accounts: "Accounts",
    deals: "Deals",
    dealsNote: "running / settled",
    marketFeed: "Market feed",
    serving: (n) => `Serving ${n} instruments`,
    checking: "Checking…",
    notAnswering: "Not answering",
    startItWith: "Start it with",
    feedUnreachable: "Could not reach the feed.",
    reloadRefused: "The feed refused the reload.",
    reload: "Reload the catalogue",
    reloading: "Reloading…",
    feedNote: "The feed reads the instrument catalogue when it starts. It shares this database but not this process, so an instrument changed here is invisible there until it is asked to look again.",
    engine: "Engine",
    feed: "Feed",
    engineBuild: "Engine build",
    brand: "Brand",
    countryReported: "Country reported",
    theseLiveIn: "These live in",
    settingsLink: "settings",
    catalogue: (assets, groups) => `${assets} instruments in ${groups} groups.`,
    liveFeeds: "Live feeds",
    noFeed: "No feed",
  },
  assets: {
    heading: "Instruments",
    lead: "What the platform offers, and where each one's prices come from.",
    deleteNote: "Disabling takes an instrument off the platform without losing it, and is the one to reach for. The id is the `active_id` the engine knows.",
    binance: "Binance",
    synthetic: "Synthetic",
    id: "Id",
    ticker: "Ticker",
    name: "Name",
    group: "Group",
    source: "Source",
    precision: "Precision",
    payout: "Payout",
    priority: "Priority",
    enable: "Enable",
    disable: "Disable",
    savedReloadBefore: "Saved. The running feed still has the old catalogue — reload it from the",
    overviewLink: "overview",
    savedReloadAfter: "for this to reach the traderoom.",
  },
  deals: {
    heading: "Deals",
    running: "Running",
    settled: "Settled",
    instrument: "Instrument",
    showAll: "Show all",
    older: "Older →",
    none: "No deals match this filter.",
    staked: "Staked, still running",
    paidOut: "Paid out beyond stakes",
    kept: "Kept by the platform",
    deal: "Deal",
    account: "Account",
    side: "Side",
    stake: "Stake",
    opened: "Opened",
    expiry: "Expiry",
    quotes: "Quotes",
    outcome: "Outcome",
    call: "call",
    put: "put",
    win: "won",
    loss: "lost",
    refunded: "refunded",
    inProgress: "running",
    lead: "Every binary option bought on the platform, running and settled.",
    filteredTo: (account) => `Filtered to account ${account}.`,
    all: "All",
    count: (n) => `${n} deal${n === 1 ? "" : "s"}`,
    newer: "← Newer",
    pageOf: (page, pages) => `Page ${page} of ${pages}`,
  },
  content: {
    heading: "Content",
    lead: "What the traderoom's left-hand panels show: webinars, tutorials, help and promos. An item with no language is shown in all three.",
    everyPanel: "Every panel",
    newItem: "Write a new item",
    reReads: "The traderoom re-reads these about once a minute.",
    panel: "Panel",
    language: "Language",
    allLanguages: "All languages",
    group: "Group",
    groupHint: "Group — Help draws its categories from this, and so does the video library",
    title: "Title",
    summary: "Summary — the line under the title in a list",
    body: "Body — shown when the item is opened",
    picture: "Picture URL",
    link: "Link — where it opens",
    author: "Presenter or source",
    minutes: "Minutes — webinars and tutorials",
    starts: "Starts — a webinar's time, a news item's date",
    stops: "Stops being shown — leave empty to never expire",
    priority: "Priority — higher sits nearer the top",
    shown: "Shown",
    shownHint: "Shown in the traderoom",
    empty: "Nothing written yet. The traderoom shows its empty state for this panel.",
    panels: { WEBINAR: "Webinars", TUTORIAL: "Video Tutorials", HELP: "Help", PROMO: "Promo" },
    startsShort: "Starts",
    priorityShort: "Priority",
    yes: "yes",
    no: "no",
    allShort: "all",
    saving: "Saving…",
    saveFailed: "Could not save that.",
    deleteFailed: "Could not delete that.",
  },
  promo: {
    heading: "Promo codes",
    lead: "What the traderoom's Promo panel offers. Applying a code records that it was used; paying a bonus out needs the cashier, which is not connected.",
    newCode: "New code",
    applyNote: "Applying a code records that it was used. Nothing pays a bonus out yet.",
    code: "Code",
    kind: "Kind",
    title: "Title",
    oneLine: "One line, for the list",
    longDescription: "The long description",
    steps: "Steps — JSON",
    details: "Details — JSON",
    stops: "Stops being offered",
    offered: "Offered",
    offeredHint: "Offered in the traderoom",
    used: "Used",
    ends: "Ends",
    never: "never",
    none: "No codes yet.",
    kinds: { deposit_bonus: "Deposit bonus", higher_payouts: "Higher payouts" },
    yes: "yes",
    no: "no",
    saving: "Saving…",
    saveFailed: "Could not save that.",
    deleteFailed: "Could not delete that.",
    titleExample: "Bonus up to 100%",
  },
  cashier: {
    heading: "Cashier",
    lead: "Deposits and withdrawals waiting on a decision. No payment provider is connected, so approving a deposit is the statement that the money arrived — nothing here checks that it did.",
    waiting: (n) => `Waiting (${n})`,
    nothingToSettle: "Nothing to settle.",
    settled: "Settled",
    nothingSettled: "Nothing settled yet.",
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    to: "To",
    notePlaceholder: "A note, for whoever reads this later",
    approve: "Approve",
    reject: "Reject",
    credits: "credits the wallet",
    refunds: "refunds the wallet",
    movesNothing: "moves no money",
    alreadyLeft: "money already left",
    kind: "Kind",
    amount: "Amount",
    account: "Account",
    method: "Method",
    outcome: "Outcome",
    when: "When",
    note: "Note",
    settleFailed: "Could not settle that one.",
    approved: "approved",
    rejected: "rejected",
  },
  settings: {
    heading: "Settings",
    lead: "Configuration the platform reads at runtime. The traderoom picks these up on its next load; the market feed needs a catalogue reload.",
    revert: "Revert",
    badJson: "That is not valid JSON.",
    changedAt: (when) => `changed ${when}`,
    saving: "Saving…",
  },
};

const pt: AdminCopy = {
  shell: {
    title: "Administração",
    overview: "Visão geral",
    instruments: "Instrumentos",
    deals: "Negócios",
    content: "Conteúdo",
    promo: "Promoções",
    cashier: "Caixa",
    brand: "Marca",
    settings: "Configurações",
    traderoom: "Traderoom",
    signedInAs: "Conectado como",
  },
  brand: {
    heading: "Marca",
    lead: "O que faz esta plataforma ser sua. Tudo aqui é configuração, então trocar a marca é uma edição e não um deploy — e o logo e o tema chegam também ao engine do traderoom, não só a estas páginas.",
    name: "Nome da plataforma",
    nameHint: "Aparece no cabeçalho, nos títulos das páginas e nos e-mails.",
    supportEmail: "E-mail de suporte",
    accent: "Cor de destaque",
    accentHint: "Botões, links e o estado ativo em toda a plataforma.",
    accentSample: "Botão",
    theme: "Tema do traderoom",
    themeHint: "O engine traz quatro. É assim que o gráfico e os painéis ao redor aparecem quando alguém abre o traderoom.",
    themes: { black: "Preto", white: "Branco", blue: "Azul", grey: "Cinza" },
    logo: "Logo",
    logoBig: "Logo grande",
    icon: "Ícone da aba",
    tagline: "Chamada",
    taglineHint: "O título que um link compartilhado mostra, acima do nome da plataforma.",
    description: "Descrição",
    descriptionHint: "A frase que aparece nos resultados de busca e na prévia de links.",
    siteUrl: "Endereço",
    siteUrlHint: "Onde esta plataforma fica, para o canonical e a prévia de link. Vazio deixa os dois de fora, o que é melhor do que apontar para o host errado.",
    preview: "O que um link compartilhado mostra",
    usingBuilt: "Usando o logo original",
    chooseFile: "Enviar uma imagem",
    revert: "Voltar ao original",
    reachNote: "PNG, JPG ou SVG, até 2 MB. Um SVG com script é recusado, não limpo. O traderoom lê o logo do mesmo lugar, então a troca aqui chega ao canto do gráfico no próximo carregamento.",
    saved: "Salvo.",
    saveFailed: "Não foi possível salvar.",
    uploadFailed: "Não foi possível enviar a imagem.",
  },
  common: {
    edit: "Editar",
    save: "Salvar",
    cancel: "Cancelar",
    delete: "Apagar",
    unreachable: "Não foi possível falar com o servidor.",
    refused: "A alteração foi recusada.",
    saved: "Salvo.",
  },
  overview: {
    heading: "Visão geral",
    lead: "O que a plataforma está servindo agora.",
    instrumentsEnabled: "Instrumentos ativos",
    instrumentsNote: (live, synthetic) => `${live} com feed ao vivo, ${synthetic} na curva sintética`,
    accounts: "Contas",
    deals: "Negócios",
    dealsNote: "em aberto / liquidados",
    marketFeed: "Feed de mercado",
    serving: (n) => `Servindo ${n} instrumentos`,
    checking: "Verificando…",
    notAnswering: "Sem resposta",
    startItWith: "Suba com",
    feedUnreachable: "Não foi possível falar com o feed.",
    reloadRefused: "O feed recusou a recarga.",
    reload: "Recarregar o catálogo",
    reloading: "Recarregando…",
    feedNote: "O feed lê o catálogo de instrumentos quando sobe. Ele compartilha este banco, mas não este processo — então um instrumento alterado aqui fica invisível lá até alguém mandar ele olhar de novo.",
    engine: "Engine",
    feed: "Feed",
    engineBuild: "Build do engine",
    brand: "Marca",
    countryReported: "País informado",
    theseLiveIn: "Isto fica em",
    settingsLink: "configurações",
    catalogue: (assets, groups) => `${assets} instrumentos em ${groups} grupos.`,
    liveFeeds: "Feeds ao vivo",
    noFeed: "Sem feed",
  },
  assets: {
    heading: "Instrumentos",
    lead: "O que a plataforma oferece, e de onde vem o preço de cada um.",
    deleteNote: "Desativar tira o instrumento da plataforma sem perdê-lo, e é o que você quer na maioria das vezes. O id é o `active_id` que o engine conhece.",
    binance: "Binance",
    synthetic: "Sintético",
    id: "Id",
    ticker: "Símbolo",
    name: "Nome",
    group: "Grupo",
    source: "Origem",
    precision: "Precisão",
    payout: "Retorno",
    priority: "Prioridade",
    enable: "Ativar",
    disable: "Desativar",
    savedReloadBefore: "Salvo. O feed em execução ainda tem o catálogo antigo — recarregue pelo",
    overviewLink: "resumo",
    savedReloadAfter: "para isso chegar à sala de operações.",
  },
  deals: {
    heading: "Negócios",
    running: "Em aberto",
    settled: "Liquidados",
    instrument: "Instrumento",
    showAll: "Ver todos",
    older: "Mais antigos →",
    none: "Nenhum negócio com esse filtro.",
    staked: "Apostado, ainda correndo",
    paidOut: "Pago além das apostas",
    kept: "Retido pela plataforma",
    deal: "Negócio",
    account: "Conta",
    side: "Direção",
    stake: "Valor",
    opened: "Aberto",
    expiry: "Vencimento",
    quotes: "Cotações",
    outcome: "Resultado",
    call: "alta",
    put: "baixa",
    win: "ganho",
    loss: "perda",
    refunded: "devolvido",
    inProgress: "em aberto",
    lead: "Toda opção binária comprada na plataforma, em aberto e liquidada.",
    filteredTo: (account) => `Filtrado pela conta ${account}.`,
    all: "Todos",
    count: (n) => `${n} ${n === 1 ? "negócio" : "negócios"}`,
    newer: "← Mais recentes",
    pageOf: (page, pages) => `Página ${page} de ${pages}`,
  },
  content: {
    heading: "Conteúdo",
    lead: "O que os painéis da esquerda do traderoom mostram: webinars, tutoriais, ajuda e promoções. Um item sem idioma aparece nos três.",
    everyPanel: "Todos os painéis",
    newItem: "Escrever um item",
    reReads: "O traderoom relê isto mais ou menos a cada minuto.",
    panel: "Painel",
    language: "Idioma",
    allLanguages: "Todos os idiomas",
    group: "Grupo",
    groupHint: "Grupo — a Ajuda monta as categorias a partir daqui, e a biblioteca de vídeos também",
    title: "Título",
    summary: "Resumo — a linha abaixo do título numa lista",
    body: "Corpo — aparece quando o item é aberto",
    picture: "URL da imagem",
    link: "Link — para onde abre",
    author: "Apresentador ou fonte",
    minutes: "Minutos — webinars e tutoriais",
    starts: "Começa — a hora de um webinar, a data de uma notícia",
    stops: "Deixa de aparecer — vazio nunca expira",
    priority: "Prioridade — maior fica mais acima",
    shown: "Aparece",
    shownHint: "Aparece no traderoom",
    empty: "Nada escrito ainda. O traderoom mostra o estado vazio desse painel.",
    panels: { WEBINAR: "Webinars", TUTORIAL: "Vídeo Tutoriais", HELP: "Ajuda", PROMO: "Promoção" },
    startsShort: "Começa",
    priorityShort: "Prioridade",
    yes: "sim",
    no: "não",
    allShort: "todos",
    saving: "Salvando…",
    saveFailed: "Não foi possível salvar.",
    deleteFailed: "Não foi possível apagar.",
  },
  promo: {
    heading: "Códigos promocionais",
    lead: "O que o painel de Promoção do traderoom oferece. Aplicar um código registra o uso; pagar o bônus depende do caixa, que não está conectado.",
    newCode: "Novo código",
    applyNote: "Aplicar um código registra que ele foi usado. Nada paga bônus ainda.",
    code: "Código",
    kind: "Tipo",
    title: "Título",
    oneLine: "Uma linha, para a lista",
    longDescription: "A descrição longa",
    steps: "Passos — JSON",
    details: "Detalhes — JSON",
    stops: "Deixa de ser oferecido",
    offered: "Oferecido",
    offeredHint: "Oferecido no traderoom",
    used: "Usos",
    ends: "Termina",
    never: "nunca",
    none: "Nenhum código ainda.",
    kinds: { deposit_bonus: "Bônus de depósito", higher_payouts: "Payout maior" },
    yes: "sim",
    no: "não",
    saving: "Salvando…",
    saveFailed: "Não foi possível salvar.",
    deleteFailed: "Não foi possível apagar.",
    titleExample: "Bônus de até 100%",
  },
  cashier: {
    heading: "Caixa",
    lead: "Depósitos e saques esperando decisão. Nenhum provedor de pagamento está conectado, então aprovar um depósito é a afirmação de que o dinheiro chegou — nada aqui verifica que chegou.",
    waiting: (n) => `Esperando (${n})`,
    nothingToSettle: "Nada a resolver.",
    settled: "Resolvidos",
    nothingSettled: "Nada resolvido ainda.",
    deposit: "Depósito",
    withdrawal: "Saque",
    to: "Para",
    notePlaceholder: "Uma observação, para quem ler isto depois",
    approve: "Aprovar",
    reject: "Recusar",
    credits: "credita a carteira",
    refunds: "estorna a carteira",
    movesNothing: "não move dinheiro",
    alreadyLeft: "o dinheiro já saiu",
    kind: "Tipo",
    amount: "Valor",
    account: "Conta",
    method: "Método",
    outcome: "Resultado",
    when: "Quando",
    note: "Observação",
    settleFailed: "Não foi possível resolver esse.",
    approved: "aprovado",
    rejected: "recusado",
  },
  settings: {
    heading: "Configurações",
    lead: "Configuração que a plataforma lê em tempo de execução. O traderoom pega no próximo carregamento; o feed de mercado precisa de uma recarga do catálogo.",
    revert: "Desfazer",
    badJson: "Isso não é JSON válido.",
    changedAt: (when) => `alterado em ${when}`,
    saving: "Salvando…",
  },
};

const es: AdminCopy = {
  shell: {
    title: "Administración",
    overview: "Resumen",
    instruments: "Instrumentos",
    deals: "Operaciones",
    content: "Contenido",
    promo: "Promociones",
    cashier: "Caja",
    brand: "Marca",
    settings: "Ajustes",
    traderoom: "Traderoom",
    signedInAs: "Conectado como",
  },
  brand: {
    heading: "Marca",
    lead: "Lo que hace que esta plataforma sea tuya. Todo aquí es un ajuste, así que cambiar la marca es una edición y no un despliegue — y el logo y el tema llegan también al motor del traderoom, no solo a estas páginas.",
    name: "Nombre de la plataforma",
    nameHint: "Aparece en la cabecera, en los títulos de las páginas y en los correos.",
    supportEmail: "Correo de soporte",
    accent: "Color de acento",
    accentHint: "Botones, enlaces y el estado activo en toda la plataforma.",
    accentSample: "Botón",
    theme: "Tema del traderoom",
    themeHint: "El motor trae cuatro. Así se ven el gráfico y los paneles que lo rodean cuando alguien abre el traderoom.",
    themes: { black: "Negro", white: "Blanco", blue: "Azul", grey: "Gris" },
    logo: "Logo",
    logoBig: "Logo grande",
    icon: "Icono de la pestaña",
    tagline: "Lema",
    taglineHint: "El titular que muestra un enlace compartido, sobre el nombre de la plataforma.",
    description: "Descripción",
    descriptionHint: "La frase que muestran los resultados de búsqueda y la vista previa de enlaces.",
    siteUrl: "Dirección",
    siteUrlHint: "Dónde vive esta plataforma, para el canonical y la vista previa. Vacío deja los dos fuera, que es mejor que apuntar al host equivocado.",
    preview: "Lo que muestra un enlace compartido",
    usingBuilt: "Usando el logo original",
    chooseFile: "Subir una imagen",
    revert: "Volver al original",
    reachNote: "PNG, JPG o SVG, hasta 2 MB. Un SVG con script se rechaza, no se limpia. El traderoom lee su logo del mismo sitio, así que el cambio llega a la esquina del gráfico en la siguiente carga.",
    saved: "Guardado.",
    saveFailed: "No se pudo guardar.",
    uploadFailed: "No se pudo subir la imagen.",
  },
  common: {
    edit: "Editar",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    unreachable: "No se pudo contactar con el servidor.",
    refused: "El cambio fue rechazado.",
    saved: "Guardado.",
  },
  overview: {
    heading: "Resumen",
    lead: "Lo que la plataforma está sirviendo ahora.",
    instrumentsEnabled: "Instrumentos activos",
    instrumentsNote: (live, synthetic) => `${live} con feed en vivo, ${synthetic} en la curva sintética`,
    accounts: "Cuentas",
    deals: "Operaciones",
    dealsNote: "abiertas / liquidadas",
    marketFeed: "Feed de mercado",
    serving: (n) => `Sirviendo ${n} instrumentos`,
    checking: "Comprobando…",
    notAnswering: "Sin respuesta",
    startItWith: "Arráncalo con",
    feedUnreachable: "No se pudo contactar con el feed.",
    reloadRefused: "El feed rechazó la recarga.",
    reload: "Recargar el catálogo",
    reloading: "Recargando…",
    feedNote: "El feed lee el catálogo de instrumentos al arrancar. Comparte esta base de datos pero no este proceso, así que un instrumento cambiado aquí es invisible allí hasta que se le pide mirar de nuevo.",
    engine: "Motor",
    feed: "Feed",
    engineBuild: "Build del motor",
    brand: "Marca",
    countryReported: "País informado",
    theseLiveIn: "Esto vive en",
    settingsLink: "ajustes",
    catalogue: (assets, groups) => `${assets} instrumentos en ${groups} grupos.`,
    liveFeeds: "Feeds en vivo",
    noFeed: "Sin feed",
  },
  assets: {
    heading: "Instrumentos",
    lead: "Lo que la plataforma ofrece, y de dónde viene el precio de cada uno.",
    deleteNote: "Desactivar quita el instrumento de la plataforma sin perderlo, y es lo que suele querer. El id es el `active_id` que conoce el motor.",
    binance: "Binance",
    synthetic: "Sintético",
    id: "Id",
    ticker: "Símbolo",
    name: "Nombre",
    group: "Grupo",
    source: "Origen",
    precision: "Precisión",
    payout: "Retorno",
    priority: "Prioridad",
    enable: "Activar",
    disable: "Desactivar",
    savedReloadBefore: "Guardado. El feed en ejecución todavía tiene el catálogo antiguo — recárguelo desde el",
    overviewLink: "resumen",
    savedReloadAfter: "para que esto llegue a la sala de operaciones.",
  },
  deals: {
    heading: "Operaciones",
    running: "Abiertas",
    settled: "Liquidadas",
    instrument: "Instrumento",
    showAll: "Ver todas",
    older: "Más antiguas →",
    none: "Ninguna operación con ese filtro.",
    staked: "Apostado, todavía abierto",
    paidOut: "Pagado por encima de las apuestas",
    kept: "Retenido por la plataforma",
    deal: "Operación",
    account: "Cuenta",
    side: "Dirección",
    stake: "Importe",
    opened: "Abierta",
    expiry: "Vencimiento",
    quotes: "Cotizaciones",
    outcome: "Resultado",
    call: "alza",
    put: "baja",
    win: "ganada",
    loss: "perdida",
    refunded: "devuelta",
    inProgress: "abierta",
    lead: "Cada opción binaria comprada en la plataforma, abierta y liquidada.",
    filteredTo: (account) => `Filtrado por la cuenta ${account}.`,
    all: "Todas",
    count: (n) => `${n} ${n === 1 ? "operación" : "operaciones"}`,
    newer: "← Más recientes",
    pageOf: (page, pages) => `Página ${page} de ${pages}`,
  },
  content: {
    heading: "Contenido",
    lead: "Lo que muestran los paneles de la izquierda del traderoom: webinars, tutoriales, ayuda y promociones. Un elemento sin idioma aparece en los tres.",
    everyPanel: "Todos los paneles",
    newItem: "Escribir un elemento",
    reReads: "El traderoom relee esto más o menos cada minuto.",
    panel: "Panel",
    language: "Idioma",
    allLanguages: "Todos los idiomas",
    group: "Grupo",
    groupHint: "Grupo — la Ayuda arma sus categorías desde aquí, y la biblioteca de vídeos también",
    title: "Título",
    summary: "Resumen — la línea bajo el título en una lista",
    body: "Cuerpo — aparece cuando se abre el elemento",
    picture: "URL de la imagen",
    link: "Enlace — adónde abre",
    author: "Presentador o fuente",
    minutes: "Minutos — webinars y tutoriales",
    starts: "Empieza — la hora de un webinar, la fecha de una noticia",
    stops: "Deja de aparecer — vacío nunca caduca",
    priority: "Prioridad — mayor queda más arriba",
    shown: "Aparece",
    shownHint: "Aparece en el traderoom",
    empty: "Nada escrito todavía. El traderoom muestra el estado vacío de ese panel.",
    panels: { WEBINAR: "Webinars", TUTORIAL: "Vídeo Tutoriales", HELP: "Ayuda", PROMO: "Promoción" },
    startsShort: "Empieza",
    priorityShort: "Prioridad",
    yes: "sí",
    no: "no",
    allShort: "todos",
    saving: "Guardando…",
    saveFailed: "No se pudo guardar.",
    deleteFailed: "No se pudo eliminar.",
  },
  promo: {
    heading: "Códigos promocionales",
    lead: "Lo que ofrece el panel de Promoción del traderoom. Aplicar un código registra su uso; pagar el bono depende de la caja, que no está conectada.",
    newCode: "Nuevo código",
    applyNote: "Aplicar un código registra que se usó. Todavía nada paga un bono.",
    code: "Código",
    kind: "Tipo",
    title: "Título",
    oneLine: "Una línea, para la lista",
    longDescription: "La descripción larga",
    steps: "Pasos — JSON",
    details: "Detalles — JSON",
    stops: "Deja de ofrecerse",
    offered: "Ofrecido",
    offeredHint: "Ofrecido en el traderoom",
    used: "Usos",
    ends: "Termina",
    never: "nunca",
    none: "Ningún código todavía.",
    kinds: { deposit_bonus: "Bono de depósito", higher_payouts: "Payout mayor" },
    yes: "sí",
    no: "no",
    saving: "Guardando…",
    saveFailed: "No se pudo guardar.",
    deleteFailed: "No se pudo eliminar.",
    titleExample: "Bono de hasta 100%",
  },
  cashier: {
    heading: "Caja",
    lead: "Depósitos y retiradas esperando una decisión. No hay proveedor de pago conectado, así que aprobar un depósito es la afirmación de que el dinero llegó — nada aquí comprueba que llegó.",
    waiting: (n) => `Esperando (${n})`,
    nothingToSettle: "Nada que resolver.",
    settled: "Resueltos",
    nothingSettled: "Nada resuelto todavía.",
    deposit: "Depósito",
    withdrawal: "Retirada",
    to: "Para",
    notePlaceholder: "Una nota, para quien lea esto después",
    approve: "Aprobar",
    reject: "Rechazar",
    credits: "acredita la cartera",
    refunds: "devuelve a la cartera",
    movesNothing: "no mueve dinero",
    alreadyLeft: "el dinero ya salió",
    kind: "Tipo",
    amount: "Importe",
    account: "Cuenta",
    method: "Método",
    outcome: "Resultado",
    when: "Cuándo",
    note: "Nota",
    settleFailed: "No se pudo resolver ese.",
    approved: "aprobado",
    rejected: "rechazado",
  },
  settings: {
    heading: "Ajustes",
    lead: "Configuración que la plataforma lee en tiempo de ejecución. El traderoom la toma en su siguiente carga; el feed de mercado necesita una recarga del catálogo.",
    revert: "Deshacer",
    badJson: "Eso no es JSON válido.",
    changedAt: (when) => `cambiado el ${when}`,
    saving: "Guardando…",
  },
};

const DICTIONARIES: Record<AvalonLocale, AdminCopy> = { en, pt, es };

/** The copy for one locale, falling back to English for an unknown one. */
export function adminCopy(locale: string): AdminCopy {
  return DICTIONARIES[locale as AvalonLocale] ?? en;
}
