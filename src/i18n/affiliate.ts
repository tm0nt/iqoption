/**
 * Copy for the affiliate area of the cabinet.
 *
 * Written for this platform; nothing here comes from the engine's dictionary,
 * which has no affiliate programme in it.
 */
import type { AvalonLocale } from "@/types/avalon-login";

export type AffiliateCopy = {
  title: string;
  lead: string;
  closed: string;
  joinTitle: string;
  joinBody: string;
  howItWorks: string;
  steps: [string, string, string];
  cpaTerm: (amount: string, minimum: string) => string;
  revshareTerm: (percent: string) => string;
  holdTerm: (days: number) => string;
  minPayoutTerm: (amount: string) => string;
  programTerms: string;
  join: string;
  joining: string;
  joinFailed: string;
  pendingTitle: string;
  pendingBody: string;
  suspendedTitle: string;
  suspendedBody: (email: string) => string;
  yourTerms: string;
  tabs: { overview: string; links: string; referrals: string; commissions: string; payouts: string; postback: string };
  periods: { today: string; "7d": string; "30d": string; all: string };
  clicks: string;
  uniqueClicks: string;
  signups: string;
  conversion: string;
  ftds: string;
  ftdAmount: string;
  deposits: string;
  earned: string;
  cpa: string;
  revshare: string;
  adjustments: string;
  available: string;
  held: string;
  paid: string;
  pending: string;
  last30: string;
  legendClicks: string;
  legendSignups: string;
  legendEarned: string;
  yourCode: string;
  yourLink: string;
  copy: string;
  copied: string;
  builder: string;
  builderBody: string;
  landing: string;
  landings: { register: string; login: string };
  sub: string;
  subHint: string;
  utmHint: string;
  bySub: string;
  noSub: string;
  account: string;
  registered: string;
  firstDeposit: string;
  noDeposit: string;
  noReferrals: string;
  date: string;
  type: string;
  base: string;
  amount: string;
  availableFrom: string;
  state: string;
  kinds: Record<"CPA" | "REVSHARE" | "ADJUSTMENT", string>;
  states: { held: string; available: string; reversed: string };
  noCommissions: string;
  requestTitle: string;
  method: string;
  destination: string;
  request: string;
  sending: string;
  requested: string;
  belowMin: (min: string) => string;
  insufficient: (available: string) => string;
  inactive: string;
  noPayouts: string;
  payoutsHistory: string;
  postbackTitle: string;
  postbackBody: string;
  postbackUrl: string;
  save: string;
  saved: string;
  invalidUrl: (reason: string) => string;
  postbackLog: string;
  event: string;
  status: string;
  noPostbacks: string;
  unreachable: string;
  showing: (n: number) => string;
};

