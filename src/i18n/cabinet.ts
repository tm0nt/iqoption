/**
 * Copy for the cabinet — everything outside the traderoom's canvas.
 *
 * Where a term already exists in the platform's own dictionary, that wording
 * is used rather than a fresh translation: `Depositar`, `Retirar fundos`,
 * `Histórico de trading` are the brand's words, taken from
 * `public/engine-host/stubs/lang-route-translations.{pt,es}.json`, so a person
 * moving between the traderoom and the cabinet reads one voice and not two.
 *
 * Terms the engine has no entry for — the profile sub-pages, mostly — are
 * marked below, because they were written here rather than read from the
 * platform and are the ones to check against the live site when someone next
 * has it open.
 */
import type { AvalonLocale } from "@/types/avalon-login";

/** The shape every locale fills. English is the source the others answer. */
export type CabinetCopy = {
  nav: {
    personalData: string;
    verification: string;
    portfolio: string;
    withdrawFunds: string;
    balanceHistory: string;
    tradingHistory: string;
    deposit: string;
    tradeNow: string;
    logOut: string;
    addPersonalInfo: string;
    accountMenu: string;
    closeMenu: string;
    close: string;
  };
  profile: {
    /** Not in the engine dictionary — written here. */
    notificationSettings: string;
    accountSettings: string;
    socialNetworks: string;
    paymentMethods: string;
    safetySecurity: string;
    dateRegistered: string;
    profileId: string;
  };
  account: {
    real: string;
    practice: string;
  };
  /** The notification page: four switches and the list under the first. */
  notifications: {
    emailTitle: string;
    emailBody: string;
    pushTitle: string;
    pushBody: string;
    pushAside: string;
    callsTitle: string;
    callsBody: string;
    consentTitle: string;
    consentBody: string;
    topics: Record<string, string>;
  };
  /** Account Settings, including the three it can do to the account itself. */
  settings: {
    publicTitle: string;
    publicBody: string;
    nameOnPlatform: string;
    pickAnother: string;
    additional: string;
    resetTitle: string;
    resetBody: string;
    resetAction: string;
    resetConfirm: string;
    resetDone: string;
    closeTitle: string;
    closeBody: string;
    closeAction: string;
    closeConfirm: string;
    closeDone: string;
    deleteTitle: string;
    deleteBody: string;
    deleteNote: string;
    deleteAction: string;
    deleteConfirm: string;
    deleteDone: string;
    deleteOnFile: string;
    saveFailed: string;
  };
  socials: {
    body: string;
    notLinked: string;
    unavailable: string;
    unavailableWhy: string;
  };
  payments: {
    linkedCards: string;
    noCards: string;
    noCardsBody: string;
    recent: string;
    noData: string;
    noDataBody: string;
    byHand: string;
    payments: (n: number) => string;
  };
  security: {
    twoStepTitle: string;
    twoStepBody: string;
    twoStepUnavailable: string;
    passwordTitle: string;
    passwordBody: string;
    passwordAction: string;
    sessionsTitle: string;
    sessionsBody: string;
    noSessions: string;
    endSession: string;
    endFailed: string;
    thisDevice: string;
    historyTitle: string;
    historyBody: string;
    historyNote: string;
  };
  /** Balance History and Trading History, which share a vocabulary. */
  history: {
    noData: string;
    noDataHint: string;
    date: string;
    status: string;
    currency: string;
    transactionType: string;
    allTypes: string;
    allStatuses: string;
    allCurrencies: string;
    deposits: string;
    withdrawals: string;
    trades: string;
    pending: string;
    approved: string;
    rejected: string;
    open: string;
    settled: string;
    /** One status value, as the database spells it. */
    statusOf: (value: string) => string;
    accountType: string;
    allAccounts: string;
    real: string;
    practice: string;
    instrument: string;
    allInstruments: string;
    binary: string;
    turbo: string;
    blitz: string;
    totalNetProfit: string;
    periodData: string;
  };
  /** The cashier: paying in and taking out. */
  cashier: {
    depositAmount: string;
    currency: string;
    promotion: string;
    promoPlaceholder: string;
    apply: string;
    onePerDeposit: string;
    acceptTerms: string;
    terms: string;
    proceed: string;
    sending: string;
    encrypted: string;
    noMethods: string;
    noPromotions: string;
    refused: string;
    unreachable: string;
    walletAddress: string;
    requestWithdrawal: string;
    noWithdrawMethods: string;
    requestRefused: string;
    emptyBalance: string;
    deposit: string;
  };
  portfolio: {
    totalEquity: string;
    estimatedValue: string;
    totalInvestment: string;
    totalGrossProfit: string;
    withdrawFunds: string;
    topAssets: string;
    topAssetsDown: string;
    all: string;
    crypto: string;
    forex: string;
    stocks: string;
    indices: string;
    gainers: string;
    losers: string;
    perWeek: string;
    previous: string;
    next: string;
  };
  verification: {
    title: string;
    emailStep: string;
    detailsStep: string;
    identityStep: string;
    identityPending: string;
    uploadMissing: string;
    personalInfo: string;
    residenceInfo: string;
    exactlyAsId: string;
    checkResidence: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    datePlaceholder: string;
    citizenship: string;
    usPerson: string;
    refresh: string;
  };
  /** The deposit page's question list, and the one label the methods carry. */
  faq: {
    heading: string;
    businessDays: string;
    items: { q: string; a: string }[];
  };
  /** Personal Data, the portfolio's empty state and two footnotes. */
  personal: {
    changePhoto: string;
    uploadPhoto: string;
    photoNote: string;
    statement: string;
    statementBody: string;
    createRequest: string;
    emailAddress: string;
    emailNote: string;
    changeEmail: string;
    contactInfo: string;
    noContact: string;
    verifyPrompt: string;
    rectify: string;
    byCategory: string;
    accessMyData: string;
    showMyData: string;
    noOpenPositions: string;
    start: string;
    bestExperience: string;
    entries: (n: number) => string;
    settledTwice: string;
    freeWithdrawals: (n: number) => string;
    /** Table headers and the odd standalone label. */
    balanceOf: (currency: string) => string;
    amountIn: (currency: string) => string;
    done: string;
    requested: string;
    method: string;
    destination: string;
    when: string;
    what: string;
    reference: string;
    amount: string;
    /** One row of the balance history, by the key the reader hands over. */
    entryOf: (key: string) => string;
  };
};

