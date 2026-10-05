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
};

const DICTIONARIES: Record<AvalonLocale, CabinetCopy> = { en, pt, es };

/** The copy for one locale, falling back to English for an unknown one. */
export function cabinetCopy(locale: string): CabinetCopy {
  return DICTIONARIES[locale as AvalonLocale] ?? en;
}
