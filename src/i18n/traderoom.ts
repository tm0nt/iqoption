import type { AvalonLocale } from "@/types/avalon-login";

/**
 * Copy for the traderoom clone.
 *
 * IMPORTANT — this differs from `avalon.ts`. The live traderoom is a WebGL
 * canvas with no DOM text, and its language follows the signed-in account's
 * setting rather than the URL, so the Spanish and Portuguese strings here could
 * not be read off the site the way the auth-page strings were. English is
 * transcribed verbatim from 1:1 screenshots; `es` and `pt` are translations
 * written for this clone. Treat them as provisional until someone with an
 * account in those languages confirms the official wording.
 */

export interface TraderoomCopy {
  rail: {
    totalPortfolio: string;
    tradingHistory: string;
    chatsSupport: string;
    tutorials: string;
    promo: string;
    tournaments: string;
    webinars: string;
    marketAnalysis: string;
    leaderboard: string;
    more: string;
  };
  topBar: {
    deposit: string;
    openNewAsset: string;
    available: string;
    investment: string;
    whatIsThis: string;
    realAccount: string;
    practiceAccount: string;
    topUp: string;
  };
  profile: {
    tourProgress: string;
    dateRegistered: string;
    userId: string;
    uploadPhoto: string;
    personalData: string;
    depositFunds: string;
    withdrawFunds: string;
    contactSupport: string;
    balanceHistory: string;
    tradingHistory: string;
    settings: string;
    logOut: string;
  };
  trade: {
    invest: string;
    expiration: string;
    profit: string;
    buy: string;
    sell: string;
    info: string;
  };
  portfolio: {
    title: string;
    hidePositions: string;
    showPositions: string;
    empty: string;
    selectAsset: string;
  };
  status: {
    support: string;
    aroundTheClock: string;
    currentTime: string;
  };
  onboarding: {
    title: string;
    createAccount: string;
    selectAsset: string;
    firstForecast: string;
    confirmEmail: string;
    topUp: string;
    deposit: string;
  };
  panels: {
    tradingHistory: { title: string; allPositions: string };
    chatsSupport: { title: string; support: string; schedule: string };
    tutorials: {
      title: string;
      howToTrade: string;
      howToTradeMeta: string;
      interfaceGuide: string;
      interfaceGuideMeta: string;
      videoTutorials: string;
      allVideos: string;
      basics: string;
      marginTrading: string;
      technicalAnalysis: string;
      fundamentalAnalysis: string;
      videos: string;
    };
    promo: { title: string; available: string; history: string; promoCode: string; exclusive: string };
    tournaments: {
      title: string;
      past: string;
      completed: string;
      prizePool: string;
      entryFee: string;
      participants: string;
      instruments: string;
    };
    webinars: { title: string; new: string; history: string; empty: string };
    marketAnalysis: { title: string };
    leaderboard: {
      title: string;
      worldwide: string;
      allInstruments: string;
      noProfit: string;
    };
    help: {
      title: string;
      askQuestion: string;
      general: string;
      trading: string;
      depositing: string;
      withdrawing: string;
      account: string;
      bonus: string;
    };
    alerts: {
      title: string;
      active: string;
      history: string;
      allAlerts: string;
      create: string;
      emptyLead: string;
      emptyLink: string;
      emptyTail: string;
    };
    more: { title: string };
  };
  assetSelector: {
    search: string;
    trending: string;
    upTo5: string;
    upTo15: string;
    longExpiration: string;
    worldwide: string;
    brazil: string;
    tradersChoice: string;
    gainers: string;
    losers: string;
    lastWeek: string;
    profit: string;
    price: string;
    change5min: string;
  };
}

