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
    usingBuilt: string;
    chooseFile: string;
    revert: string;
    reachNote: string;
    saved: string;
    saveFailed: string;
    uploadFailed: string;
  };
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
    usingBuilt: "Using the built-in logo",
    chooseFile: "Upload an image",
    revert: "Use the built-in one",
    reachNote: "PNG, JPG or SVG, up to 2 MB. An SVG carrying script is refused rather than cleaned. The traderoom reads its logo from the same place, so a change here reaches the chart's corner within a reload.",
    saved: "Saved.",
    saveFailed: "Could not save that.",
    uploadFailed: "Could not upload that image.",
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
    usingBuilt: "Usando o logo original",
    chooseFile: "Enviar uma imagem",
    revert: "Voltar ao original",
    reachNote: "PNG, JPG ou SVG, até 2 MB. Um SVG com script é recusado, não limpo. O traderoom lê o logo do mesmo lugar, então a troca aqui chega ao canto do gráfico no próximo carregamento.",
    saved: "Salvo.",
    saveFailed: "Não foi possível salvar.",
    uploadFailed: "Não foi possível enviar a imagem.",
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
    usingBuilt: "Usando el logo original",
    chooseFile: "Subir una imagen",
    revert: "Volver al original",
    reachNote: "PNG, JPG o SVG, hasta 2 MB. Un SVG con script se rechaza, no se limpia. El traderoom lee su logo del mismo sitio, así que el cambio llega a la esquina del gráfico en la siguiente carga.",
    saved: "Guardado.",
    saveFailed: "No se pudo guardar.",
    uploadFailed: "No se pudo subir la imagen.",
  },
};

const DICTIONARIES: Record<AvalonLocale, AdminCopy> = { en, pt, es };

/** The copy for one locale, falling back to English for an unknown one. */
export function adminCopy(locale: string): AdminCopy {
  return DICTIONARIES[locale as AvalonLocale] ?? en;
}