const en: AffiliateCopy = {
  title: "Affiliate Program",
  lead: "Invite people to the platform and earn from what they do on it.",
  closed: "The affiliate program is not taking new members right now.",
  joinTitle: "Earn by inviting traders",
  joinBody: "Share your link. Everyone who opens an account through it is yours, and you are paid on what they do — tracked from the first click.",
  howItWorks: "How it works",
  steps: ["Join and get your link.", "Share it wherever your audience is.", "Earn on every person who signs up and trades."],
  cpaTerm: (amount, minimum) => `${amount} for each person you bring who deposits at least ${minimum}.`,
  revshareTerm: (percent) => `${percent} of the platform's result on the real trades of the people you bring.`,
  holdTerm: (days) => `Commissions are held for ${days} day${days === 1 ? "" : "s"} before they can be withdrawn.`,
  minPayoutTerm: (amount) => `The smallest withdrawal is ${amount}.`,
  programTerms: "Program terms",
  join: "Join the program",
  joining: "Joining…",
  joinFailed: "Could not join. Try again in a moment.",
  pendingTitle: "Your application is being reviewed",
  pendingBody: "Your link starts tracking as soon as it is approved. You do not need to do anything else.",
  suspendedTitle: "Your affiliate account is suspended",
  suspendedBody: (email) => `Your links are not tracking new visits and withdrawals are paused. Write to ${email} to find out more.`,
  yourTerms: "Your terms",
  tabs: { overview: "Overview", links: "Links", referrals: "Referrals", commissions: "Commissions", payouts: "Withdrawals", postback: "Postback" },
  periods: { today: "Today", "7d": "7 days", "30d": "30 days", all: "All time" },
  clicks: "Clicks",
  uniqueClicks: "Unique visitors",
  signups: "Sign-ups",
  conversion: "Conversion",
  ftds: "First deposits",
  ftdAmount: "First deposit volume",
  deposits: "Deposits",
  earned: "Earned",
  cpa: "CPA",
  revshare: "Revenue share",
  adjustments: "Adjustments",
  available: "Available",
  held: "On hold",
  paid: "Paid out",
  pending: "Withdrawals waiting",
  last30: "Last 30 days",
  legendClicks: "Clicks",
  legendSignups: "Sign-ups",
  legendEarned: "Earned",
  yourCode: "Your code",
  yourLink: "Your link",
  copy: "Copy",
  copied: "Copied",
  builder: "Link builder",
  builderBody: "Add a sub-id to tell your sources apart. Any page of the site works with ?ref= on it.",
  landing: "Page",
  landings: { register: "Registration", login: "Sign in" },
  sub: "Sub-id",
  subHint: "Your own label: a campaign, a channel, your tracker's click id. It comes back in reports and in postbacks.",
  utmHint: "utm_source, utm_medium and utm_campaign are recorded too.",
  bySub: "By sub-id",
  noSub: "(none)",
  account: "Account",
  registered: "Registered",
  firstDeposit: "First deposit",
  noDeposit: "Not yet",
  noReferrals: "Nobody has signed up through your link yet.",
  date: "Date",
  type: "Type",
  base: "Based on",
  amount: "Amount",
  availableFrom: "Available from",
  state: "State",
  kinds: { CPA: "CPA", REVSHARE: "Revenue share", ADJUSTMENT: "Adjustment" },
  states: { held: "On hold", available: "Available", reversed: "Reversed" },
  noCommissions: "No commissions yet.",
  requestTitle: "Request a withdrawal",
  method: "Method",
  destination: "Where to send it",
  request: "Request withdrawal",
  sending: "Sending…",
  requested: "Your request is with us. The amount is held out of your balance until it is reviewed.",
  belowMin: (min) => `The smallest withdrawal is ${min}.`,
  insufficient: (available) => `That is more than you have available (${available}).`,
  inactive: "Withdrawals are paused while your affiliate account is not active.",
  noPayouts: "No withdrawals yet.",
  payoutsHistory: "Your withdrawals",
  postbackTitle: "Postback URL",
  postbackBody: "We call this address on each registration, first deposit and CPA, so your own tracker sees conversions. Macros:",
  postbackUrl: "URL",
  save: "Save",
  saved: "Saved.",
  invalidUrl: (reason) => `That address cannot be used: ${reason}.`,
  postbackLog: "Recent calls",
  event: "Event",
  status: "Status",
  noPostbacks: "No calls yet.",
  unreachable: "Could not reach the server.",
  showing: (n) => `The latest ${n}.`,
};

