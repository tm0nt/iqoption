/**
 * Copy for the admin's money screens: the cashier's limits and fees, accounts,
 * the affiliate programme and its payouts.
 *
 * A dictionary of its own rather than more sections in `admin.ts`, which
 * already carries every other screen in three languages and is long enough
 * that a missing key is hard to spot. Same shape and same fallback.
 */
import type { AvalonLocale } from "@/types/avalon-login";

type KycName = "NONE" | "PENDING" | "APPROVED" | "REJECTED";
type PlanName = "CPA" | "REVSHARE" | "HYBRID";
type AffiliateStatusName = "PENDING" | "ACTIVE" | "SUSPENDED";

export type AdminMoneyCopy = {
  nav: {
    finance: string;
    affiliates: string;
    platform: string;
    content: string;
    configuration: string;
    limits: string;
    users: string;
    affiliateList: string;
    payouts: string;
    program: string;
    advanced: string;
    kyc: string;
    menu: string;
    close: string;
    signOut: string;
  };
  common: {
    previous: string;
    next: string;
    page: (n: number) => string;
    search: string;
    all: string;
    yes: string;
    no: string;
    saving: string;
    actionFailed: string;
    today: string;
    last7: string;
    last30: string;
    allTime: string;
    approve: string;
    reject: string;
    notePlaceholder: string;
    noLimit: string;
    status: Record<string, string>;
  };
  overview: {
    money: string;
    depositsToday: string;
    deposits30: string;
    withdrawals30: string;
    net30: string;
    waitingCashier: string;
    waitingPayouts: string;
    requests: (n: number) => string;
    platformResult30: string;
    platformResultHint: string;
    people: string;
    newToday: string;
    new7: string;
    activeAffiliates: string;
    referred: string;
    awaitingReview: (n: number) => string;
    platform: string;
  };
  cashier: {
    kinds: { all: string; deposits: string; withdrawals: string };
    searchPlaceholder: string;
    fee: string;
    bonus: string;
    payable: string;
    promo: string;
    kyc: string;
    via: string;
    user: string;
    cancelled: string;
    creditsWithBonus: (bonus: string) => string;
    kycStates: Record<KycName, string>;
    noneMatch: string;
  };
  finance: {
    heading: string;
    lead: string;
    deposits: string;
    depositsHint: string;
    withdrawals: string;
    withdrawalsHint: string;
    methods: string;
    methodsHint: string;
    terms: string;
    minDeposit: string;
    maxDeposit: string;
    presets: string;
    presetsHint: string;
    maxPending: string;
    maxPendingHint: string;
    minWithdrawal: string;
    maxWithdrawal: string;
    freeWithdrawals: string;
    freeWithdrawalsHint: string;
    feePercent: string;
    feeFixed: string;
    feeExample: (amount: string, fee: string, net: string) => string;
    requireKyc: string;
    requireKycHint: string;
    termsUrl: string;
    termsUrlHint: string;
    id: string;
    name: string;
    days: string;
    kind: string;
    bank: string;
    crypto: string;
    deposit: string;
    withdrawal: string;
    add: string;
    remove: string;
    up: string;
    down: string;
    saved: string;
    saveFailed: string;
  };
  users: {
    heading: string;
    lead: string;
    searchPlaceholder: string;
    account: string;
    registered: string;
    verification: string;
    real: string;
    practice: string;
    referredBy: string;
    status: string;
    active: string;
    closed: string;
    admin: string;
    disable: string;
    enable: string;
    kyc: Record<KycName, string>;
    none: string;
    filters: { all: string; kycPending: string; referred: string; closed: string };
    confirmDisable: string;
    twoFactor: string;
    resetTwoFactor: string;
    confirmResetTwoFactor: string;
    reviewKyc: string;
  };
  kyc: {
    heading: string;
    lead: string;
    queueTab: string;
    rulesTab: string;
    searchPlaceholder: string;
    nothingWaiting: string;
    noneMatch: string;
    declared: string;
    document: string;
    name: string;
    birth: string;
    age: (years: number) => string;
    minor: string;
    citizenship: string;
    usPerson: string;
    country: string;
    countryMismatch: string;
    type: string;
    number: string;
    submitted: string;
    attempts: (n: number) => string;
    sameDocument: (accounts: string) => string;
    front: string;
    back: string;
    selfie: string;
    openFull: string;
    missing: string;
    reviewed: (who: string, when: string) => string;
    reason: string;
    reasonPlaceholder: string;
    presets: string[];
    approve: string;
    reject: string;
    confirmApprove: string;
    needReason: string;
    docTypes: Record<"ID_CARD" | "DRIVERS_LICENSE" | "PASSPORT" | "RESIDENCE_PERMIT", string>;
    rulesTitle: string;
    rulesLead: string;
    noBack: string;
    addCountry: string;
    addCountryHint: string;
    remove: string;
    save: string;
    saved: string;
    needOneDocument: (country: string) => string;
    unknownCountry: string;
    duplicate: string;
  };
  affiliates: {
    heading: string;
    lead: string;
    programLink: string;
    payoutsLink: string;
    status: Record<AffiliateStatusName, string>;
    plans: Record<PlanName, string>;
    programDefault: (label: string) => string;
    followsProgram: string;
    affiliate: string;
    code: string;
    plan: string;
    clicks: string;
    signups: string;
    ftds: string;
    deposits: string;
    earned: string;
    balance: string;
    joined: string;
    searchPlaceholder: string;
    none: string;
    add: string;
    addPlaceholder: string;
    addHint: string;
    back: string;
    performance: string;
    terms: string;
    uniqueClicks: string;
    conversion: string;
    ftdAmount: string;
    withdrawals: string;
    netDeposits: string;
    turnover: string;
    platformResult: string;
    cpa: string;
    revshare: string;
    adjustments: string;
    held: string;
    available: string;
    paid: string;
    pendingPayouts: string;
    cpaAmount: string;
    revsharePercent: string;
    defaultHint: string;
    postbackUrl: string;
    note: string;
    noteHint: string;
    approve: string;
    suspend: string;
    reactivate: string;
    trackingLink: string;
    tabs: { referrals: string; commissions: string; payouts: string; clicks: string; subIds: string; postbacks: string };
    user: string;
    registered: string;
    sub: string;
    ip: string;
    ftd: string;
    result: string;
    when: string;
    kind: string;
    base: string;
    rate: string;
    amount: string;
    availableAt: string;
    state: string;
    kinds: Record<"CPA" | "REVSHARE" | "ADJUSTMENT", string>;
    states: { held: string; available: string; reversed: string };
    reverse: string;
    restore: string;
    adjustTitle: string;
    adjustAmount: string;
    adjustNote: string;
    adjustAdd: string;
    source: string;
    landing: string;
    referer: string;
    country: string;
    browser: string;
    noSub: string;
    event: string;
    httpStatus: string;
    url: string;
    error: string;
    noPostbackUrl: string;
    nothingYet: string;
    rows: (shown: number) => string;
  };
  program: {
    heading: string;
    lead: string;
    general: string;
    enabled: string;
    enabledHint: string;
    autoApprove: string;
    autoApproveHint: string;
    plan: string;
    planHint: string;
    cpa: string;
    cpaAmount: string;
    cpaMinDeposit: string;
    cpaMinDepositHint: string;
    cpaMinTurnover: string;
    cpaMinTurnoverHint: string;
    revshare: string;
    revsharePercent: string;
    revshareHint: string;
    payouts: string;
    holdDays: string;
    holdDaysHint: string;
    minPayout: string;
    minPayoutHint: string;
    cookieDays: string;
    cookieDaysHint: string;
    currency: string;
    terms: string;
    termsHint: string;
    tracking: string;
    trackingBody: string;
    macros: string;
    saved: string;
    saveFailed: string;
  };
  payouts: {
    heading: string;
    lead: string;
    waiting: (n: number) => string;
    nothing: string;
    settled: string;
    nothingSettled: string;
    affiliate: string;
    amount: string;
    method: string;
    destination: string;
    requested: string;
    status: string;
    note: string;
    availableNow: string;
    approveEffect: string;
    rejectEffect: string;
  };
};