const en: CabinetCopy = {
  nav: {
    personalData: "Personal Data",
    verification: "Verification",
    portfolio: "Portfolio",
    withdrawFunds: "Withdraw Funds",
    balanceHistory: "Balance History",
    tradingHistory: "Trading History",
    deposit: "Deposit",
    tradeNow: "Trade Now",
    logOut: "Log Out",
    addPersonalInfo: "Add personal info",
    accountMenu: "Account menu",
    closeMenu: "Close menu",
    close: "Close",
  },
  profile: {
    notificationSettings: "Notification Settings",
    accountSettings: "Account Settings",
    socialNetworks: "Social Networks",
    paymentMethods: "Payment Methods",
    safetySecurity: "Safety & Security",
    dateRegistered: "Date registered",
    profileId: "Profile ID",
  },
  account: {
    real: "Real account",
    practice: "Practice account",
  },
  notifications: {
    emailTitle: "Email Notifications",
    emailBody: "Receive emails about new platform features and big events",
    pushTitle: "Push Notifications",
    pushBody: "Get push notifications about the latest trading news.",
    pushAside: "By turning off push notifications, you're missing out on important market news alerts in the Avalon Mobile App.",
    callsTitle: "Phone calls & SMS",
    callsBody: "Receive calls and SMS from our support team about special offers.",
    consentTitle: "Communication of Data",
    consentBody: "I hereby consent to the processing of my personal information by Avalon and its partners and related entities for marketing purposes which shall include in particular communicating with me to inform me about its products and/or services and/or offers as described above for the purpose of a more tailored marketing experience.",
    topics: {
      promotions: "Promotions",
      systemNews: "System news",
      analytics: "Analytical reports",
      product: "Product updates",
      education: "Education & trading insights",
      offers: "Special offers & bonuses",
      tournaments: "Tournaments",
      marketNews: "Market News",
    },
  },
  settings: {
    publicTitle: "Using Public Profile",
    publicBody: "You can pick a generated name that will be displayed in the trading statistics on the platform.",
    nameOnPlatform: "Name on the platform",
    pickAnother: "Pick another name",
    additional: "Additional settings",
    resetTitle: "Reset",
    resetBody: "If you have problems using our trading platform, please try resetting your settings. After resetting, all settings will have default values.",
    resetAction: "Reset settings",
    resetConfirm: "Reset every platform setting to its default?",
    resetDone: "Your platform settings are back to their defaults.",
    closeTitle: "Temporary Closing of Account",
    closeBody: "You can temporarily close your account. Once your account is closed, you will not be able to log in or make transactions. You can reopen your account by contacting our Support Team.",
    closeAction: "Close account",
    closeConfirm: "Close your account? You will be signed out and cannot log back in without support.",
    closeDone: "Your account is closed. Contact support to reopen it.",
    deleteTitle: "Deletion of Account and Personal Data",
    deleteBody: "Deletion of your account and all personal data is permanent. You will not be able to access your account, trade, or make use of any of the Avalon services.",
    deleteNote: "NOTE: Prior to submitting your personal data deletion request, you need to close any remaining open positions and pending orders.",
    deleteAction: "Request Deletion",
    deleteConfirm: "Request deletion of your account and personal data?",
    deleteDone: "Your deletion request has been recorded.",
    deleteOnFile: "A deletion request is already on file.",
    saveFailed: "could not save that",
  },
  socials: {
    body: "You can use your social media accounts to log in to our site, as well as to share your trading achievements with your friends.",
    notLinked: "Account not linked",
    unavailable: "Unavailable",
    unavailableWhy: "Signing in with a social account is not set up on this platform. Your account uses the email address and password you registered with.",
  },
  payments: {
    linkedCards: "Linked Bank Cards",
    noCards: "No cards",
    noCardsBody: "You don't have any linked cards yet",
    recent: "Recently Used Methods",
    noData: "No data found",
    noDataBody: "You haven't made any payments yet.",
    byHand: "Deposits and withdrawals are reviewed by hand. No card network is connected, so nothing is charged and no card details are held.",
    payments: (n) => `${n} payment${n === 1 ? "" : "s"}`,
  },
  security: {
    twoStepTitle: "2-Step Authentication",
    twoStepBody: "You will receive an extra confirmation code to log in to your account.",
    twoStepUnavailable: "Not available yet. This account is protected by its password alone.",
    passwordTitle: "Change Password",
    passwordBody: "Choose a new password for your account.",
    passwordAction: "Change password",
    sessionsTitle: "Active Sessions",
    sessionsBody: "Information about the use of your account on other devices. Ending a session stops that device trading straight away.",
    noSessions: "No trading sessions are open.",
    endSession: "End this session",
    endFailed: "could not end that session",
    thisDevice: "this device",
    historyTitle: "Session History",
    historyBody: "This section shows which devices you used to log in and when you logged in. If you suspect that someone else has access to your profile, please consider changing your password.",
    historyNote: "Only sessions that are still open are kept. An expired one is removed rather than recorded.",
  },
  history: {
    noData: "No data found",
    noDataHint: "You may want to select different parameters or change the time period.",
    date: "Date",
    status: "Status",
    currency: "Currency",
    transactionType: "Transaction type",
    allTypes: "All types",
    allStatuses: "All statuses",
    allCurrencies: "All currencies",
    deposits: "Deposits",
    withdrawals: "Withdrawals",
    trades: "Trades",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    open: "Open",
    settled: "Settled",
    statusOf: (value) =>
      ({ pending: "Pending", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled", settled: "Settled", open: "Open" })[value.toLowerCase()] ?? value,
    accountType: "Account type",
    allAccounts: "All accounts",
    real: "Real",
    practice: "Practice",
    instrument: "Trading instrument",
    allInstruments: "All instruments",
    binary: "Binary options",
    turbo: "Turbo options",
    blitz: "Blitz options",
    totalNetProfit: "Total Net Profit",
    periodData: "Data for the selected period",
  },
  cashier: {
    depositAmount: "Deposit amount",
    currency: "Currency",
    promotion: "Promotion",
    promoPlaceholder: "Your promo code",
    apply: "Apply",
    onePerDeposit: "One promo code per deposit",
    acceptTerms: "I hereby accept the",
    terms: "Terms & Conditions",
    proceed: "Proceed to Payment",
    sending: "Sending…",
    encrypted: "Connections to this site are encrypted. No card network is connected yet, and no payment is taken.",
    noMethods: "No deposit methods are configured.",
    noPromotions: "No promotions are running.",
    refused: "The deposit was refused.",
    unreachable: "Could not reach the server.",
    walletAddress: "Wallet address",
    requestWithdrawal: "Request withdrawal",
    noWithdrawMethods: "No withdrawal methods are configured.",
    requestRefused: "The request was refused.",
    emptyBalance: "You cannot withdraw funds because your balance is 0.",
    deposit: "Deposit",
  },
  portfolio: {
    totalEquity: "Total Equity",
    estimatedValue: "Estimated account value",
    totalInvestment: "Total Investment",
    totalGrossProfit: "Total Gross Profit",
    withdrawFunds: "Withdraw funds",
    topAssets: "Top Assets",
    topAssetsDown: "Top assets are unavailable — the market feed is not answering.",
    all: "All",
    crypto: "Crypto",
    forex: "Forex",
    stocks: "Stocks",
    indices: "Indices",
    gainers: "Gainers",
    losers: "Losers",
    perWeek: "Per week",
    previous: "Previous",
    next: "Next",
  },
  verification: {
    title: "Account Verification",
    emailStep: "Email confirmation",
    detailsStep: "Personal Details",
    identityStep: "Proof of Identity",
    identityPending: "Your details are with us. The next step is a photo of an identity document, which a person reads against what you entered.",
    uploadMissing: "Document upload is not built yet. Until it is, an account stays on the practice balance.",
    personalInfo: "Personal info",
    residenceInfo: "Residence info",
    exactlyAsId: "Provide your personal data exactly as it appears on your ID to avoid verification issues in the future.",
    checkResidence: "Please make sure that your residence information is correct.",
    firstName: "First Name",
    lastName: "Last Name",
    dateOfBirth: "Date of Birth",
    datePlaceholder: "dd.mm.yyyy",
    citizenship: "Country of citizenship",
    usPerson: "I am a U.S. citizen or tax resident.",
    refresh: "Refresh",
  },
  faq: {
    heading: "Frequently Asked Questions",
    businessDays: "1 - 3 business days",
    items: [
      {
        q: "How long does a deposit take to arrive?",
        a: "Nothing is charged yet. A deposit here is recorded as pending and the balance only moves once someone approves it, because no payment provider is connected.",
      },
      {
        q: "Why is my balance unchanged after depositing?",
        a: "For the same reason: the request is a record, not a payment. You can see it under Balance History with its status.",
      },
      {
        q: "Which currency is my account in?",
        a: "The one your wallet was opened in. It is shown beside the amount field and cannot be changed from this page.",
      },
      {
        q: "Can I trade while a deposit is pending?",
        a: "Yes, with the balance you already have. A practice balance is funded from the start and is not affected by deposits.",
      },
    ],
  },
  personal: {
    changePhoto: "Change photo",
    uploadPhoto: "+ Upload a photo",
    photoNote: "Your photo will be displayed in direct messages, public chats, and rankings.",
    statement: "Account statement",
    statementBody: "Get detailed information on your trading account for the selected period.",
    createRequest: "Create a request",
    emailAddress: "Email address",
    emailNote: "You can change the email address that your account is linked to.",
    changeEmail: "Change email",
    contactInfo: "Contact info",
    noContact: "You haven't filled in your contact details yet.",
    verifyPrompt: "Please verify your account",
    rectify: "If you would like to rectify and/or manage your data, please contact",
    byCategory: "You can view your personal information that you have provided to us by category.",
    accessMyData: "Access My Data",
    showMyData: "Show my data",
    noOpenPositions: "You don't have any open positions yet. Explore Top Assets and",
    start: "start",
    bestExperience: "the best trading experience ever.",
    entries: (n) => `${n} ${n === 1 ? "entry" : "entries"}.`,
    settledTwice: "A settled deal appears twice: the stake leaving when it opened, and the payout arriving when it closed.",
    freeWithdrawals: (n) => `You have ${n} free withdrawal${n === 1 ? "" : "s"} left until the end of the calendar month.`,
    balanceOf: (c) => `${c} Balance`,
    amountIn: (c) => `Amount (${c})`,
    done: "Done",
    requested: "Requested",
    method: "Method",
    destination: "Destination",
    when: "When",
    what: "What",
    reference: "Reference",
    amount: "Amount",
    entryOf: (key) =>
      ({ deposit: "Deposit", withdrawal: "Withdrawal", tradeOpened: "Trade opened", tradeWon: "Trade won", tradeLost: "Trade lost", tradeRefunded: "Trade refunded" })[key] ?? key,
  },
};

const pt: CabinetCopy = {
  nav: {
    personalData: "Dados pessoais",
    verification: "Verificação",
    portfolio: "Portfólio",
    withdrawFunds: "Retirar fundos",
    balanceHistory: "Histórico do saldo",
    tradingHistory: "Histórico de trading",
    deposit: "Depositar",
    tradeNow: "Negociar agora",
    logOut: "Sair",
    addPersonalInfo: "Adicionar dados pessoais",
    accountMenu: "Menu da conta",
    closeMenu: "Fechar menu",
    close: "Fechar",
  },
  profile: {
    notificationSettings: "Configurações de notificações",
    accountSettings: "Configurações da conta",
    socialNetworks: "Redes sociais",
    paymentMethods: "Métodos de pagamento",
    safetySecurity: "Segurança",
    dateRegistered: "Data de registro",
    profileId: "ID do perfil",
  },
  account: {
    real: "Conta Real",
    practice: "Conta de treinamento",
  },
  notifications: {
    emailTitle: "Notificações por e-mail",
    emailBody: "Receba e-mails sobre novidades da plataforma e eventos importantes",
    pushTitle: "Notificações push",
    pushBody: "Receba notificações push com as últimas notícias do mercado.",
    pushAside: "Ao desligar as notificações push, você deixa de receber alertas importantes do mercado no aplicativo Avalon.",
    callsTitle: "Ligações e SMS",
    callsBody: "Receba ligações e SMS da nossa equipe de suporte sobre ofertas especiais.",
    consentTitle: "Comunicação de dados",
    consentBody: "Autorizo o tratamento dos meus dados pessoais pela Avalon, seus parceiros e empresas relacionadas para fins de marketing, incluindo em particular o contato comigo para me informar sobre seus produtos, serviços e ofertas conforme descrito acima, com o objetivo de oferecer uma experiência mais adequada ao meu perfil.",
    topics: {
      promotions: "Promoções",
      systemNews: "Avisos do sistema",
      analytics: "Relatórios analíticos",
      product: "Novidades do produto",
      education: "Educação e análises de mercado",
      offers: "Ofertas especiais e bônus",
      tournaments: "Torneios",
      marketNews: "Notícias do mercado",
    },
  },
  settings: {
    publicTitle: "Usar perfil público",
    publicBody: "Você pode escolher um nome gerado que aparecerá nas estatísticas de negociação da plataforma.",
    nameOnPlatform: "Nome na plataforma",
    pickAnother: "Sortear outro nome",
    additional: "Outras configurações",
    resetTitle: "Restaurar",
    resetBody: "Se estiver com problemas para usar a plataforma, tente restaurar suas configurações. Depois disso, todas as configurações voltam ao padrão.",
    resetAction: "Restaurar configurações",
    resetConfirm: "Restaurar todas as configurações da plataforma para o padrão?",
    resetDone: "Suas configurações voltaram ao padrão.",
    closeTitle: "Fechamento temporário da conta",
    closeBody: "Você pode fechar sua conta temporariamente. Com a conta fechada, não será possível entrar nem fazer transações. Para reabrir, fale com o nosso suporte.",
    closeAction: "Fechar conta",
    closeConfirm: "Fechar sua conta? Você será desconectado e não conseguirá entrar de novo sem falar com o suporte.",
    closeDone: "Sua conta foi fechada. Fale com o suporte para reabrir.",
    deleteTitle: "Exclusão da conta e dos dados pessoais",
    deleteBody: "A exclusão da sua conta e de todos os dados pessoais é definitiva. Você não poderá mais acessar a conta, negociar, nem usar os serviços da Avalon.",
    deleteNote: "ATENÇÃO: antes de pedir a exclusão dos seus dados, é preciso encerrar as posições abertas e as ordens pendentes.",
    deleteAction: "Pedir exclusão",
    deleteConfirm: "Pedir a exclusão da sua conta e dos seus dados pessoais?",
    deleteDone: "Seu pedido de exclusão foi registrado.",
    deleteOnFile: "Já existe um pedido de exclusão registrado.",
    saveFailed: "não foi possível salvar",
  },
  socials: {
    body: "Você pode usar suas contas de redes sociais para entrar no site e para compartilhar seus resultados com seus amigos.",
    notLinked: "Conta não vinculada",
    unavailable: "Indisponível",
    unavailableWhy: "Entrar com uma rede social não está configurado nesta plataforma. Sua conta usa o e-mail e a senha com que você se cadastrou.",
  },
  payments: {
    linkedCards: "Cartões vinculados",
    noCards: "Nenhum cartão",
    noCardsBody: "Você ainda não tem cartões vinculados",
    recent: "Métodos usados recentemente",
    noData: "Nada encontrado",
    noDataBody: "Você ainda não fez nenhum pagamento.",
    byHand: "Depósitos e saques são conferidos manualmente. Nenhuma bandeira de cartão está conectada, então nada é cobrado e nenhum dado de cartão é guardado.",
    payments: (n) => `${n} pagamento${n === 1 ? "" : "s"}`,
  },
  security: {
    twoStepTitle: "Verificação em duas etapas",
    twoStepBody: "Você receberá um código de confirmação a mais para entrar na sua conta.",
    twoStepUnavailable: "Ainda não disponível. Esta conta é protegida apenas pela senha.",
    passwordTitle: "Alterar senha",
    passwordBody: "Escolha uma nova senha para a sua conta.",
    passwordAction: "Alterar senha",
    sessionsTitle: "Sessões ativas",
    sessionsBody: "Informações sobre o uso da sua conta em outros aparelhos. Encerrar uma sessão impede aquele aparelho de negociar na hora.",
    noSessions: "Nenhuma sessão de negociação aberta.",
    endSession: "Encerrar esta sessão",
    endFailed: "não foi possível encerrar a sessão",
    thisDevice: "este aparelho",
    historyTitle: "Histórico de sessões",
    historyBody: "Esta seção mostra de quais aparelhos você entrou e quando. Se suspeitar que outra pessoa tem acesso ao seu perfil, considere trocar a senha.",
    historyNote: "Só ficam guardadas as sessões ainda abertas. Uma sessão expirada é removida, não registrada.",
  },
  history: {
    noData: "Nada encontrado",
    noDataHint: "Experimente outros filtros ou mude o período.",
    date: "Data",
    status: "Situação",
    currency: "Moeda",
    transactionType: "Tipo de transação",
    allTypes: "Todos os tipos",
    allStatuses: "Todas as situações",
    allCurrencies: "Todas as moedas",
    deposits: "Depósitos",
    withdrawals: "Saques",
    trades: "Negócios",
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Recusada",
    open: "Em aberto",
    settled: "Liquidados",
    statusOf: (value) =>
      ({ pending: "Pendente", approved: "Aprovada", rejected: "Recusada", cancelled: "Cancelada", settled: "Liquidada", open: "Em aberto" })[value.toLowerCase()] ?? value,
    accountType: "Tipo de conta",
    allAccounts: "Todas as contas",
    real: "Real",
    practice: "Treinamento",
    instrument: "Instrumento",
    allInstruments: "Todos os instrumentos",
    binary: "Opções binárias",
    turbo: "Opções turbo",
    blitz: "Opções blitz",
    totalNetProfit: "Lucro líquido total",
    periodData: "Dados do período selecionado",
  },
  cashier: {
    depositAmount: "Valor do depósito",
    currency: "Moeda",
    promotion: "Promoção",
    promoPlaceholder: "Seu código promocional",
    apply: "Aplicar",
    onePerDeposit: "Um código promocional por depósito",
    acceptTerms: "Eu aceito os",
    terms: "Termos e Condições",
    proceed: "Ir para o pagamento",
    sending: "Enviando…",
    encrypted: "As conexões com este site são criptografadas. Nenhuma bandeira de cartão está conectada ainda, e nenhum pagamento é cobrado.",
    noMethods: "Nenhum método de depósito configurado.",
    noPromotions: "Nenhuma promoção em andamento.",
    refused: "O depósito foi recusado.",
    unreachable: "Não foi possível falar com o servidor.",
    walletAddress: "Endereço da carteira",
    requestWithdrawal: "Solicitar saque",
    noWithdrawMethods: "Nenhum método de saque configurado.",
    requestRefused: "A solicitação foi recusada.",
    emptyBalance: "Você não pode sacar porque seu saldo é 0.",
    deposit: "Depositar",
  },
  portfolio: {
    totalEquity: "Patrimônio total",
    estimatedValue: "Valor estimado da conta",
    totalInvestment: "Total investido",
    totalGrossProfit: "Lucro bruto total",
    withdrawFunds: "Retirar fundos",
    topAssets: "Ativos em destaque",
    topAssetsDown: "Os ativos em destaque estão indisponíveis — o feed de mercado não está respondendo.",
    all: "Todos",
    crypto: "Cripto",
    forex: "Forex",
    stocks: "Ações",
    indices: "Índices",
    gainers: "Em alta",
    losers: "Em baixa",
    perWeek: "Na semana",
    previous: "Anterior",
    next: "Próximo",
  },
  verification: {
    title: "Verificação da conta",
    emailStep: "Confirmação de e-mail",
    detailsStep: "Dados pessoais",
    identityStep: "Comprovante de identidade",
    identityPending: "Recebemos seus dados. O próximo passo é a foto de um documento de identidade, que uma pessoa confere com o que você informou.",
    uploadMissing: "O envio de documentos ainda não foi construído. Até lá, a conta permanece no saldo de treinamento.",
    personalInfo: "Dados pessoais",
    residenceInfo: "Dados de residência",
    exactlyAsId: "Informe seus dados exatamente como aparecem no seu documento, para evitar problemas na verificação depois.",
    checkResidence: "Confira se os dados de residência estão corretos.",
    firstName: "Nome",
    lastName: "Sobrenome",
    dateOfBirth: "Data de nascimento",
    datePlaceholder: "dd.mm.aaaa",
    citizenship: "País de cidadania",
    usPerson: "Sou cidadão ou residente fiscal dos Estados Unidos.",
    refresh: "Atualizar",
  },
  faq: {
    heading: "Perguntas frequentes",
    businessDays: "1 a 3 dias úteis",
    items: [
      {
        q: "Quanto tempo leva para o depósito cair?",
        a: "Ainda não há cobrança. Um depósito aqui é registrado como pendente e o saldo só se move quando alguém aprova, porque nenhum provedor de pagamento está conectado.",
      },
      {
        q: "Por que meu saldo não mudou depois de depositar?",
        a: "Pelo mesmo motivo: o pedido é um registro, não um pagamento. Você o vê no Histórico do saldo, com a situação dele.",
      },
      {
        q: "Em qual moeda está a minha conta?",
        a: "Na moeda em que a carteira foi aberta. Ela aparece ao lado do campo de valor e não pode ser trocada nesta página.",
      },
      {
        q: "Posso negociar enquanto um depósito está pendente?",
        a: "Sim, com o saldo que você já tem. O saldo de treinamento já vem com fundos e não é afetado por depósitos.",
      },
    ],
  },
  personal: {
    changePhoto: "Trocar foto",
    uploadPhoto: "+ Enviar uma foto",
    photoNote: "Sua foto aparecerá nas mensagens diretas, nos chats públicos e nos rankings.",
    statement: "Extrato da conta",
    statementBody: "Veja informações detalhadas da sua conta de negociação no período escolhido.",
    createRequest: "Criar solicitação",
    emailAddress: "Endereço de e-mail",
    emailNote: "Você pode trocar o endereço de e-mail ligado à sua conta.",
    changeEmail: "Trocar e-mail",
    contactInfo: "Dados de contato",
    noContact: "Você ainda não preencheu seus dados de contato.",
    verifyPrompt: "Verifique sua conta",
    rectify: "Se quiser corrigir ou gerenciar seus dados, fale com",
    byCategory: "Você pode ver, por categoria, os dados pessoais que nos forneceu.",
    accessMyData: "Acessar meus dados",
    showMyData: "Ver meus dados",
    noOpenPositions: "Você ainda não tem posições abertas. Veja os ativos em destaque e",
    start: "comece",
    bestExperience: "a melhor experiência de negociação.",
    entries: (n) => `${n} ${n === 1 ? "lançamento" : "lançamentos"}.`,
    settledTwice: "Um negócio liquidado aparece duas vezes: a aposta saindo na abertura e o retorno entrando no encerramento.",
    freeWithdrawals: (n) => `Você ainda tem ${n} ${n === 1 ? "saque gratuito" : "saques gratuitos"} até o fim do mês.`,
    balanceOf: (c) => `Saldo em ${c}`,
    amountIn: (c) => `Valor (${c})`,
    done: "Concluído",
    requested: "Solicitado em",
    method: "Método",
    destination: "Destino",
    when: "Quando",
    what: "O quê",
    reference: "Referência",
    amount: "Valor",
    entryOf: (key) =>
      ({ deposit: "Depósito", withdrawal: "Saque", tradeOpened: "Negócio aberto", tradeWon: "Negócio ganho", tradeLost: "Negócio perdido", tradeRefunded: "Negócio devolvido" })[key] ?? key,
  },
};

const es: CabinetCopy = {
  nav: {
    personalData: "Datos personales",
    verification: "Verificación",
    portfolio: "Portafolio",
    withdrawFunds: "Retirar fondos",
    balanceHistory: "Historial de saldo",
    tradingHistory: "Historial de operaciones",
    deposit: "Depositar",
    tradeNow: "Operar",
    logOut: "Salir",
    addPersonalInfo: "Añadir datos personales",
    accountMenu: "Menú de la cuenta",
    closeMenu: "Cerrar menú",
    close: "Cerrar",
  },
  profile: {
    notificationSettings: "Configuración de notificaciones",
    accountSettings: "Configuración de la cuenta",
    socialNetworks: "Redes sociales",
    paymentMethods: "Métodos de pago",
    safetySecurity: "Seguridad",
    dateRegistered: "Fecha de registro",
    profileId: "ID del perfil",
  },
  account: {
    real: "Cuenta real",
    practice: "Cuenta de práctica",
  },
  notifications: {
    emailTitle: "Notificaciones por correo",
    emailBody: "Recibe correos sobre novedades de la plataforma y eventos importantes",
    pushTitle: "Notificaciones push",
    pushBody: "Recibe notificaciones push con las últimas noticias del mercado.",
    pushAside: "Al desactivar las notificaciones push, te pierdes avisos importantes del mercado en la aplicación de Avalon.",
    callsTitle: "Llamadas y SMS",
    callsBody: "Recibe llamadas y SMS de nuestro equipo de soporte sobre ofertas especiales.",
    consentTitle: "Comunicación de datos",
    consentBody: "Autorizo el tratamiento de mis datos personales por parte de Avalon, sus socios y entidades relacionadas con fines de marketing, lo que incluye en particular comunicarse conmigo para informarme sobre sus productos, servicios y ofertas según lo descrito arriba, con el fin de ofrecer una experiencia más adecuada a mi perfil.",
    topics: {
      promotions: "Promociones",
      systemNews: "Avisos del sistema",
      analytics: "Informes analíticos",
      product: "Novedades del producto",
      education: "Formación y análisis de mercado",
      offers: "Ofertas especiales y bonos",
      tournaments: "Torneos",
      marketNews: "Noticias del mercado",
    },
  },
  settings: {
    publicTitle: "Usar perfil público",
    publicBody: "Puedes elegir un nombre generado que aparecerá en las estadísticas de operaciones de la plataforma.",
    nameOnPlatform: "Nombre en la plataforma",
    pickAnother: "Elegir otro nombre",
    additional: "Otros ajustes",
    resetTitle: "Restablecer",
    resetBody: "Si tienes problemas para usar la plataforma, prueba a restablecer tus ajustes. Después, todos los ajustes vuelven a sus valores por defecto.",
    resetAction: "Restablecer ajustes",
    resetConfirm: "¿Restablecer todos los ajustes de la plataforma?",
    resetDone: "Tus ajustes han vuelto a sus valores por defecto.",
    closeTitle: "Cierre temporal de la cuenta",
    closeBody: "Puedes cerrar tu cuenta temporalmente. Con la cuenta cerrada no podrás iniciar sesión ni hacer transacciones. Para reabrirla, contacta con nuestro soporte.",
    closeAction: "Cerrar cuenta",
    closeConfirm: "¿Cerrar tu cuenta? Se cerrará tu sesión y no podrás volver a entrar sin ayuda del soporte.",
    closeDone: "Tu cuenta está cerrada. Contacta con soporte para reabrirla.",
    deleteTitle: "Eliminación de la cuenta y los datos personales",
    deleteBody: "La eliminación de tu cuenta y de todos tus datos personales es definitiva. No podrás acceder a la cuenta, operar ni usar los servicios de Avalon.",
    deleteNote: "NOTA: antes de solicitar la eliminación de tus datos, debes cerrar las posiciones abiertas y las órdenes pendientes.",
    deleteAction: "Solicitar eliminación",
    deleteConfirm: "¿Solicitar la eliminación de tu cuenta y tus datos personales?",
    deleteDone: "Tu solicitud de eliminación ha quedado registrada.",
    deleteOnFile: "Ya hay una solicitud de eliminación registrada.",
    saveFailed: "no se pudo guardar",
  },
  socials: {
    body: "Puedes usar tus cuentas de redes sociales para iniciar sesión en nuestro sitio y para compartir tus resultados con tus amigos.",
    notLinked: "Cuenta no vinculada",
    unavailable: "No disponible",
    unavailableWhy: "Iniciar sesión con una red social no está configurado en esta plataforma. Tu cuenta usa el correo y la contraseña con los que te registraste.",
  },
  payments: {
    linkedCards: "Tarjetas vinculadas",
    noCards: "Sin tarjetas",
    noCardsBody: "Todavía no tienes tarjetas vinculadas",
    recent: "Métodos usados recientemente",
    noData: "No se encontraron datos",
    noDataBody: "Todavía no has hecho ningún pago.",
    byHand: "Los depósitos y retiradas se revisan a mano. No hay ninguna red de tarjetas conectada, así que no se cobra nada ni se guardan datos de tarjeta.",
    payments: (n) => `${n} pago${n === 1 ? "" : "s"}`,
  },
  security: {
    twoStepTitle: "Verificación en dos pasos",
    twoStepBody: "Recibirás un código de confirmación adicional para entrar en tu cuenta.",
    twoStepUnavailable: "Todavía no disponible. Esta cuenta está protegida solo por su contraseña.",
    passwordTitle: "Cambiar contraseña",
    passwordBody: "Elige una nueva contraseña para tu cuenta.",
    passwordAction: "Cambiar contraseña",
    sessionsTitle: "Sesiones activas",
    sessionsBody: "Información sobre el uso de tu cuenta en otros dispositivos. Cerrar una sesión impide que ese dispositivo opere de inmediato.",
    noSessions: "No hay sesiones de operación abiertas.",
    endSession: "Cerrar esta sesión",
    endFailed: "no se pudo cerrar esa sesión",
    thisDevice: "este dispositivo",
    historyTitle: "Historial de sesiones",
    historyBody: "Esta sección muestra desde qué dispositivos has iniciado sesión y cuándo. Si sospechas que otra persona tiene acceso a tu perfil, considera cambiar la contraseña.",
    historyNote: "Solo se guardan las sesiones todavía abiertas. Una sesión caducada se elimina, no se registra.",
  },
  history: {
    noData: "No se encontraron datos",
    noDataHint: "Prueba con otros filtros o cambia el período.",
    date: "Fecha",
    status: "Estado",
    currency: "Divisa",
    transactionType: "Tipo de transacción",
    allTypes: "Todos los tipos",
    allStatuses: "Todos los estados",
    allCurrencies: "Todas las divisas",
    deposits: "Depósitos",
    withdrawals: "Retiradas",
    trades: "Operaciones",
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    open: "Abierta",
    settled: "Liquidadas",
    statusOf: (value) =>
      ({ pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada", cancelled: "Cancelada", settled: "Liquidada", open: "Abierta" })[value.toLowerCase()] ?? value,
    accountType: "Tipo de cuenta",
    allAccounts: "Todas las cuentas",
    real: "Real",
    practice: "Práctica",
    instrument: "Instrumento",
    allInstruments: "Todos los instrumentos",
    binary: "Opciones binarias",
    turbo: "Opciones turbo",
    blitz: "Opciones blitz",
    totalNetProfit: "Beneficio neto total",
    periodData: "Datos del período seleccionado",
  },
  cashier: {
    depositAmount: "Importe del depósito",
    currency: "Divisa",
    promotion: "Promoción",
    promoPlaceholder: "Tu código promocional",
    apply: "Aplicar",
    onePerDeposit: "Un código promocional por depósito",
    acceptTerms: "Acepto los",
    terms: "Términos y Condiciones",
    proceed: "Ir al pago",
    sending: "Enviando…",
    encrypted: "Las conexiones con este sitio están cifradas. Todavía no hay ninguna red de tarjetas conectada y no se cobra ningún pago.",
    noMethods: "No hay métodos de depósito configurados.",
    noPromotions: "No hay promociones activas.",
    refused: "El depósito fue rechazado.",
    unreachable: "No se pudo contactar con el servidor.",
    walletAddress: "Dirección de la cartera",
    requestWithdrawal: "Solicitar retirada",
    noWithdrawMethods: "No hay métodos de retirada configurados.",
    requestRefused: "La solicitud fue rechazada.",
    emptyBalance: "No puedes retirar fondos porque tu saldo es 0.",
    deposit: "Depositar",
  },
  portfolio: {
    totalEquity: "Patrimonio total",
    estimatedValue: "Valor estimado de la cuenta",
    totalInvestment: "Total invertido",
    totalGrossProfit: "Beneficio bruto total",
    withdrawFunds: "Retirar fondos",
    topAssets: "Activos destacados",
    topAssetsDown: "Los activos destacados no están disponibles: el feed de mercado no responde.",
    all: "Todos",
    crypto: "Cripto",
    forex: "Forex",
    stocks: "Acciones",
    indices: "Índices",
    gainers: "Al alza",
    losers: "A la baja",
    perWeek: "En la semana",
    previous: "Anterior",
    next: "Siguiente",
  },
  verification: {
    title: "Verificación de la cuenta",
    emailStep: "Confirmación de correo",
    detailsStep: "Datos personales",
    identityStep: "Prueba de identidad",
    identityPending: "Hemos recibido tus datos. El siguiente paso es una foto de un documento de identidad, que una persona compara con lo que indicaste.",
    uploadMissing: "La subida de documentos todavía no está construida. Hasta entonces, la cuenta se queda en el saldo de práctica.",
    personalInfo: "Datos personales",
    residenceInfo: "Datos de residencia",
    exactlyAsId: "Indica tus datos exactamente como aparecen en tu documento, para evitar problemas de verificación más adelante.",
    checkResidence: "Comprueba que los datos de residencia sean correctos.",
    firstName: "Nombre",
    lastName: "Apellido",
    dateOfBirth: "Fecha de nacimiento",
    datePlaceholder: "dd.mm.aaaa",
    citizenship: "País de ciudadanía",
    usPerson: "Soy ciudadano o residente fiscal de Estados Unidos.",
    refresh: "Actualizar",
  },
  faq: {
    heading: "Preguntas frecuentes",
    businessDays: "1 a 3 días hábiles",
    items: [
      {
        q: "¿Cuánto tarda en llegar un depósito?",
        a: "Todavía no se cobra nada. Un depósito aquí se registra como pendiente y el saldo solo se mueve cuando alguien lo aprueba, porque no hay ningún proveedor de pago conectado.",
      },
      {
        q: "¿Por qué mi saldo no ha cambiado tras depositar?",
        a: "Por el mismo motivo: la solicitud es un registro, no un pago. Puedes verla en el Historial de saldo, con su estado.",
      },
      {
        q: "¿En qué divisa está mi cuenta?",
        a: "En la divisa con la que se abrió tu cartera. Aparece junto al campo del importe y no se puede cambiar desde esta página.",
      },
      {
        q: "¿Puedo operar mientras un depósito está pendiente?",
        a: "Sí, con el saldo que ya tienes. El saldo de práctica viene con fondos desde el principio y los depósitos no lo afectan.",
      },
    ],
  },
  personal: {
    changePhoto: "Cambiar foto",
    uploadPhoto: "+ Subir una foto",
    photoNote: "Tu foto aparecerá en los mensajes directos, los chats públicos y las clasificaciones.",
    statement: "Extracto de la cuenta",
    statementBody: "Consulta información detallada de tu cuenta de operaciones en el período elegido.",
    createRequest: "Crear solicitud",
    emailAddress: "Dirección de correo",
    emailNote: "Puedes cambiar la dirección de correo vinculada a tu cuenta.",
    changeEmail: "Cambiar correo",
    contactInfo: "Datos de contacto",
    noContact: "Todavía no has rellenado tus datos de contacto.",
    verifyPrompt: "Verifica tu cuenta",
    rectify: "Si quieres rectificar o gestionar tus datos, contacta con",
    byCategory: "Puedes ver, por categoría, los datos personales que nos has facilitado.",
    accessMyData: "Acceder a mis datos",
    showMyData: "Ver mis datos",
    noOpenPositions: "Todavía no tienes posiciones abiertas. Mira los activos destacados y",
    start: "empieza",
    bestExperience: "la mejor experiencia de operaciones.",
    entries: (n) => `${n} ${n === 1 ? "apunte" : "apuntes"}.`,
    settledTwice: "Una operación liquidada aparece dos veces: la apuesta al abrirse y el retorno al cerrarse.",
    freeWithdrawals: (n) => `Todavía tienes ${n} ${n === 1 ? "retirada gratuita" : "retiradas gratuitas"} hasta fin de mes.`,
    balanceOf: (c) => `Saldo en ${c}`,
    amountIn: (c) => `Importe (${c})`,
    done: "Hecho",
    requested: "Solicitado el",
    method: "Método",
    destination: "Destino",
    when: "Cuándo",
    what: "Qué",
    reference: "Referencia",
    amount: "Importe",
    entryOf: (key) =>
      ({ deposit: "Depósito", withdrawal: "Retirada", tradeOpened: "Operación abierta", tradeWon: "Operación ganada", tradeLost: "Operación perdida", tradeRefunded: "Operación devuelta" })[key] ?? key,
  },
};

const DICTIONARIES: Record<AvalonLocale, CabinetCopy> = { en, pt, es };

/** The copy for one locale, falling back to English for an unknown one. */
export function cabinetCopy(locale: string): CabinetCopy {
  return DICTIONARIES[locale as AvalonLocale] ?? en;
}