const pt: AffiliateCopy = {
  title: "Programa de Afiliados",
  lead: "Convide pessoas para a plataforma e ganhe com o que elas fazem nela.",
  closed: "O programa de afiliados não está aceitando novos membros agora.",
  joinTitle: "Ganhe convidando traders",
  joinBody: "Compartilhe seu link. Toda pessoa que abrir conta por ele é sua, e você ganha com o que ela faz — rastreado desde o primeiro clique.",
  howItWorks: "Como funciona",
  steps: ["Entre e receba seu link.", "Compartilhe onde estiver seu público.", "Ganhe com cada pessoa que se cadastrar e operar."],
  cpaTerm: (amount, minimum) => `${amount} por pessoa indicada que depositar pelo menos ${minimum}.`,
  revshareTerm: (percent) => `${percent} do resultado da plataforma nas operações reais das pessoas que você indicar.`,
  holdTerm: (days) => `As comissões ficam retidas por ${days} dia${days === 1 ? "" : "s"} antes de poderem ser sacadas.`,
  minPayoutTerm: (amount) => `O saque mínimo é ${amount}.`,
  programTerms: "Termos do programa",
  join: "Entrar no programa",
  joining: "Entrando…",
  joinFailed: "Não foi possível entrar. Tente de novo em instantes.",
  pendingTitle: "Seu pedido está em análise",
  pendingBody: "Seu link começa a rastrear assim que for aprovado. Você não precisa fazer mais nada.",
  suspendedTitle: "Sua conta de afiliado está suspensa",
  suspendedBody: (email) => `Seus links não estão rastreando novas visitas e os saques estão pausados. Escreva para ${email} para saber mais.`,
  yourTerms: "Seus termos",
  tabs: { overview: "Visão geral", links: "Links", referrals: "Indicados", commissions: "Comissões", payouts: "Saques", postback: "Postback" },
  periods: { today: "Hoje", "7d": "7 dias", "30d": "30 dias", all: "Todo o período" },
  clicks: "Cliques",
  uniqueClicks: "Visitantes únicos",
  signups: "Cadastros",
  conversion: "Conversão",
  ftds: "Primeiros depósitos",
  ftdAmount: "Volume do primeiro depósito",
  deposits: "Depósitos",
  earned: "Ganho",
  cpa: "CPA",
  revshare: "Revenue share",
  adjustments: "Ajustes",
  available: "Disponível",
  held: "Retido",
  paid: "Sacado",
  pending: "Saques em análise",
  last30: "Últimos 30 dias",
  legendClicks: "Cliques",
  legendSignups: "Cadastros",
  legendEarned: "Ganho",
  yourCode: "Seu código",
  yourLink: "Seu link",
  copy: "Copiar",
  copied: "Copiado",
  builder: "Gerador de links",
  builderBody: "Adicione um sub-id para separar suas origens. Qualquer página do site funciona com ?ref= nela.",
  landing: "Página",
  landings: { register: "Cadastro", login: "Login" },
  sub: "Sub-id",
  subHint: "Sua própria etiqueta: uma campanha, um canal, o click id do seu rastreador. Ela volta nos relatórios e nos postbacks.",
  utmHint: "utm_source, utm_medium e utm_campaign também são registrados.",
  bySub: "Por sub-id",
  noSub: "(nenhum)",
  account: "Conta",
  registered: "Cadastro",
  firstDeposit: "Primeiro depósito",
  noDeposit: "Ainda não",
  noReferrals: "Ninguém se cadastrou pelo seu link ainda.",
  date: "Data",
  type: "Tipo",
  base: "Base",
  amount: "Valor",
  availableFrom: "Disponível em",
  state: "Situação",
  kinds: { CPA: "CPA", REVSHARE: "Revenue share", ADJUSTMENT: "Ajuste" },
  states: { held: "Retido", available: "Disponível", reversed: "Estornado" },
  noCommissions: "Nenhuma comissão ainda.",
  requestTitle: "Solicitar saque",
  method: "Meio",
  destination: "Para onde enviar",
  request: "Solicitar saque",
  sending: "Enviando…",
  requested: "Recebemos seu pedido. O valor fica retido do seu saldo até a análise.",
  belowMin: (min) => `O saque mínimo é ${min}.`,
  insufficient: (available) => `Isso é mais do que você tem disponível (${available}).`,
  inactive: "Os saques ficam pausados enquanto sua conta de afiliado não estiver ativa.",
  noPayouts: "Nenhum saque ainda.",
  payoutsHistory: "Seus saques",
  postbackTitle: "URL de postback",
  postbackBody: "Chamamos este endereço a cada cadastro, primeiro depósito e CPA, para que seu rastreador veja as conversões. Macros:",
  postbackUrl: "URL",
  save: "Salvar",
  saved: "Salvo.",
  invalidUrl: (reason) => `Esse endereço não pode ser usado: ${reason}.`,
  postbackLog: "Chamadas recentes",
  event: "Evento",
  status: "Situação",
  noPostbacks: "Nenhuma chamada ainda.",
  unreachable: "Não foi possível falar com o servidor.",
  showing: (n) => `Os ${n} mais recentes.`,
};