const en: AdminMoneyCopy = {
  nav: {
    finance: "Finance",
    affiliates: "Affiliates",
    platform: "Platform",
    content: "Content",
    configuration: "Configuration",
    limits: "Limits & fees",
    users: "Users",
    affiliateList: "Affiliates",
    payouts: "Affiliate payouts",
    program: "Programme",
    advanced: "Advanced (JSON)",
    kyc: "Verification (KYC)",
    menu: "Menu",
    close: "Close",
    signOut: "Sign out",
  },
  common: {
    previous: "Previous",
    next: "Next",
    page: (n) => `Page ${n}`,
    search: "Search",
    all: "All",
    yes: "Yes",
    no: "No",
    saving: "Saving…",
    actionFailed: "That did not work.",
    today: "Today",
    last7: "7 days",
    last30: "30 days",
    allTime: "All time",
    approve: "Approve",
    reject: "Reject",
    notePlaceholder: "A note, for whoever reads this later",
    noLimit: "0 means no limit.",
    status: { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", CANCELLED: "Cancelled" },
  },
  overview: {
    money: "Money",
    depositsToday: "Deposits today",
    deposits30: "Deposits, 30 days",
    withdrawals30: "Withdrawals, 30 days",
    net30: "Net deposits, 30 days",
    waitingCashier: "Waiting in the cashier",
    waitingPayouts: "Affiliate payouts waiting",
    requests: (n) => `${n} request${n === 1 ? "" : "s"}`,
    platformResult30: "Platform result, 30 days",
    platformResultHint: "On real trades: what traders lost minus what they won. Positive is the platform's.",
    people: "People",
    newToday: "New accounts today",
    new7: "New accounts, 7 days",
    activeAffiliates: "Active affiliates",
    referred: "Referred accounts",
    awaitingReview: (n) => `${n} waiting for review`,
    platform: "Platform",
  },
  cashier: {
    kinds: { all: "Everything", deposits: "Deposits", withdrawals: "Withdrawals" },
    searchPlaceholder: "Email or account id",
    fee: "Fee",
    bonus: "Bonus",
    payable: "To pay",
    promo: "Promo",
    kyc: "Verification",
    via: "Via affiliate",
    user: "Account",
    cancelled: "cancelled",
    creditsWithBonus: (bonus) => `credits the wallet, plus ${bonus} bonus`,
    kycStates: { NONE: "not started", PENDING: "pending", APPROVED: "verified", REJECTED: "rejected" },
    noneMatch: "Nothing matches these filters.",
  },
  finance: {
    heading: "Limits & fees",
    lead: "How much can move through the cashier, what a withdrawal costs, and which rails are offered. The deposit and withdrawal pages, and the routes behind them, read these on every request.",
    deposits: "Deposits",
    depositsHint: "Checked when a deposit is requested, not when it is approved.",
    withdrawals: "Withdrawals",
    withdrawalsHint: "The amount leaves the real balance when it is requested and is held until someone settles it.",
    methods: "Methods",
    methodsHint: "In the order the cashier lists them. A method can offer deposits, withdrawals or both; one with neither is hidden.",
    terms: "Terms",
    minDeposit: "Minimum deposit",
    maxDeposit: "Maximum deposit",
    presets: "Amount buttons",
    presetsHint: "Comma separated. Shown largest first; any outside the limits are left out.",
    maxPending: "Pending deposits per person",
    maxPendingHint: "Every pending deposit is a row someone reconciles by hand. 0 means no limit.",
    minWithdrawal: "Minimum withdrawal",
    maxWithdrawal: "Maximum withdrawal",
    freeWithdrawals: "Free withdrawals per month",
    freeWithdrawalsHint: "Counted per calendar month. After these, the fee below applies.",
    feePercent: "Fee after the free ones (%)",
    feeFixed: "Fixed fee after the free ones",
    feeExample: (amount, fee, net) => `A withdrawal of ${amount} after the free ones pays out ${net} (fee ${fee}).`,
    requireKyc: "Require approved verification to withdraw",
    requireKycHint: "Verification is approved under Users. Deposits are never blocked by this.",
    termsUrl: "Terms & Conditions link",
    termsUrlHint: "Where the deposit form's checkbox points. Empty shows the words without a link.",
    id: "Id",
    name: "Name",
    days: "Settles in",
    kind: "Kind",
    bank: "Bank / PIX",
    crypto: "Crypto",
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    add: "Add a method",
    remove: "Remove",
    up: "Move up",
    down: "Move down",
    saved: "Saved. The cashier uses these from the next request.",
    saveFailed: "Could not save that.",
  },
  users: {
    heading: "Users",
    lead: "Every account, with its wallets, its verification and who referred it.",
    searchPlaceholder: "Email, name, phone or id",
    account: "Account",
    registered: "Registered",
    verification: "Verification",
    real: "Real",
    practice: "Practice",
    referredBy: "Referred by",
    status: "Status",
    active: "Active",
    closed: "Disabled",
    admin: "Admin",
    disable: "Disable",
    enable: "Enable",
    kyc: { NONE: "Not started", PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" },
    none: "No accounts match.",
    filters: { all: "Everyone", kycPending: "Verification pending", referred: "Referred", closed: "Disabled" },
    confirmDisable: "Disable this account? They are signed out of trading and cannot sign back in.",
    twoFactor: "2FA",
    resetTwoFactor: "Reset 2FA",
    confirmResetTwoFactor: "Turn off this account's two-step sign-in? Only do this once you have confirmed who is asking.",
    reviewKyc: "Review documents",
  },
  affiliates: {
    heading: "Affiliates",
    lead: "Who brings people to the platform, what those people did, and what each affiliate has earned.",
    programLink: "Programme terms",
    payoutsLink: "Payouts",
    status: { PENDING: "Pending", ACTIVE: "Active", SUSPENDED: "Suspended" },
    plans: { CPA: "CPA", REVSHARE: "Revenue share", HYBRID: "Hybrid (CPA + RevShare)" },
    programDefault: (label) => `Programme default (${label})`,
    followsProgram: "programme default",
    affiliate: "Affiliate",
    code: "Code",
    plan: "Plan",
    clicks: "Clicks",
    signups: "Sign-ups",
    ftds: "First deposits",
    deposits: "Deposits",
    earned: "Earned",
    balance: "Balance",
    joined: "Joined",
    searchPlaceholder: "Email or code",
    none: "No affiliates yet.",
    add: "Make an affiliate",
    addPlaceholder: "Account email",
    addHint: "Turns an existing account into an active affiliate, on the programme's terms.",
    back: "All affiliates",
    performance: "Performance",
    terms: "Terms",
    uniqueClicks: "Unique visitors",
    conversion: "Conversion",
    ftdAmount: "First deposit volume",
    withdrawals: "Withdrawals",
    netDeposits: "Net deposits",
    turnover: "Real turnover",
    platformResult: "Platform result",
    cpa: "CPA",
    revshare: "Revenue share",
    adjustments: "Adjustments",
    held: "On hold",
    available: "Available",
    paid: "Paid out",
    pendingPayouts: "Payouts waiting",
    cpaAmount: "CPA amount",
    revsharePercent: "Revenue share (%)",
    defaultHint: "Empty uses the programme's.",
    postbackUrl: "Postback URL",
    note: "Internal note",
    noteHint: "Only administrators see this.",
    approve: "Approve",
    suspend: "Suspend",
    reactivate: "Reactivate",
    trackingLink: "Tracking link",
    tabs: { referrals: "Referrals", commissions: "Ledger", payouts: "Payouts", clicks: "Clicks", subIds: "Sub-ids", postbacks: "Postbacks" },
    user: "Account",
    registered: "Registered",
    sub: "Sub-id",
    ip: "IP",
    ftd: "First deposit",
    result: "Platform result",
    when: "When",
    kind: "Kind",
    base: "Base",
    rate: "Rate",
    amount: "Amount",
    availableAt: "Available from",
    state: "State",
    kinds: { CPA: "CPA", REVSHARE: "RevShare", ADJUSTMENT: "Adjustment" },
    states: { held: "On hold", available: "Available", reversed: "Reversed" },
    reverse: "Reverse",
    restore: "Restore",
    adjustTitle: "Manual adjustment",
    adjustAmount: "Amount (negative to deduct)",
    adjustNote: "Reason",
    adjustAdd: "Add to the ledger",
    source: "Source",
    landing: "Landing",
    referer: "Came from",
    country: "Country",
    browser: "Browser",
    noSub: "(none)",
    event: "Event",
    httpStatus: "HTTP",
    url: "URL",
    error: "Error",
    noPostbackUrl: "No postback URL is set.",
    nothingYet: "Nothing yet.",
    rows: (n) => `Lists show up to the latest ${n}.`,
  },
  program: {
    heading: "Affiliate programme",
    lead: "The terms every affiliate is on unless they have been given their own. Changing a figure here changes what accrues from now on; what was already earned stays as it was.",
    general: "General",
    enabled: "Programme open",
    enabledHint: "Closed, nobody new can join and links stop tracking new clicks. Earned money stays payable.",
    autoApprove: "Approve new affiliates automatically",
    autoApproveHint: "Off, a request to join waits under Affiliates until someone approves it.",
    plan: "Default plan",
    planHint: "CPA pays once per qualifying person; revenue share pays a share of the platform's result on their real trades; hybrid pays both.",
    cpa: "CPA",
    cpaAmount: "CPA amount",
    cpaMinDeposit: "Qualifying deposits",
    cpaMinDepositHint: "What a referred person must have deposited, in approved deposits, before the CPA is paid.",
    cpaMinTurnover: "Qualifying turnover",
    cpaMinTurnoverHint: "And staked on real trades. 0 does not ask.",
    revshare: "Revenue share",
    revsharePercent: "Revenue share (%)",
    revshareHint: "Of what referred people lose minus what they win, on real trades only. It goes down as well as up.",
    payouts: "Payouts and tracking",
    holdDays: "Hold period (days)",
    holdDaysHint: "A commission waits this long before it can be withdrawn, so a deposit that turns out bad can be caught first.",
    minPayout: "Minimum affiliate withdrawal",
    minPayoutHint: "The smallest amount an affiliate can ask to be paid.",
    cookieDays: "Cookie lifetime (days)",
    cookieDaysHint: "How long a click is remembered before the visitor registers. The last click wins.",
    currency: "Currency",
    terms: "Terms shown to affiliates",
    termsHint: "Plain text, shown on the join page. Blank lines separate paragraphs.",
    tracking: "How tracking works",
    trackingBody: "An affiliate's link is any page of this site with ?ref=CODE added, optionally with &sub= for their own label and the usual utm_ parameters. The visit is recorded, the browser remembers it, and an account created from it is the affiliate's.",
    macros: "Postback macros: {event} {click_id} {sub_id} {user_id} {amount} {currency}",
    saved: "Saved. New commissions accrue on these terms.",
    saveFailed: "Could not save that.",
  },
  kyc: {
    heading: "Verification (KYC)",
    lead: "Identity documents waiting to be checked. Compare the photos with what the person declared — name, date of birth, nationality — and with each other: the selfie should show the same face holding the same document. A rejection needs a reason; it is what they read on their verification page.",
    queueTab: "Submissions",
    rulesTab: "Accepted documents",
    searchPlaceholder: "Email, account id or document number",
    nothingWaiting: "Nothing waiting for review.",
    noneMatch: "No submissions match.",
    declared: "Declared",
    document: "Document",
    name: "Name",
    birth: "Date of birth",
    age: (years) => `${years} years old`,
    minor: "Under 18",
    citizenship: "Citizenship",
    usPerson: "US person",
    country: "Issuing country",
    countryMismatch: "differs from citizenship",
    type: "Type",
    number: "Number",
    submitted: "Sent",
    attempts: (n) => (n === 1 ? "1 earlier attempt" : `${n} earlier attempts`),
    sameDocument: (accounts) => `Same document on account ${accounts}`,
    front: "Front",
    back: "Back",
    selfie: "Selfie with document",
    openFull: "Open full size",
    missing: "Not sent",
    reviewed: (who, when) => `Decided by ${who} on ${when}`,
    reason: "Reason",
    reasonPlaceholder: "What was wrong, in words the person can act on",
    presets: [
      "The photo is blurry or cut off — every corner and every line must be readable.",
      "The document is expired.",
      "The selfie must show your face and the same document, held next to it.",
      "The name on the document does not match the one on your account.",
      "The date of birth does not match the one on your account.",
      "This document type is not accepted for your country.",
    ],
    approve: "Approve",
    reject: "Reject",
    confirmApprove: "Approve this identity? The account becomes verified and can withdraw.",
    needReason: "Write the reason first — the person reads it.",
    docTypes: { ID_CARD: "ID card", DRIVERS_LICENSE: "Driver's licence", PASSPORT: "Passport", RESIDENCE_PERMIT: "Residence permit" },
    rulesTitle: "Accepted documents by country",
    rulesLead: "The countries offered on the verification form, and the documents each one may send. A country left out cannot be verified at all.",
    noBack: "Passports are sent without a back; every other document needs both sides.",
    addCountry: "Add country",
    addCountryHint: "Two-letter ISO code, e.g. UY",
    remove: "Remove",
    save: "Save",
    saved: "Saved.",
    needOneDocument: (country) => `${country} needs at least one document.`,
    unknownCountry: "That is not a two-letter country code.",
    duplicate: "That country is already listed.",
  },
  payouts: {
    heading: "Affiliate payouts",
    lead: "Affiliates asking to be paid. The amount left their balance when they asked; approving says it was sent, rejecting gives it back. Nothing here sends money.",
    waiting: (n) => `Waiting (${n})`,
    nothing: "Nothing waiting.",
    settled: "Settled",
    nothingSettled: "Nothing settled yet.",
    affiliate: "Affiliate",
    amount: "Amount",
    method: "Method",
    destination: "Destination",
    requested: "Requested",
    status: "Status",
    note: "Note",
    availableNow: "Balance after this",
    approveEffect: "marks it paid",
    rejectEffect: "returns it to the balance",
  },
};

const pt: AdminMoneyCopy = {
  nav: {
    finance: "Financeiro",
    affiliates: "Afiliados",
    platform: "Plataforma",
    content: "Conteúdo",
    configuration: "Configuração",
    limits: "Limites e taxas",
    users: "Usuários",
    affiliateList: "Afiliados",
    payouts: "Saques de afiliados",
    program: "Programa",
    advanced: "Avançado (JSON)",
    kyc: "Verificação (KYC)",
    menu: "Menu",
    close: "Fechar",
    signOut: "Sair",
  },
  common: {
    previous: "Anterior",
    next: "Próxima",
    page: (n) => `Página ${n}`,
    search: "Buscar",
    all: "Todos",
    yes: "Sim",
    no: "Não",
    saving: "Salvando…",
    actionFailed: "Não deu certo.",
    today: "Hoje",
    last7: "7 dias",
    last30: "30 dias",
    allTime: "Todo o período",
    approve: "Aprovar",
    reject: "Recusar",
    notePlaceholder: "Uma observação, para quem ler isto depois",
    noLimit: "0 significa sem limite.",
    status: { PENDING: "Pendente", APPROVED: "Aprovado", REJECTED: "Recusado", CANCELLED: "Cancelado" },
  },
  overview: {
    money: "Dinheiro",
    depositsToday: "Depósitos hoje",
    deposits30: "Depósitos, 30 dias",
    withdrawals30: "Saques, 30 dias",
    net30: "Depósitos líquidos, 30 dias",
    waitingCashier: "Esperando no caixa",
    waitingPayouts: "Saques de afiliados esperando",
    requests: (n) => `${n} pedido${n === 1 ? "" : "s"}`,
    platformResult30: "Resultado da plataforma, 30 dias",
    platformResultHint: "Em operações reais: o que os traders perderam menos o que ganharam. Positivo é da plataforma.",
    people: "Pessoas",
    newToday: "Contas novas hoje",
    new7: "Contas novas, 7 dias",
    activeAffiliates: "Afiliados ativos",
    referred: "Contas indicadas",
    awaitingReview: (n) => `${n} aguardando análise`,
    platform: "Plataforma",
  },
  cashier: {
    kinds: { all: "Tudo", deposits: "Depósitos", withdrawals: "Saques" },
    searchPlaceholder: "E-mail ou id da conta",
    fee: "Taxa",
    bonus: "Bônus",
    payable: "A pagar",
    promo: "Promo",
    kyc: "Verificação",
    via: "Via afiliado",
    user: "Conta",
    cancelled: "cancelado",
    creditsWithBonus: (bonus) => `credita a carteira, mais ${bonus} de bônus`,
    kycStates: { NONE: "não iniciada", PENDING: "pendente", APPROVED: "verificada", REJECTED: "recusada" },
    noneMatch: "Nada corresponde a estes filtros.",
  },
  finance: {
    heading: "Limites e taxas",
    lead: "Quanto pode passar pelo caixa, quanto custa um saque e quais meios são oferecidos. As páginas de depósito e saque, e as rotas por trás delas, leem isto a cada pedido.",
    deposits: "Depósitos",
    depositsHint: "Verificado quando o depósito é pedido, não quando é aprovado.",
    withdrawals: "Saques",
    withdrawalsHint: "O valor sai do saldo real quando é pedido e fica retido até alguém resolver.",
    methods: "Meios de pagamento",
    methodsHint: "Na ordem em que o caixa os lista. Um meio pode oferecer depósito, saque ou ambos; um sem nenhum fica oculto.",
    terms: "Termos",
    minDeposit: "Depósito mínimo",
    maxDeposit: "Depósito máximo",
    presets: "Botões de valor",
    presetsHint: "Separados por vírgula. Mostrados do maior para o menor; os que ficam fora dos limites são omitidos.",
    maxPending: "Depósitos pendentes por pessoa",
    maxPendingHint: "Cada depósito pendente é uma linha que alguém concilia à mão. 0 significa sem limite.",
    minWithdrawal: "Saque mínimo",
    maxWithdrawal: "Saque máximo",
    freeWithdrawals: "Saques grátis por mês",
    freeWithdrawalsHint: "Contados por mês do calendário. Depois deles, vale a taxa abaixo.",
    feePercent: "Taxa após os grátis (%)",
    feeFixed: "Taxa fixa após os grátis",
    feeExample: (amount, fee, net) => `Um saque de ${amount} depois dos grátis paga ${net} (taxa ${fee}).`,
    requireKyc: "Exigir verificação aprovada para sacar",
    requireKycHint: "A verificação é aprovada em Usuários. Depósitos nunca são bloqueados por isso.",
    termsUrl: "Link dos Termos e Condições",
    termsUrlHint: "Para onde aponta a caixa de seleção do depósito. Vazio mostra o texto sem link.",
    id: "Id",
    name: "Nome",
    days: "Prazo",
    kind: "Tipo",
    bank: "Banco / PIX",
    crypto: "Cripto",
    deposit: "Depósito",
    withdrawal: "Saque",
    add: "Adicionar meio",
    remove: "Remover",
    up: "Subir",
    down: "Descer",
    saved: "Salvo. O caixa usa estes valores a partir do próximo pedido.",
    saveFailed: "Não foi possível salvar.",
  },
  users: {
    heading: "Usuários",
    lead: "Todas as contas, com carteiras, verificação e quem as indicou.",
    searchPlaceholder: "E-mail, nome, telefone ou id",
    account: "Conta",
    registered: "Cadastro",
    verification: "Verificação",
    real: "Real",
    practice: "Prática",
    referredBy: "Indicado por",
    status: "Situação",
    active: "Ativa",
    closed: "Desativada",
    admin: "Admin",
    disable: "Desativar",
    enable: "Ativar",
    kyc: { NONE: "Não iniciada", PENDING: "Pendente", APPROVED: "Aprovada", REJECTED: "Recusada" },
    none: "Nenhuma conta encontrada.",
    filters: { all: "Todos", kycPending: "Verificação pendente", referred: "Indicados", closed: "Desativados" },
    confirmDisable: "Desativar esta conta? A pessoa sai do trading e não consegue entrar de novo.",
    twoFactor: "2FA",
    resetTwoFactor: "Resetar 2FA",
    confirmResetTwoFactor: "Desativar a verificação em duas etapas desta conta? Faça isso só depois de confirmar quem está pedindo.",
    reviewKyc: "Revisar documentos",
  },
  affiliates: {
    heading: "Afiliados",
    lead: "Quem traz pessoas para a plataforma, o que essas pessoas fizeram e quanto cada afiliado ganhou.",
    programLink: "Termos do programa",
    payoutsLink: "Saques",
    status: { PENDING: "Pendente", ACTIVE: "Ativo", SUSPENDED: "Suspenso" },
    plans: { CPA: "CPA", REVSHARE: "Revenue share", HYBRID: "Híbrido (CPA + RevShare)" },
    programDefault: (label) => `Padrão do programa (${label})`,
    followsProgram: "padrão do programa",
    affiliate: "Afiliado",
    code: "Código",
    plan: "Plano",
    clicks: "Cliques",
    signups: "Cadastros",
    ftds: "Primeiros depósitos",
    deposits: "Depósitos",
    earned: "Ganho",
    balance: "Saldo",
    joined: "Entrou em",
    searchPlaceholder: "E-mail ou código",
    none: "Nenhum afiliado ainda.",
    add: "Tornar afiliado",
    addPlaceholder: "E-mail da conta",
    addHint: "Transforma uma conta existente em afiliado ativo, nos termos do programa.",
    back: "Todos os afiliados",
    performance: "Desempenho",
    terms: "Termos",
    uniqueClicks: "Visitantes únicos",
    conversion: "Conversão",
    ftdAmount: "Volume do primeiro depósito",
    withdrawals: "Saques",
    netDeposits: "Depósitos líquidos",
    turnover: "Volume real",
    platformResult: "Resultado da plataforma",
    cpa: "CPA",
    revshare: "Revenue share",
    adjustments: "Ajustes",
    held: "Retido",
    available: "Disponível",
    paid: "Pago",
    pendingPayouts: "Saques esperando",
    cpaAmount: "Valor do CPA",
    revsharePercent: "Revenue share (%)",
    defaultHint: "Vazio usa o do programa.",
    postbackUrl: "URL de postback",
    note: "Observação interna",
    noteHint: "Só administradores veem isto.",
    approve: "Aprovar",
    suspend: "Suspender",
    reactivate: "Reativar",
    trackingLink: "Link de rastreamento",
    tabs: { referrals: "Indicados", commissions: "Extrato", payouts: "Saques", clicks: "Cliques", subIds: "Sub-ids", postbacks: "Postbacks" },
    user: "Conta",
    registered: "Cadastro",
    sub: "Sub-id",
    ip: "IP",
    ftd: "Primeiro depósito",
    result: "Resultado da plataforma",
    when: "Quando",
    kind: "Tipo",
    base: "Base",
    rate: "Taxa",
    amount: "Valor",
    availableAt: "Disponível a partir de",
    state: "Situação",
    kinds: { CPA: "CPA", REVSHARE: "RevShare", ADJUSTMENT: "Ajuste" },
    states: { held: "Retido", available: "Disponível", reversed: "Estornado" },
    reverse: "Estornar",
    restore: "Restaurar",
    adjustTitle: "Ajuste manual",
    adjustAmount: "Valor (negativo para descontar)",
    adjustNote: "Motivo",
    adjustAdd: "Lançar no extrato",
    source: "Origem",
    landing: "Página de entrada",
    referer: "Veio de",
    country: "País",
    browser: "Navegador",
    noSub: "(nenhum)",
    event: "Evento",
    httpStatus: "HTTP",
    url: "URL",
    error: "Erro",
    noPostbackUrl: "Nenhuma URL de postback configurada.",
    nothingYet: "Nada ainda.",
    rows: (n) => `As listas mostram até os ${n} mais recentes.`,
  },
  program: {
    heading: "Programa de afiliados",
    lead: "Os termos de todo afiliado que não tiver recebido termos próprios. Mudar um valor aqui muda o que acumula daqui em diante; o que já foi ganho fica como estava.",
    general: "Geral",
    enabled: "Programa aberto",
    enabledHint: "Fechado, ninguém novo entra e os links deixam de rastrear novos cliques. O que já foi ganho continua sacável.",
    autoApprove: "Aprovar novos afiliados automaticamente",
    autoApproveHint: "Desligado, o pedido para entrar espera em Afiliados até alguém aprovar.",
    plan: "Plano padrão",
    planHint: "CPA paga uma vez por pessoa que se qualifica; revenue share paga uma parte do resultado da plataforma nas operações reais dela; híbrido paga os dois.",
    cpa: "CPA",
    cpaAmount: "Valor do CPA",
    cpaMinDeposit: "Depósito para qualificar",
    cpaMinDepositHint: "Quanto a pessoa indicada precisa ter depositado, em depósitos aprovados, antes de o CPA ser pago.",
    cpaMinTurnover: "Volume para qualificar",
    cpaMinTurnoverHint: "E apostado em operações reais. 0 não exige.",
    revshare: "Revenue share",
    revsharePercent: "Revenue share (%)",
    revshareHint: "Do que os indicados perdem menos o que ganham, só em operações reais. Pode subir e descer.",
    payouts: "Saques e rastreamento",
    holdDays: "Período de retenção (dias)",
    holdDaysHint: "Uma comissão espera este tempo antes de poder ser sacada, para que um depósito problemático seja pego antes.",
    minPayout: "Saque mínimo de afiliado",
    minPayoutHint: "O menor valor que um afiliado pode pedir para receber.",
    cookieDays: "Validade do cookie (dias)",
    cookieDaysHint: "Por quanto tempo um clique é lembrado antes do cadastro. Vale o último clique.",
    currency: "Moeda",
    terms: "Termos mostrados aos afiliados",
    termsHint: "Texto simples, mostrado na página de adesão. Linhas em branco separam parágrafos.",
    tracking: "Como o rastreamento funciona",
    trackingBody: "O link de um afiliado é qualquer página deste site com ?ref=CODIGO, opcionalmente com &sub= para a etiqueta dele e os parâmetros utm_ de sempre. A visita é registrada, o navegador a guarda e a conta criada a partir dela é do afiliado.",
    macros: "Macros do postback: {event} {click_id} {sub_id} {user_id} {amount} {currency}",
    saved: "Salvo. As novas comissões acumulam nestes termos.",
    saveFailed: "Não foi possível salvar.",
  },
  kyc: {
    heading: "Verificação (KYC)",
    lead: "Documentos de identidade esperando conferência. Compare as fotos com o que a pessoa declarou — nome, data de nascimento, nacionalidade — e entre si: a selfie deve mostrar o mesmo rosto segurando o mesmo documento. Recusar exige um motivo; é o que a pessoa lê na página de verificação.",
    queueTab: "Envios",
    rulesTab: "Documentos aceitos",
    searchPlaceholder: "E-mail, id da conta ou número do documento",
    nothingWaiting: "Nada esperando revisão.",
    noneMatch: "Nenhum envio encontrado.",
    declared: "Declarado",
    document: "Documento",
    name: "Nome",
    birth: "Data de nascimento",
    age: (years) => `${years} anos`,
    minor: "Menor de 18",
    citizenship: "Nacionalidade",
    usPerson: "US person",
    country: "País emissor",
    countryMismatch: "diferente da nacionalidade",
    type: "Tipo",
    number: "Número",
    submitted: "Enviado",
    attempts: (n) => (n === 1 ? "1 tentativa anterior" : `${n} tentativas anteriores`),
    sameDocument: (accounts) => `Mesmo documento na conta ${accounts}`,
    front: "Frente",
    back: "Verso",
    selfie: "Selfie com documento",
    openFull: "Abrir em tamanho real",
    missing: "Não enviado",
    reviewed: (who, when) => `Decidido por ${who} em ${when}`,
    reason: "Motivo",
    reasonPlaceholder: "O que estava errado, em palavras que a pessoa consiga resolver",
    presets: [
      "A foto está desfocada ou cortada — todos os cantos e linhas precisam estar legíveis.",
      "O documento está vencido.",
      "A selfie precisa mostrar o seu rosto e o mesmo documento, segurado ao lado.",
      "O nome no documento não confere com o da sua conta.",
      "A data de nascimento não confere com a da sua conta.",
      "Este tipo de documento não é aceito para o seu país.",
    ],
    approve: "Aprovar",
    reject: "Recusar",
    confirmApprove: "Aprovar esta identidade? A conta fica verificada e pode sacar.",
    needReason: "Escreva o motivo antes — a pessoa vai lê-lo.",
    docTypes: { ID_CARD: "RG / Identidade", DRIVERS_LICENSE: "CNH / Carteira de motorista", PASSPORT: "Passaporte", RESIDENCE_PERMIT: "Autorização de residência" },
    rulesTitle: "Documentos aceitos por país",
    rulesLead: "Os países oferecidos no formulário de verificação e os documentos que cada um pode enviar. Um país fora da lista não consegue se verificar.",
    noBack: "Passaporte é enviado sem verso; todos os outros documentos precisam dos dois lados.",
    addCountry: "Adicionar país",
    addCountryHint: "Código ISO de duas letras, ex.: UY",
    remove: "Remover",
    save: "Salvar",
    saved: "Salvo.",
    needOneDocument: (country) => `${country} precisa de pelo menos um documento.`,
    unknownCountry: "Isso não é um código de país de duas letras.",
    duplicate: "Esse país já está na lista.",
  },
  payouts: {
    heading: "Saques de afiliados",
    lead: "Afiliados pedindo para receber. O valor saiu do saldo quando pediram; aprovar diz que foi enviado, recusar devolve. Nada aqui envia dinheiro.",
    waiting: (n) => `Esperando (${n})`,
    nothing: "Nada esperando.",
    settled: "Resolvidos",
    nothingSettled: "Nada resolvido ainda.",
    affiliate: "Afiliado",
    amount: "Valor",
    method: "Meio",
    destination: "Destino",
    requested: "Pedido em",
    status: "Situação",
    note: "Observação",
    availableNow: "Saldo depois disto",
    approveEffect: "marca como pago",
    rejectEffect: "devolve ao saldo",
  },
};

const es: AdminMoneyCopy = {
  nav: {
    finance: "Finanzas",
    affiliates: "Afiliados",
    platform: "Plataforma",
    content: "Contenido",
    configuration: "Configuración",
    limits: "Límites y comisiones",
    users: "Usuarios",
    affiliateList: "Afiliados",
    payouts: "Retiros de afiliados",
    program: "Programa",
    advanced: "Avanzado (JSON)",
    kyc: "Verificación (KYC)",
    menu: "Menú",
    close: "Cerrar",
    signOut: "Salir",
  },
  common: {
    previous: "Anterior",
    next: "Siguiente",
    page: (n) => `Página ${n}`,
    search: "Buscar",
    all: "Todos",
    yes: "Sí",
    no: "No",
    saving: "Guardando…",
    actionFailed: "No funcionó.",
    today: "Hoy",
    last7: "7 días",
    last30: "30 días",
    allTime: "Todo el periodo",
    approve: "Aprobar",
    reject: "Rechazar",
    notePlaceholder: "Una nota, para quien lo lea después",
    noLimit: "0 significa sin límite.",
    status: { PENDING: "Pendiente", APPROVED: "Aprobado", REJECTED: "Rechazado", CANCELLED: "Cancelado" },
  },
  overview: {
    money: "Dinero",
    depositsToday: "Depósitos hoy",
    deposits30: "Depósitos, 30 días",
    withdrawals30: "Retiros, 30 días",
    net30: "Depósitos netos, 30 días",
    waitingCashier: "Esperando en caja",
    waitingPayouts: "Retiros de afiliados esperando",
    requests: (n) => `${n} solicitud${n === 1 ? "" : "es"}`,
    platformResult30: "Resultado de la plataforma, 30 días",
    platformResultHint: "En operaciones reales: lo que los traders perdieron menos lo que ganaron. Positivo es de la plataforma.",
    people: "Personas",
    newToday: "Cuentas nuevas hoy",
    new7: "Cuentas nuevas, 7 días",
    activeAffiliates: "Afiliados activos",
    referred: "Cuentas referidas",
    awaitingReview: (n) => `${n} esperando revisión`,
    platform: "Plataforma",
  },
  cashier: {
    kinds: { all: "Todo", deposits: "Depósitos", withdrawals: "Retiros" },
    searchPlaceholder: "Correo o id de la cuenta",
    fee: "Comisión",
    bonus: "Bono",
    payable: "A pagar",
    promo: "Promo",
    kyc: "Verificación",
    via: "Vía afiliado",
    user: "Cuenta",
    cancelled: "cancelado",
    creditsWithBonus: (bonus) => `acredita la billetera, más ${bonus} de bono`,
    kycStates: { NONE: "sin iniciar", PENDING: "pendiente", APPROVED: "verificada", REJECTED: "rechazada" },
    noneMatch: "Nada coincide con estos filtros.",
  },
  finance: {
    heading: "Límites y comisiones",
    lead: "Cuánto puede pasar por la caja, cuánto cuesta un retiro y qué métodos se ofrecen. Las páginas de depósito y retiro, y las rutas detrás, leen esto en cada solicitud.",
    deposits: "Depósitos",
    depositsHint: "Se comprueba cuando se solicita el depósito, no cuando se aprueba.",
    withdrawals: "Retiros",
    withdrawalsHint: "El importe sale del saldo real cuando se solicita y queda retenido hasta que alguien lo resuelva.",
    methods: "Métodos",
    methodsHint: "En el orden en que la caja los lista. Un método puede ofrecer depósitos, retiros o ambos; uno sin ninguno queda oculto.",
    terms: "Términos",
    minDeposit: "Depósito mínimo",
    maxDeposit: "Depósito máximo",
    presets: "Botones de importe",
    presetsHint: "Separados por comas. Se muestran de mayor a menor; los que quedan fuera de los límites se omiten.",
    maxPending: "Depósitos pendientes por persona",
    maxPendingHint: "Cada depósito pendiente es una fila que alguien concilia a mano. 0 significa sin límite.",
    minWithdrawal: "Retiro mínimo",
    maxWithdrawal: "Retiro máximo",
    freeWithdrawals: "Retiros gratis por mes",
    freeWithdrawalsHint: "Se cuentan por mes natural. Después de ellos se aplica la comisión de abajo.",
    feePercent: "Comisión tras los gratis (%)",
    feeFixed: "Comisión fija tras los gratis",
    feeExample: (amount, fee, net) => `Un retiro de ${amount} tras los gratis paga ${net} (comisión ${fee}).`,
    requireKyc: "Exigir verificación aprobada para retirar",
    requireKycHint: "La verificación se aprueba en Usuarios. Los depósitos nunca se bloquean por esto.",
    termsUrl: "Enlace de Términos y Condiciones",
    termsUrlHint: "A dónde apunta la casilla del depósito. Vacío muestra el texto sin enlace.",
    id: "Id",
    name: "Nombre",
    days: "Plazo",
    kind: "Tipo",
    bank: "Banco / PIX",
    crypto: "Cripto",
    deposit: "Depósito",
    withdrawal: "Retiro",
    add: "Añadir método",
    remove: "Quitar",
    up: "Subir",
    down: "Bajar",
    saved: "Guardado. La caja usa estos valores desde la próxima solicitud.",
    saveFailed: "No se pudo guardar.",
  },
  users: {
    heading: "Usuarios",
    lead: "Todas las cuentas, con sus billeteras, su verificación y quién las refirió.",
    searchPlaceholder: "Correo, nombre, teléfono o id",
    account: "Cuenta",
    registered: "Registro",
    verification: "Verificación",
    real: "Real",
    practice: "Práctica",
    referredBy: "Referido por",
    status: "Estado",
    active: "Activa",
    closed: "Desactivada",
    admin: "Admin",
    disable: "Desactivar",
    enable: "Activar",
    kyc: { NONE: "Sin iniciar", PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada" },
    none: "Ninguna cuenta coincide.",
    filters: { all: "Todos", kycPending: "Verificación pendiente", referred: "Referidos", closed: "Desactivados" },
    confirmDisable: "¿Desactivar esta cuenta? Sale del trading y no puede volver a entrar.",
    twoFactor: "2FA",
    resetTwoFactor: "Restablecer 2FA",
    confirmResetTwoFactor: "¿Desactivar la verificación en dos pasos de esta cuenta? Hazlo solo tras confirmar quién lo pide.",
    reviewKyc: "Revisar documentos",
  },
  affiliates: {
    heading: "Afiliados",
    lead: "Quién trae personas a la plataforma, qué hicieron esas personas y cuánto ganó cada afiliado.",
    programLink: "Términos del programa",
    payoutsLink: "Retiros",
    status: { PENDING: "Pendiente", ACTIVE: "Activo", SUSPENDED: "Suspendido" },
    plans: { CPA: "CPA", REVSHARE: "Revenue share", HYBRID: "Híbrido (CPA + RevShare)" },
    programDefault: (label) => `Por defecto del programa (${label})`,
    followsProgram: "por defecto del programa",
    affiliate: "Afiliado",
    code: "Código",
    plan: "Plan",
    clicks: "Clics",
    signups: "Registros",
    ftds: "Primeros depósitos",
    deposits: "Depósitos",
    earned: "Ganado",
    balance: "Saldo",
    joined: "Desde",
    searchPlaceholder: "Correo o código",
    none: "Aún no hay afiliados.",
    add: "Convertir en afiliado",
    addPlaceholder: "Correo de la cuenta",
    addHint: "Convierte una cuenta existente en afiliado activo, con los términos del programa.",
    back: "Todos los afiliados",
    performance: "Rendimiento",
    terms: "Términos",
    uniqueClicks: "Visitantes únicos",
    conversion: "Conversión",
    ftdAmount: "Volumen del primer depósito",
    withdrawals: "Retiros",
    netDeposits: "Depósitos netos",
    turnover: "Volumen real",
    platformResult: "Resultado de la plataforma",
    cpa: "CPA",
    revshare: "Revenue share",
    adjustments: "Ajustes",
    held: "Retenido",
    available: "Disponible",
    paid: "Pagado",
    pendingPayouts: "Retiros esperando",
    cpaAmount: "Importe del CPA",
    revsharePercent: "Revenue share (%)",
    defaultHint: "Vacío usa el del programa.",
    postbackUrl: "URL de postback",
    note: "Nota interna",
    noteHint: "Solo la ven los administradores.",
    approve: "Aprobar",
    suspend: "Suspender",
    reactivate: "Reactivar",
    trackingLink: "Enlace de seguimiento",
    tabs: { referrals: "Referidos", commissions: "Extracto", payouts: "Retiros", clicks: "Clics", subIds: "Sub-ids", postbacks: "Postbacks" },
    user: "Cuenta",
    registered: "Registro",
    sub: "Sub-id",
    ip: "IP",
    ftd: "Primer depósito",
    result: "Resultado de la plataforma",
    when: "Cuándo",
    kind: "Tipo",
    base: "Base",
    rate: "Tasa",
    amount: "Importe",
    availableAt: "Disponible desde",
    state: "Estado",
    kinds: { CPA: "CPA", REVSHARE: "RevShare", ADJUSTMENT: "Ajuste" },
    states: { held: "Retenido", available: "Disponible", reversed: "Revertido" },
    reverse: "Revertir",
    restore: "Restaurar",
    adjustTitle: "Ajuste manual",
    adjustAmount: "Importe (negativo para descontar)",
    adjustNote: "Motivo",
    adjustAdd: "Añadir al extracto",
    source: "Origen",
    landing: "Página de entrada",
    referer: "Vino de",
    country: "País",
    browser: "Navegador",
    noSub: "(ninguno)",
    event: "Evento",
    httpStatus: "HTTP",
    url: "URL",
    error: "Error",
    noPostbackUrl: "No hay URL de postback configurada.",
    nothingYet: "Nada todavía.",
    rows: (n) => `Las listas muestran hasta los ${n} más recientes.`,
  },
  program: {
    heading: "Programa de afiliados",
    lead: "Los términos de todo afiliado al que no se le hayan dado unos propios. Cambiar una cifra aquí cambia lo que se acumula desde ahora; lo ya ganado queda como estaba.",
    general: "General",
    enabled: "Programa abierto",
    enabledHint: "Cerrado, nadie nuevo se une y los enlaces dejan de registrar clics nuevos. Lo ganado sigue siendo retirable.",
    autoApprove: "Aprobar nuevos afiliados automáticamente",
    autoApproveHint: "Desactivado, la solicitud para unirse espera en Afiliados hasta que alguien la apruebe.",
    plan: "Plan por defecto",
    planHint: "CPA paga una vez por persona que califica; revenue share paga una parte del resultado de la plataforma en sus operaciones reales; híbrido paga ambos.",
    cpa: "CPA",
    cpaAmount: "Importe del CPA",
    cpaMinDeposit: "Depósito para calificar",
    cpaMinDepositHint: "Cuánto debe haber depositado la persona referida, en depósitos aprobados, antes de pagar el CPA.",
    cpaMinTurnover: "Volumen para calificar",
    cpaMinTurnoverHint: "Y apostado en operaciones reales. 0 no lo exige.",
    revshare: "Revenue share",
    revsharePercent: "Revenue share (%)",
    revshareHint: "De lo que los referidos pierden menos lo que ganan, solo en operaciones reales. Puede subir y bajar.",
    payouts: "Retiros y seguimiento",
    holdDays: "Periodo de retención (días)",
    holdDaysHint: "Una comisión espera este tiempo antes de poder retirarse, para detectar antes un depósito problemático.",
    minPayout: "Retiro mínimo de afiliado",
    minPayoutHint: "El menor importe que un afiliado puede pedir cobrar.",
    cookieDays: "Duración de la cookie (días)",
    cookieDaysHint: "Cuánto se recuerda un clic antes del registro. Gana el último clic.",
    currency: "Moneda",
    terms: "Términos mostrados a los afiliados",
    termsHint: "Texto simple, mostrado en la página de adhesión. Las líneas en blanco separan párrafos.",
    tracking: "Cómo funciona el seguimiento",
    trackingBody: "El enlace de un afiliado es cualquier página de este sitio con ?ref=CODIGO, opcionalmente con &sub= para su propia etiqueta y los parámetros utm_ habituales. La visita se registra, el navegador la recuerda y la cuenta creada desde ella es del afiliado.",
    macros: "Macros del postback: {event} {click_id} {sub_id} {user_id} {amount} {currency}",
    saved: "Guardado. Las nuevas comisiones se acumulan con estos términos.",
    saveFailed: "No se pudo guardar.",
  },
  kyc: {
    heading: "Verificación (KYC)",
    lead: "Documentos de identidad pendientes de revisión. Compara las fotos con lo que la persona declaró — nombre, fecha de nacimiento, nacionalidad — y entre sí: la selfie debe mostrar la misma cara sosteniendo el mismo documento. Rechazar exige un motivo; es lo que la persona lee en su página de verificación.",
    queueTab: "Envíos",
    rulesTab: "Documentos aceptados",
    searchPlaceholder: "Correo, id de cuenta o número de documento",
    nothingWaiting: "Nada pendiente de revisión.",
    noneMatch: "Ningún envío coincide.",
    declared: "Declarado",
    document: "Documento",
    name: "Nombre",
    birth: "Fecha de nacimiento",
    age: (years) => `${years} años`,
    minor: "Menor de 18",
    citizenship: "Nacionalidad",
    usPerson: "US person",
    country: "País emisor",
    countryMismatch: "distinto de la nacionalidad",
    type: "Tipo",
    number: "Número",
    submitted: "Enviado",
    attempts: (n) => (n === 1 ? "1 intento anterior" : `${n} intentos anteriores`),
    sameDocument: (accounts) => `Mismo documento en la cuenta ${accounts}`,
    front: "Anverso",
    back: "Reverso",
    selfie: "Selfie con documento",
    openFull: "Abrir a tamaño real",
    missing: "No enviado",
    reviewed: (who, when) => `Decidido por ${who} el ${when}`,
    reason: "Motivo",
    reasonPlaceholder: "Qué estaba mal, en palabras con las que la persona pueda actuar",
    presets: [
      "La foto está borrosa o cortada — todas las esquinas y líneas deben ser legibles.",
      "El documento está vencido.",
      "La selfie debe mostrar tu cara y el mismo documento, sostenido al lado.",
      "El nombre del documento no coincide con el de tu cuenta.",
      "La fecha de nacimiento no coincide con la de tu cuenta.",
      "Este tipo de documento no se acepta para tu país.",
    ],
    approve: "Aprobar",
    reject: "Rechazar",
    confirmApprove: "¿Aprobar esta identidad? La cuenta queda verificada y puede retirar.",
    needReason: "Escribe el motivo primero — la persona lo leerá.",
    docTypes: { ID_CARD: "Documento de identidad", DRIVERS_LICENSE: "Licencia de conducir", PASSPORT: "Pasaporte", RESIDENCE_PERMIT: "Permiso de residencia" },
    rulesTitle: "Documentos aceptados por país",
    rulesLead: "Los países que ofrece el formulario de verificación y los documentos que cada uno puede enviar. Un país fuera de la lista no puede verificarse.",
    noBack: "El pasaporte se envía sin reverso; todos los demás documentos necesitan ambas caras.",
    addCountry: "Añadir país",
    addCountryHint: "Código ISO de dos letras, p. ej. UY",
    remove: "Quitar",
    save: "Guardar",
    saved: "Guardado.",
    needOneDocument: (country) => `${country} necesita al menos un documento.`,
    unknownCountry: "Eso no es un código de país de dos letras.",
    duplicate: "Ese país ya está en la lista.",
  },
  payouts: {
    heading: "Retiros de afiliados",
    lead: "Afiliados pidiendo cobrar. El importe salió de su saldo al pedirlo; aprobar dice que se envió, rechazar lo devuelve. Nada aquí envía dinero.",
    waiting: (n) => `Esperando (${n})`,
    nothing: "Nada esperando.",
    settled: "Resueltos",
    nothingSettled: "Nada resuelto todavía.",
    affiliate: "Afiliado",
    amount: "Importe",
    method: "Método",
    destination: "Destino",
    requested: "Solicitado",
    status: "Estado",
    note: "Nota",
    availableNow: "Saldo después de esto",
    approveEffect: "lo marca como pagado",
    rejectEffect: "lo devuelve al saldo",
  },
};

const DICTIONARIES: Record<AvalonLocale, AdminMoneyCopy> = { en, pt, es };

/** The copy for one locale, falling back to English for an unknown one. */
export function adminMoneyCopy(locale: string): AdminMoneyCopy {
  return DICTIONARIES[locale as AvalonLocale] ?? en;
}