const en: TraderoomCopy = {
  rail: {
    totalPortfolio: "Total portfolio",
    tradingHistory: "Trading history",
    chatsSupport: "Chats & support",
    tutorials: "Tutorials",
    promo: "Promo",
    tournaments: "Tourna-ments",
    webinars: "Webinars",
    marketAnalysis: "Market analysis",
    leaderboard: "Leader board",
    more: "More",
  },
  topBar: {
    deposit: "Deposit",
    openNewAsset: "Open New Asset",
    available: "Available",
    investment: "Investment",
    whatIsThis: "What is this?",
    realAccount: "REAL ACCOUNT",
    practiceAccount: "PRACTICE ACCOUNT",
    topUp: "Top Up",
  },
  profile: {
    tourProgress: "Finish the guided tour to your first real trade",
    dateRegistered: "Date registered",
    userId: "User ID",
    uploadPhoto: "Upload a Photo",
    personalData: "Personal Data",
    depositFunds: "Deposit Funds",
    withdrawFunds: "Withdraw Funds",
    contactSupport: "Contact Support",
    balanceHistory: "Balance History",
    tradingHistory: "Trading History",
    settings: "Settings",
    logOut: "Log Out",
  },
  trade: {
    invest: "Invest",
    expiration: "Expiration",
    profit: "Profit",
    buy: "BUY",
    sell: "SELL",
    info: "Info",
  },
  portfolio: {
    title: "Total portfolio",
    hidePositions: "Hide positions",
    showPositions: "Show positions",
    empty: "You have no open positions yet",
    selectAsset: "Select asset",
  },
  status: {
    support: "SUPPORT",
    aroundTheClock: "EVERY DAY, AROUND THE CLOCK",
    currentTime: "CURRENT TIME:",
  },
  onboarding: {
    title: "A few simple steps to become a Real Trader",
    createAccount: "Create an account",
    selectAsset: "Select an Asset You Like",
    firstForecast: "Your First Forecast",
    confirmEmail: "Confirm Your Email",
    topUp: "Top up your account",
    deposit: "DEPOSIT",
  },
  panels: {
    tradingHistory: { title: "Trading History", allPositions: "All Positions" },
    chatsSupport: {
      title: "Chats & Support",
      support: "Support",
      schedule: "Every day, around the clock",
    },
    tutorials: {
      title: "Tutorials",
      howToTrade: "How to trade?",
      howToTradeMeta: "Up to 15 min",
      interfaceGuide: "Interface guide",
      interfaceGuideMeta: "Quick introduction",
      videoTutorials: "Video Tutorials",
      allVideos: "All Videos",
      basics: "Basics",
      marginTrading: "Margin Trading",
      technicalAnalysis: "Technical Analysis",
      fundamentalAnalysis: "Fundamental Analysis",
      videos: "videos",
    },
    promo: {
      title: "Promo",
      available: "AVAILABLE",
      history: "HISTORY",
      promoCode: "Promo code",
      exclusive: "Exclusive",
    },
    tournaments: {
      title: "Tournaments",
      past: "Past Tournaments",
      completed: "COMPLETED",
      prizePool: "Prize pool",
      entryFee: "Entry fee",
      participants: "Participants",
      instruments: "Instruments",
    },
    webinars: {
      title: "Webinars",
      new: "NEW",
      history: "HISTORY",
      empty: "There are no scheduled webinars",
    },
    marketAnalysis: { title: "Economic Calendar" },
    leaderboard: {
      title: "Leaders of the Week",
      worldwide: "Worldwide",
      allInstruments: "All instruments",
      noProfit: "You have made no profitable trades this week yet",
    },
    help: {
      title: "Help",
      askQuestion: "ASK A QUESTION",
      general: "GENERAL QUESTIONS",
      trading: "TRADING",
      depositing: "DEPOSITING FUNDS",
      withdrawing: "WITHDRAWING FUNDS",
      account: "ACCOUNT",
      bonus: "BONUS",
    },
    alerts: {
      title: "Alerts",
      active: "ACTIVE",
      history: "HISTORY",
      allAlerts: "All alerts",
      create: "Create Alert",
      emptyLead: "No alerts here yet. You can",
      emptyLink: "add an alert",
      emptyTail: "by clicking the button above.",
    },
    more: { title: "More Items" },
  },
  assetSelector: {
    search: "Search by name or ticker",
    trending: "Trending",
    upTo5: "Up to 5 min",
    upTo15: "Up to 15 min",
    longExpiration: "Long Expiration",
    worldwide: "Worldwide",
    brazil: "Brazil",
    tradersChoice: "Trader's choice",
    gainers: "Gainers",
    losers: "Losers",
    lastWeek: "Last week",
    profit: "Profit",
    price: "Price",
    change5min: "5 min change",
  },
};