const es: AffiliateCopy = {
  title: "Programa de Afiliados",
  lead: "Invita personas a la plataforma y gana con lo que hacen en ella.",
  closed: "El programa de afiliados no acepta nuevos miembros ahora mismo.",
  joinTitle: "Gana invitando traders",
  joinBody: "Comparte tu enlace. Cada persona que abra una cuenta con él es tuya, y ganas con lo que hace — con seguimiento desde el primer clic.",
  howItWorks: "Cómo funciona",
  steps: ["Únete y recibe tu enlace.", "Compártelo donde esté tu público.", "Gana con cada persona que se registre y opere."],
  cpaTerm: (amount, minimum) => `${amount} por cada persona referida que deposite al menos ${minimum}.`,
  revshareTerm: (percent) => `${percent} del resultado de la plataforma en las operaciones reales de las personas que traigas.`,
  holdTerm: (days) => `Las comisiones quedan retenidas ${days} día${days === 1 ? "" : "s"} antes de poder retirarse.`,
  minPayoutTerm: (amount) => `El retiro mínimo es ${amount}.`,
  programTerms: "Términos del programa",
  join: "Unirme al programa",
  joining: "Uniéndote…",
  joinFailed: "No se pudo completar. Inténtalo de nuevo en un momento.",
  pendingTitle: "Tu solicitud está en revisión",
  pendingBody: "Tu enlace empieza a registrar en cuanto se apruebe. No necesitas hacer nada más.",
  suspendedTitle: "Tu cuenta de afiliado está suspendida",
  suspendedBody: (email) => `Tus enlaces no registran visitas nuevas y los retiros están en pausa. Escribe a ${email} para saber más.`,
  yourTerms: "Tus términos",
  tabs: { overview: "Resumen", links: "Enlaces", referrals: "Referidos", commissions: "Comisiones", payouts: "Retiros", postback: "Postback" },
  periods: { today: "Hoy", "7d": "7 días", "30d": "30 días", all: "Todo el periodo" },
  clicks: "Clics",
  uniqueClicks: "Visitantes únicos",
  signups: "Registros",
  conversion: "Conversión",
  ftds: "Primeros depósitos",
  ftdAmount: "Volumen del primer depósito",
  deposits: "Depósitos",
  earned: "Ganado",
  cpa: "CPA",
  revshare: "Revenue share",
  adjustments: "Ajustes",
  available: "Disponible",
  held: "Retenido",
  paid: "Retirado",
  pending: "Retiros en revisión",
  last30: "Últimos 30 días",
  legendClicks: "Clics",
  legendSignups: "Registros",
  legendEarned: "Ganado",
  yourCode: "Tu código",
  yourLink: "Tu enlace",
  copy: "Copiar",
  copied: "Copiado",
  builder: "Generador de enlaces",
  builderBody: "Añade un sub-id para distinguir tus orígenes. Cualquier página del sitio funciona con ?ref= en ella.",
  landing: "Página",
  landings: { register: "Registro", login: "Acceso" },
  sub: "Sub-id",
  subHint: "Tu propia etiqueta: una campaña, un canal, el click id de tu tracker. Vuelve en los informes y en los postbacks.",
  utmHint: "También se registran utm_source, utm_medium y utm_campaign.",
  bySub: "Por sub-id",
  noSub: "(ninguno)",
  account: "Cuenta",
  registered: "Registro",
  firstDeposit: "Primer depósito",
  noDeposit: "Todavía no",
  noReferrals: "Nadie se ha registrado con tu enlace todavía.",
  date: "Fecha",
  type: "Tipo",
  base: "Base",
  amount: "Importe",
  availableFrom: "Disponible desde",
  state: "Estado",
  kinds: { CPA: "CPA", REVSHARE: "Revenue share", ADJUSTMENT: "Ajuste" },
  states: { held: "Retenido", available: "Disponible", reversed: "Revertido" },
  noCommissions: "Aún no hay comisiones.",
  requestTitle: "Solicitar retiro",
  method: "Método",
  destination: "A dónde enviarlo",
  request: "Solicitar retiro",
  sending: "Enviando…",
  requested: "Tenemos tu solicitud. El importe queda retenido de tu saldo hasta la revisión.",
  belowMin: (min) => `El retiro mínimo es ${min}.`,
  insufficient: (available) => `Eso es más de lo que tienes disponible (${available}).`,
  inactive: "Los retiros están en pausa mientras tu cuenta de afiliado no esté activa.",
  noPayouts: "Aún no hay retiros.",
  payoutsHistory: "Tus retiros",
  postbackTitle: "URL de postback",
  postbackBody: "Llamamos a esta dirección en cada registro, primer depósito y CPA, para que tu tracker vea las conversiones. Macros:",
  postbackUrl: "URL",
  save: "Guardar",
  saved: "Guardado.",
  invalidUrl: (reason) => `Esa dirección no se puede usar: ${reason}.`,
  postbackLog: "Llamadas recientes",
  event: "Evento",
  status: "Estado",
  noPostbacks: "Aún no hay llamadas.",
  unreachable: "No se pudo contactar con el servidor.",
  showing: (n) => `Los ${n} más recientes.`,
};

const DICTIONARIES: Record<AvalonLocale, AffiliateCopy> = { en, pt, es };

export function affiliateCopy(locale: string): AffiliateCopy {
  return DICTIONARIES[locale as AvalonLocale] ?? en;
}
