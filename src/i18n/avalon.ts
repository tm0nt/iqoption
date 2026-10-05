import type { AvalonDictionary, AvalonLocale } from "@/types/avalon-login";

/**
 * Copy for every Avalon auth page, in the three locales the site's own language
 * menu offers. Every string was read from the corresponding live page
 * (trade.avalonbroker.com/{en,es,pt}/{login,register,change-password}) rather than
 * machine-translated, so the clone reads exactly like the original in each locale.
 */

export const LOCALES = ["en", "es", "pt"] as const;

export const DEFAULT_LOCALE: AvalonLocale = "en";

/** Labels shown inside the language dropdown, in the order the site lists them. */
export const LOCALE_LABELS: Record<AvalonLocale, string> = {
  en: "English",
  es: "Espa\u00f1ol",
  pt: "Portugu\u00eas",
};

export function isLocale(value: string): value is AvalonLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export const DICTIONARIES: Record<AvalonLocale, AvalonDictionary> = {
  en: {
    common: {
      langLabel: "en",
      signUp: "Sign Up",
      logIn: "Log In",
      footer: "Avalon",
      divider: "or use a social account",
      riskLegend: "RISK WARNING:",
      riskBody: "All trading involves risk. Only risk capital you're prepared to lose.",
      cookieMessage: "We use cookies to understand how you use our site and to improve your experience. By clicking “Got it” or by continuing to use our website, you agree to their use.",
      cookieAction: "Got it",
    },
    login: {
      title: "Log In",
      heading: "Log In",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      submit: "Log In",
      google: "Log in with Google",
      forgotPassword: "Forgot password?",
      noAccountLead: "Don't have an account?",
      noAccountLink: "Sign Up",
      noAccountTail: "",
      submitting: "Signing in…",
      invalidCredentials: "Your email or password is incorrect.",
      twoFactorHeading: "Two-step verification",
      twoFactorBody: "Enter the 6-digit code from your authenticator app.",
      twoFactorPlaceholder: "123 456",
      twoFactorRecoveryHint: "Lost your phone? Enter one of your recovery codes instead.",
      twoFactorInvalid: "That code is not right. Check your app and try again.",
      twoFactorLocked: "Too many wrong codes. Try again in 15 minutes.",
      twoFactorBack: "Use another account",
      twoFactorVerify: "Verify"
    },
    register: {
      title: "Sign Up",
      heading: "Sign Up",
      firstNamePlaceholder: "First Name",
      lastNamePlaceholder: "Last Name",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      phonePlaceholder: "Phone number",
      countrySearchPlaceholder: "Search by country",
      countryHint: "Please make sure this is your country of permanent residence",
      submit: "Open an Account for Free",
      google: "Sign Up with Google",
      termsSegments: [
        "By creating an account, you accept our ",
        ", ",
        " and ",
        " and confirm that you are 18 years of age or older.",
      ],
      termsLinks: [
        {
          text: "Terms & Conditions",
          href: "https://avalonbroker.io/legal/terms?country_id=30",
        },
        {
          text: "Privacy Policy",
          href: "https://avalonbroker.io/legal/privacy?country_id=30",
        },
        {
          text: "Order Execution Policy",
          href: "https://avalonbroker.io/legal/order-execution?country_id=30",
        },
      ],
      hasAccountLead: "Already have an account?",
      hasAccountLink: "Log In",
      hasAccountTail: "now",
      submitting: "Creating your account…"
    },
    changePassword: {
      title: "Password recovery",
      heading: "Password recovery",
      instruction: "To proceed with changing your password, please enter your phone or email.",
      emailPlaceholder: "Email",
      submit: "Submit",
      backToLogin: "Back to Log in",
      noAccountLead: "Don't have an account?",
      noAccountLink: "Sign Up",
      noAccountTail: "",
    },
  },
  es: {
    common: {
      langLabel: "es",
      signUp: "Regístrate",
      logIn: "Entrar",
      footer: "Avalon",
      divider: "o usa una cuenta social",
      riskLegend: "ADVERTENCIA DE RIESGO:",
      riskBody: "Toda inversión implica un riesgo. Te recomendamos que solamente arriesgues aquel capital que estés dispuesto a perder.",
      cookieMessage: "Utilizamos cookies para entender cómo utilizas nuestro sitio web y mejorar tu experiencia. Al hacer clic en «Entendido» o seguir utilizando nuestro sitio web, aceptas su uso.",
      cookieAction: "Entendido",
    },
    login: {
      title: "Entrar",
      heading: "Entrar",
      emailPlaceholder: "E-mail",
      passwordPlaceholder: "Contraseña",
      submit: "Entrar",
      google: "Entrar con Google",
      forgotPassword: "¿Olvidaste la contraseña?",
      noAccountLead: "¿No tienes una cuenta?",
      noAccountLink: "Regístrate",
      noAccountTail: "",
      submitting: "Iniciando sesión…",
      invalidCredentials: "Tu correo electrónico o contraseña es incorrecto.",
      twoFactorHeading: "Verificación en dos pasos",
      twoFactorBody: "Introduce el código de 6 dígitos de tu app de autenticación.",
      twoFactorPlaceholder: "123 456",
      twoFactorRecoveryHint: "¿Perdiste el teléfono? Introduce uno de tus códigos de recuperación.",
      twoFactorInvalid: "Ese código no es correcto. Revisa tu app e inténtalo de nuevo.",
      twoFactorLocked: "Demasiados códigos incorrectos. Vuelve a intentarlo en 15 minutos.",
      twoFactorBack: "Usar otra cuenta",
      twoFactorVerify: "Verificar"
    },
    register: {
      title: "Regístrate",
      heading: "Regístrate",
      firstNamePlaceholder: "Nombre",
      lastNamePlaceholder: "Apellido",
      emailPlaceholder: "E-mail",
      passwordPlaceholder: "Contraseña",
      phonePlaceholder: "Número de teléfono",
      countrySearchPlaceholder: "Buscar por país",
      countryHint: "Asegúrate de que este es tu país de residencia permanente",
      submit: "Abrir la cuenta gratis",
      google: "Regístrate con Google",
      termsSegments: [
        "Al crear una cuenta, aceptas nuestros ",
        ", ",
        " y ",
        " y confirmas que tienes 18 años de edad o más.",
      ],
      termsLinks: [
        {
          text: "Términos y Condiciones",
          href: "https://avalonbroker.io/legal/terms?country_id=30",
        },
        {
          text: "Política de Privacidad",
          href: "https://avalonbroker.io/legal/privacy?country_id=30",
        },
        {
          text: "Política de Ejecución de Órdenes",
          href: "https://avalonbroker.io/legal/order-execution?country_id=30",
        },
      ],
      hasAccountLead: "¿Dispone ya de una cuenta?",
      hasAccountLink: "Iniciar sesión",
      hasAccountTail: "ahora",
      submitting: "Creando tu cuenta…"
    },
    changePassword: {
      title: "Recuperar contraseña",
      heading: "Recuperación de contraseña",
      instruction: "Para proceder al cambio de contraseña, introduce tu teléfono o correo electrónico.",
      emailPlaceholder: "E-mail",
      submit: "Enviar",
      backToLogin: "Volver a iniciar sesión",
      noAccountLead: "¿No tienes una cuenta?",
      noAccountLink: "Regístrate",
      noAccountTail: "",
    },
  },
  pt: {
    common: {
      langLabel: "pt",
      signUp: "Registrar-se",
      logIn: "Entrar",
      footer: "Avalon",
      divider: "ou use uma conta social",
      riskLegend: "AVISO DE RISCO:",
      riskBody: "Toda negociação envolve risco. Apenas arrisque o capital que você está preparado para perder.",
      cookieMessage: "Usamos cookies para entender como você usa nosso site e para melhorar sua experiência. Ao clicar em \"Entendi\" ou ao continuar a usar nosso site, você concorda com seu uso.",
      cookieAction: "Entendi",
    },
    login: {
      title: "Entrar",
      heading: "Entrar",
      emailPlaceholder: "E-mail",
      passwordPlaceholder: "Senha",
      submit: "Entrar",
      google: "Entrar com Google",
      forgotPassword: "Esqueceu a senha?",
      noAccountLead: "Ainda não possui uma conta?",
      noAccountLink: "Inscrever-se",
      noAccountTail: "",
      submitting: "Entrando…",
      invalidCredentials: "Seu e-mail ou senha está incorreto.",
      twoFactorHeading: "Verificação em duas etapas",
      twoFactorBody: "Digite o código de 6 dígitos do seu app autenticador.",
      twoFactorPlaceholder: "123 456",
      twoFactorRecoveryHint: "Perdeu o celular? Digite um dos seus códigos de recuperação.",
      twoFactorInvalid: "Esse código não está certo. Confira o app e tente de novo.",
      twoFactorLocked: "Muitos códigos errados. Tente de novo em 15 minutos.",
      twoFactorBack: "Usar outra conta",
      twoFactorVerify: "Verificar"
    },
    register: {
      title: "Registrar-se",
      heading: "Registrar-se",
      firstNamePlaceholder: "Nome",
      lastNamePlaceholder: "Sobrenome",
      emailPlaceholder: "E-mail",
      passwordPlaceholder: "Senha",
      phonePlaceholder: "Número de telefone",
      countrySearchPlaceholder: "Pesquisa por país",
      countryHint: "Certifique-se de que este é seu país de residência permanente",
      submit: "Abrir uma conta gratis",
      google: "Inscreva-se com Google",
      termsSegments: [
        "Ao criar uma conta, você aceita nossos ",
        ", a ",
        " e a ",
        " e confirma que você tem 18 anos de idade ou mais.",
      ],
      termsLinks: [
        {
          text: "Termos e Condições",
          href: "https://avalonbroker.io/legal/terms?country_id=30",
        },
        {
          text: "Política de Privacidade",
          href: "https://avalonbroker.io/legal/privacy?country_id=30",
        },
        {
          text: "Política de Execução de Ordens",
          href: "https://avalonbroker.io/legal/order-execution?country_id=30",
        },
      ],
      hasAccountLead: "Já possui uma conta?",
      hasAccountLink: "Entrar",
      hasAccountTail: "agora",
      submitting: "Criando sua conta…"
    },
    changePassword: {
      title: "Recuperação de senha",
      heading: "Recuperação de senha",
      instruction: "Para começar o processo de alteração de sua senha, digite seu telefone ou e-mail",
      emailPlaceholder: "E-mail",
      submit: "Enviar",
      backToLogin: "Voltar ao login",
      noAccountLead: "Ainda não possui uma conta?",
      noAccountLink: "Inscrever-se",
      noAccountTail: "",
    },
  },
};

export function getDictionary(locale: AvalonLocale): AvalonDictionary {
  return DICTIONARIES[locale];
}