const es: TraderoomCopy = {
  rail: {
    totalPortfolio: "Portafolio total",
    tradingHistory: "Historial",
    chatsSupport: "Chats y soporte",
    tutorials: "Tutoriales",
    promo: "Promo",
    tournaments: "Torneos",
    webinars: "Webinars",
    marketAnalysis: "Análisis de mercado",
    leaderboard: "Clasificación",
    more: "Más",
  },
  topBar: {
    deposit: "Depositar",
    openNewAsset: "Abrir nuevo activo",
    available: "Disponible",
    investment: "Inversión",
    whatIsThis: "¿Qué es esto?",
    realAccount: "CUENTA REAL",
    practiceAccount: "CUENTA DE PRÁCTICA",
    topUp: "Recargar",
  },
  profile: {
    tourProgress: "Completa la guía hasta tu primera operación real",
    dateRegistered: "Fecha de registro",
    userId: "ID de usuario",
    uploadPhoto: "Subir una foto",
    personalData: "Datos personales",
    depositFunds: "Depositar fondos",
    withdrawFunds: "Retirar fondos",
    contactSupport: "Contactar soporte",
    balanceHistory: "Historial de saldo",
    tradingHistory: "Historial de operaciones",
    settings: "Ajustes",
    logOut: "Cerrar sesión",
  },
  trade: {
    invest: "Invertir",
    expiration: "Expiración",
    profit: "Ganancia",
    buy: "COMPRAR",
    sell: "VENDER",
    info: "Info",
  },
  portfolio: {
    title: "Portafolio total",
    hidePositions: "Ocultar posiciones",
    showPositions: "Mostrar posiciones",
    empty: "Aún no tienes posiciones abiertas",
    selectAsset: "Seleccionar activo",
  },
  status: {
    support: "SOPORTE",
    aroundTheClock: "TODOS LOS DÍAS, LAS 24 HORAS",
    currentTime: "HORA ACTUAL:",
  },
  onboarding: {
    title: "Unos pasos simples para convertirte en un Trader Real",
    createAccount: "Crear una cuenta",
    selectAsset: "Selecciona un activo que te guste",
    firstForecast: "Tu primer pronóstico",
    confirmEmail: "Confirma tu correo",
    topUp: "Recarga tu cuenta",
    deposit: "DEPOSITAR",
  },
  panels: {
    tradingHistory: { title: "Historial de operaciones", allPositions: "Todas las posiciones" },
    chatsSupport: {
      title: "Chats y soporte",
      support: "Soporte",
      schedule: "Todos los días, las 24 horas",
    },
    tutorials: {
      title: "Tutoriales",
      howToTrade: "¿Cómo operar?",
      howToTradeMeta: "Hasta 15 min",
      interfaceGuide: "Guía de la interfaz",
      interfaceGuideMeta: "Introducción rápida",
      videoTutorials: "Videotutoriales",
      allVideos: "Todos los videos",
      basics: "Conceptos básicos",
      marginTrading: "Trading con margen",
      technicalAnalysis: "Análisis técnico",
      fundamentalAnalysis: "Análisis fundamental",
      videos: "videos",
    },
    promo: {
      title: "Promo",
      available: "DISPONIBLES",
      history: "HISTORIAL",
      promoCode: "Código promocional",
      exclusive: "Exclusivo",
    },
    tournaments: {
      title: "Torneos",
      past: "Torneos anteriores",
      completed: "FINALIZADO",
      prizePool: "Premio acumulado",
      entryFee: "Cuota de entrada",
      participants: "Participantes",
      instruments: "Instrumentos",
    },
    webinars: {
      title: "Webinars",
      new: "NUEVOS",
      history: "HISTORIAL",
      empty: "No hay webinars programados",
    },
    marketAnalysis: { title: "Calendario económico" },
    leaderboard: {
      title: "Líderes de la semana",
      worldwide: "Mundial",
      allInstruments: "Todos los instrumentos",
      noProfit: "Aún no has realizado operaciones rentables esta semana",
    },
    help: {
      title: "Ayuda",
      askQuestion: "HACER UNA PREGUNTA",
      general: "PREGUNTAS GENERALES",
      trading: "OPERACIONES",
      depositing: "DEPÓSITO DE FONDOS",
      withdrawing: "RETIRO DE FONDOS",
      account: "CUENTA",
      bonus: "BONO",
    },
    alerts: {
      title: "Alertas",
      active: "ACTIVAS",
      history: "HISTORIAL",
      allAlerts: "Todas las alertas",
      create: "Crear alerta",
      emptyLead: "Aún no hay alertas. Puedes",
      emptyLink: "añadir una alerta",
      emptyTail: "con el botón de arriba.",
    },
    more: { title: "Más elementos" },
  },
  assetSelector: {
    search: "Buscar por nombre o ticker",
    trending: "Tendencias",
    upTo5: "Hasta 5 min",
    upTo15: "Hasta 15 min",
    longExpiration: "Expiración larga",
    worldwide: "Mundial",
    brazil: "Brasil",
    tradersChoice: "Elección de traders",
    gainers: "Ganadores",
    losers: "Perdedores",
    lastWeek: "Semana pasada",
    profit: "Ganancia",
    price: "Precio",
    change5min: "Cambio 5 min",
  },
};

