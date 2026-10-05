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
};

const DICTIONARIES: Record<AvalonLocale, CabinetCopy> = { en, pt, es };

/** The copy for one locale, falling back to English for an unknown one. */
export function cabinetCopy(locale: string): CabinetCopy {
  return DICTIONARIES[locale as AvalonLocale] ?? en;
}