const pt: TraderoomCopy = {
  rail: {
    totalPortfolio: "Portfólio total",
    tradingHistory: "Histórico",
    chatsSupport: "Chats e suporte",
    tutorials: "Tutoriais",
    promo: "Promo",
    tournaments: "Torneios",
    webinars: "Webinars",
    marketAnalysis: "Análise de mercado",
    leaderboard: "Classificação",
    more: "Mais",
  },
  topBar: {
    deposit: "Depositar",
    openNewAsset: "Abrir novo ativo",
    available: "Disponível",
    investment: "Investimento",
    whatIsThis: "O que é isso?",
    realAccount: "CONTA REAL",
    practiceAccount: "CONTA DE PRÁTICA",
    topUp: "Recarregar",
  },
  profile: {
    tourProgress: "Conclua o tour guiado até sua primeira operação real",
    dateRegistered: "Data de registro",
    userId: "ID do usuário",
    uploadPhoto: "Enviar uma foto",
    personalData: "Dados pessoais",
    depositFunds: "Depositar fundos",
    withdrawFunds: "Sacar fundos",
    contactSupport: "Contatar suporte",
    balanceHistory: "Histórico de saldo",
    tradingHistory: "Histórico de operações",
    settings: "Configurações",
    logOut: "Sair",
  },
  trade: {
    invest: "Investir",
    expiration: "Expiração",
    profit: "Lucro",
    buy: "COMPRAR",
    sell: "VENDER",
    info: "Info",
  },
  portfolio: {
    title: "Portfólio total",
    hidePositions: "Ocultar posições",
    showPositions: "Mostrar posições",
    empty: "Você ainda não tem posições abertas",
    selectAsset: "Selecionar ativo",
  },
  status: {
    support: "SUPORTE",
    aroundTheClock: "TODOS OS DIAS, 24 HORAS",
    currentTime: "HORA ATUAL:",
  },
  onboarding: {
    title: "Alguns passos simples para se tornar um Trader Real",
    createAccount: "Criar uma conta",
    selectAsset: "Selecione um ativo de que goste",
    firstForecast: "Sua primeira previsão",
    confirmEmail: "Confirme seu e-mail",
    topUp: "Recarregue sua conta",
    deposit: "DEPOSITAR",
  },
  panels: {
    tradingHistory: { title: "Histórico de operações", allPositions: "Todas as posições" },
    chatsSupport: {
      title: "Chats e suporte",
      support: "Suporte",
      schedule: "Todos os dias, 24 horas",
    },
    tutorials: {
      title: "Tutoriais",
      howToTrade: "Como operar?",
      howToTradeMeta: "Até 15 min",
      interfaceGuide: "Guia da interface",
      interfaceGuideMeta: "Introdução rápida",
      videoTutorials: "Vídeo tutoriais",
      allVideos: "Todos os vídeos",
      basics: "Básico",
      marginTrading: "Trading com margem",
      technicalAnalysis: "Análise técnica",
      fundamentalAnalysis: "Análise fundamentalista",
      videos: "vídeos",
    },
    promo: {
      title: "Promo",
      available: "DISPONÍVEIS",
      history: "HISTÓRICO",
      promoCode: "Código promocional",
      exclusive: "Exclusivo",
    },
    tournaments: {
      title: "Torneios",
      past: "Torneios anteriores",
      completed: "FINALIZADO",
      prizePool: "Prêmio total",
      entryFee: "Taxa de entrada",
      participants: "Participantes",
      instruments: "Instrumentos",
    },
    webinars: {
      title: "Webinars",
      new: "NOVOS",
      history: "HISTÓRICO",
      empty: "Não há webinars agendados",
    },
    marketAnalysis: { title: "Calendário econômico" },
    leaderboard: {
      title: "Líderes da semana",
      worldwide: "Mundial",
      allInstruments: "Todos os instrumentos",
      noProfit: "Você ainda não fez operações lucrativas esta semana",
    },
    help: {
      title: "Ajuda",
      askQuestion: "FAZER UMA PERGUNTA",
      general: "PERGUNTAS GERAIS",
      trading: "OPERAÇÕES",
      depositing: "DEPÓSITO DE FUNDOS",
      withdrawing: "SAQUE DE FUNDOS",
      account: "CONTA",
      bonus: "BÔNUS",
    },
    alerts: {
      title: "Alertas",
      active: "ATIVOS",
      history: "HISTÓRICO",
      allAlerts: "Todos os alertas",
      create: "Criar alerta",
      emptyLead: "Ainda não há alertas. Você pode",
      emptyLink: "adicionar um alerta",
      emptyTail: "usando o botão acima.",
    },
    more: { title: "Mais itens" },
  },
  assetSelector: {
    search: "Buscar por nome ou ticker",
    trending: "Em alta",
    upTo5: "Até 5 min",
    upTo15: "Até 15 min",
    longExpiration: "Expiração longa",
    worldwide: "Mundial",
    brazil: "Brasil",
    tradersChoice: "Escolha dos traders",
    gainers: "Em alta",
    losers: "Em baixa",
    lastWeek: "Semana passada",
    profit: "Lucro",
    price: "Preço",
    change5min: "Variação 5 min",
  },
};

export const TRADEROOM_COPY: Record<AvalonLocale, TraderoomCopy> = { en, es, pt };

export function getTraderoomCopy(locale: AvalonLocale): TraderoomCopy {
  return TRADEROOM_COPY[locale];
}
