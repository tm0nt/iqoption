/**
 * Copy for the cashier's flows and the profile pages' controls.
 *
 * Kept apart from `cabinet.ts`, which holds the cabinet's chrome and the words
 * taken from the platform's own dictionary. Everything here was written for
 * this platform: the limits, fees and promo codes the cashier now enforces,
 * the messages its routes send back, and the dialogs on the profile pages that
 * used to speak English whatever the page's language was.
 *
 * The routes speak through this too. A refusal is written in the language of
 * the page that asked, because the page shows it to a person as it arrives.
 */
import type { AvalonLocale } from "@/types/avalon-login";

export type CabinetExtraCopy = {
  cashier: {
    amountRequired: string;
    belowMinDeposit: (min: string) => string;
    aboveMaxDeposit: (max: string) => string;
    belowMinWithdrawal: (min: string) => string;
    aboveMaxWithdrawal: (max: string) => string;
    acceptTerms: string;
    unknownMethod: string;
    tooManyPending: (n: number) => string;
    noRealWallet: string;
    insufficient: string;
    pixKeyRequired: string;
    walletRequired: string;
    kycRequired: string;
    verifyNow: string;
    limits: (min: string, max: string | null) => string;
    depositRecorded: (reference: string) => string;
    depositPendingBody: string;
    another: string;
    viewHistory: string;
    yourDeposits: string;
    yourWithdrawals: string;
    noRequests: string;
    cancel: string;
    cancelConfirm: string;
    cancelFailed: string;
    available: string;
    realOnly: string;
    fee: string;
    free: string;
    youReceive: string;
    feeAfterFree: (description: string) => string;
    requestSent: string;
    pixKey: string;
    pixHint: string;
    walletHint: string;
    promoApplied: (bonus: string) => string;
    promoUnknown: string;
    promoUsed: string;
    promoPending: string;
    promoMinimum: (min: string) => string;
    promoNeedsAmount: string;
    promoRemove: string;
    bonus: string;
    termsPlain: string;
    status: string;
    date: string;
  };
  profile: {
    photoAlt: string;
    photoTitle: string;
    notAllowed: string;
    rules: string[];
    faceVisible: string;
    selectPhoto: string;
    uploading: string;
    removePhoto: string;
    tooLarge: string;
    wrongType: string;
    uploadRefused: string;
    phone: string;
    fullName: string;
    browser: (name: string) => string;
    ipAddress: (ip: string) => string;
    unknownBrowser: string;
    todayAt: (time: string) => string;
    dateAt: (date: string, time: string) => string;
    changeEmailTitle: string;
    changeEmailBody: string;
    newEmail: string;
    currentPassword: string;
    changeEmailSubmit: string;
    emailChanged: string;
    emailTaken: string;
    emailInvalid: string;
    emailSame: string;
    wrongPassword: string;
    downloadData: string;
    deposit: string;
    withdraw: string;
    affiliateProgram: string;
    cancel: string;
    unreachable: string;
    detailsLead: string;
    kycRejected: string;
    kycApproved: string;
  };
  twoFactor: {
    on: string;
    off: string;
    onSince: (date: string) => string;
    enable: string;
    disable: string;
    setupTitle: string;
    step1: string;
    step2: string;
    manualKey: string;
    step3: string;
    code: string;
    confirm: string;
    cancel: string;
    codesTitle: string;
    codesBody: string;
    copy: string;
    copied: string;
    download: string;
    done: string;
    disableTitle: string;
    disableBody: string;
    password: string;
    regenerate: string;
    regenerateBody: string;
    recoveryLeft: (n: number) => string;
    invalidCode: string;
    locked: string;
    wrongPassword: string;
    alreadyOn: string;
    notOn: string;
    failed: string;
  };
  kyc: {
    lead: string;
    country: string;
    documentType: string;
    docTypes: Record<"ID_CARD" | "DRIVERS_LICENSE" | "PASSPORT" | "RESIDENCE_PERMIT", string>;
    cpf: string;
    cpfHint: string;
    number: string;
    numberHint: string;
    front: string;
    frontHint: string;
    back: string;
    backHint: string;
    selfie: string;
    selfieHint: string;
    choose: string;
    change: string;
    formats: string;
    submit: string;
    sending: string;
    reviewTitle: string;
    reviewBody: (date: string) => string;
    rejectedTitle: string;
    reason: string;
    editDetails: string;
    needDetails: string;
    alreadyVerified: string;
    alreadyPending: string;
    tooMany: string;
    countryInvalid: string;
    docTypeInvalid: string;
    cpfInvalid: string;
    numberInvalid: string;
    frontRequired: string;
    backRequired: string;
    selfieRequired: string;
    fileType: string;
    fileSize: string;
    failed: string;
  };
};

const en: CabinetExtraCopy = {
  cashier: {
    amountRequired: "Enter an amount.",
    belowMinDeposit: (min) => `The smallest deposit is ${min}.`,
    aboveMaxDeposit: (max) => `The largest deposit is ${max}.`,
    belowMinWithdrawal: (min) => `The smallest withdrawal is ${min}.`,
    aboveMaxWithdrawal: (max) => `The largest withdrawal is ${max}.`,
    acceptTerms: "Accept the terms to continue.",
    unknownMethod: "Choose a payment method.",
    tooManyPending: (n) => `You already have ${n} deposit${n === 1 ? "" : "s"} waiting for review. Wait for them, or cancel one below.`,
    noRealWallet: "Your account has no real wallet. Contact support.",
    insufficient: "That is more than your real balance.",
    pixKeyRequired: "Enter your PIX key.",
    walletRequired: "Enter a wallet address.",
    kycRequired: "Verify your identity before withdrawing.",
    verifyNow: "Verify now",
    limits: (min, max) => (max ? `Min ${min} · Max ${max}` : `Min ${min}`),
    depositRecorded: (reference) => `Deposit ${reference} recorded`,
    depositPendingBody: "It is waiting for review. Your balance changes once it is approved — you can follow it below and in Balance History.",
    another: "Make another",
    viewHistory: "Balance History",
    yourDeposits: "Your deposits",
    yourWithdrawals: "Your withdrawals",
    noRequests: "No requests yet.",
    cancel: "Cancel",
    cancelConfirm: "Cancel this request?",
    cancelFailed: "Could not cancel that.",
    available: "Available",
    realOnly: "Withdrawals come from your real account, never from the practice one.",
    fee: "Fee",
    free: "free",
    youReceive: "You receive",
    feeAfterFree: (description) => `After the free ones, each withdrawal costs ${description}.`,
    requestSent: "Your request is with us. The amount is held out of your balance until it is reviewed.",
    pixKey: "PIX key",
    pixHint: "CPF, e-mail, phone number or random key.",
    walletHint: "Check the network: funds sent on the wrong network cannot be recovered.",
    promoApplied: (bonus) => `A bonus of ${bonus} is added when the deposit is approved.`,
    promoUnknown: "That code is not valid.",
    promoUsed: "You have already used that code.",
    promoPending: "That code is already on a deposit waiting for review.",
    promoMinimum: (min) => `That code needs a deposit of at least ${min}.`,
    promoNeedsAmount: "Enter the amount first.",
    promoRemove: "Remove",
    bonus: "Bonus",
    termsPlain: "Terms & Conditions",
    status: "Status",
    date: "Date",
  },
  profile: {
    photoAlt: "Your profile photo",
    photoTitle: "Your profile photo",
    notAllowed: "It is not allowed to publish:",
    rules: [
      "sexually explicit or pornographic images",
      "images intended to incite ethnic or racial hatred or hostility",
      "photos of people under the age of 18",
      "third-party copyright-protected photos",
      "images larger than 5 MB and in a format other than JPG or PNG",
    ],
    faceVisible: "Your face must be clearly visible in the photo. All photos you upload must meet these requirements or they may be removed.",
    selectPhoto: "Select a Photo",
    uploading: "Uploading…",
    removePhoto: "Remove",
    tooLarge: "That image is larger than 5 MB.",
    wrongType: "Only JPG and PNG images are accepted.",
    uploadRefused: "The upload was refused.",
    phone: "Phone",
    fullName: "Name",
    browser: (name) => `Browser ${name}`,
    ipAddress: (ip) => `IP address ${ip}`,
    unknownBrowser: "unknown",
    todayAt: (time) => `Today at ${time}`,
    dateAt: (date, time) => `${date} at ${time}`,
    changeEmailTitle: "Change email",
    changeEmailBody: "Enter the new address and your current password. The new address will need to be confirmed again.",
    newEmail: "New email address",
    currentPassword: "Current password",
    changeEmailSubmit: "Change email",
    emailChanged: "Your email address has been changed.",
    emailTaken: "That email is already registered.",
    emailInvalid: "Enter a valid email address.",
    emailSame: "That is already your email address.",
    wrongPassword: "That password is not right.",
    downloadData: "Download my data",
    deposit: "Deposit",
    withdraw: "Withdraw",
    affiliateProgram: "Affiliate Program",
    cancel: "Cancel",
    unreachable: "Could not reach the server.",
    detailsLead: "Providing correct personal information will facilitate the verification of your account and its funding. The details you provide will be kept confidential.",
    kycRejected: "Your verification was not approved. Check that your details match your identity document exactly and send them again.",
    kycApproved: "Your identity is verified. Nothing else is needed.",
  },
  twoFactor: {
    on: "On",
    off: "Off",
    onSince: (date) => `On since ${date}.`,
    enable: "Turn on",
    disable: "Turn off",
    setupTitle: "Set up your authenticator app",
    step1: "Install an authenticator app — Google Authenticator, Microsoft Authenticator, Authy or 1Password.",
    step2: "Scan this QR code with the app, or type the key in by hand.",
    manualKey: "Key",
    step3: "Enter the 6-digit code the app shows.",
    code: "Code",
    confirm: "Turn on",
    cancel: "Cancel",
    codesTitle: "Save your recovery codes",
    codesBody: "Each code signs you in once if you lose your phone. Keep them somewhere safe: they are not shown again.",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    done: "I have saved them",
    disableTitle: "Turn off two-step sign-in",
    disableBody: "Enter your password and a code from your app, or a recovery code.",
    password: "Password",
    regenerate: "New recovery codes",
    regenerateBody: "Enter a code from your app. Your old recovery codes stop working.",
    recoveryLeft: (n) => `${n} recovery code${n === 1 ? "" : "s"} left.`,
    invalidCode: "That code is not right.",
    locked: "Too many wrong codes. Try again in 15 minutes.",
    wrongPassword: "That password is not right.",
    alreadyOn: "Two-step sign-in is already on.",
    notOn: "Two-step sign-in is not on.",
    failed: "That did not work. Try again.",
  },
  kyc: {
    lead: "Send a clear photo of your document and a selfie holding it. A person compares them with the details you entered, usually within one business day.",
    country: "Country that issued the document",
    documentType: "Document",
    docTypes: { ID_CARD: "Identity card", DRIVERS_LICENSE: "Driver's license", PASSPORT: "Passport", RESIDENCE_PERMIT: "Residence permit" },
    cpf: "CPF",
    cpfHint: "Every Brazilian document carries it, and it is what your account is checked against.",
    number: "Document number",
    numberHint: "Exactly as it is printed on the document.",
    front: "Front",
    frontHint: "The whole document, all four corners in the frame, nothing covered, no glare.",
    back: "Back",
    backHint: "The other side, the same way.",
    selfie: "Selfie with the document",
    selfieHint: "Your face and the document beside it, both clearly visible.",
    choose: "Choose a photo",
    change: "Change",
    formats: "JPG, PNG or WebP. Large photos are reduced before they are sent.",
    submit: "Send for review",
    sending: "Sending…",
    reviewTitle: "Your documents are being reviewed",
    reviewBody: (date) => `Sent on ${date}. The result will appear here.`,
    rejectedTitle: "Your documents were not accepted",
    reason: "Reason",
    editDetails: "Edit personal details",
    needDetails: "Fill in your personal details first.",
    alreadyVerified: "Your identity is already verified.",
    alreadyPending: "Your documents are already being reviewed.",
    tooMany: "Too many attempts today. Try again tomorrow.",
    countryInvalid: "Choose the country that issued the document.",
    docTypeInvalid: "Choose a document that country is accepted with.",
    cpfInvalid: "That CPF is not valid.",
    numberInvalid: "Enter the number as it appears on the document.",
    frontRequired: "Add a photo of the front.",
    backRequired: "Add a photo of the back.",
    selfieRequired: "Add a selfie with the document.",
    fileType: "Only JPG, PNG or WebP photos are accepted.",
    fileSize: "That photo is larger than 8 MB.",
    failed: "Could not send that. Try again.",
  },
};

const pt: CabinetExtraCopy = {
  cashier: {
    amountRequired: "Informe um valor.",
    belowMinDeposit: (min) => `O depósito mínimo é ${min}.`,
    aboveMaxDeposit: (max) => `O depósito máximo é ${max}.`,
    belowMinWithdrawal: (min) => `O saque mínimo é ${min}.`,
    aboveMaxWithdrawal: (max) => `O saque máximo é ${max}.`,
    acceptTerms: "Aceite os termos para continuar.",
    unknownMethod: "Escolha um meio de pagamento.",
    tooManyPending: (n) => `Você já tem ${n} depósito${n === 1 ? "" : "s"} aguardando análise. Espere, ou cancele um abaixo.`,
    noRealWallet: "Sua conta não tem carteira real. Fale com o suporte.",
    insufficient: "Isso é mais do que o seu saldo real.",
    pixKeyRequired: "Informe sua chave PIX.",
    walletRequired: "Informe o endereço da carteira.",
    kycRequired: "Verifique sua identidade antes de sacar.",
    verifyNow: "Verificar agora",
    limits: (min, max) => (max ? `Mín. ${min} · Máx. ${max}` : `Mín. ${min}`),
    depositRecorded: (reference) => `Depósito ${reference} registrado`,
    depositPendingBody: "Ele está aguardando análise. Seu saldo muda quando for aprovado — acompanhe abaixo e no Histórico de saldo.",
    another: "Fazer outro",
    viewHistory: "Histórico de saldo",
    yourDeposits: "Seus depósitos",
    yourWithdrawals: "Seus saques",
    noRequests: "Nenhum pedido ainda.",
    cancel: "Cancelar",
    cancelConfirm: "Cancelar este pedido?",
    cancelFailed: "Não foi possível cancelar.",
    available: "Disponível",
    realOnly: "Saques saem da sua conta real, nunca da de prática.",
    fee: "Taxa",
    free: "grátis",
    youReceive: "Você recebe",
    feeAfterFree: (description) => `Depois dos grátis, cada saque custa ${description}.`,
    requestSent: "Recebemos seu pedido. O valor fica retido do seu saldo até a análise.",
    pixKey: "Chave PIX",
    pixHint: "CPF, e-mail, telefone ou chave aleatória.",
    walletHint: "Confira a rede: fundos enviados pela rede errada não podem ser recuperados.",
    promoApplied: (bonus) => `Um bônus de ${bonus} é somado quando o depósito for aprovado.`,
    promoUnknown: "Esse código não é válido.",
    promoUsed: "Você já usou esse código.",
    promoPending: "Esse código já está num depósito aguardando análise.",
    promoMinimum: (min) => `Esse código exige um depósito de pelo menos ${min}.`,
    promoNeedsAmount: "Informe o valor primeiro.",
    promoRemove: "Remover",
    bonus: "Bônus",
    termsPlain: "Termos e Condições",
    status: "Situação",
    date: "Data",
  },
  profile: {
    photoAlt: "Sua foto de perfil",
    photoTitle: "Sua foto de perfil",
    notAllowed: "Não é permitido publicar:",
    rules: [
      "imagens sexualmente explícitas ou pornográficas",
      "imagens que incitem ódio ou hostilidade étnica ou racial",
      "fotos de menores de 18 anos",
      "fotos protegidas por direitos autorais de terceiros",
      "imagens maiores que 5 MB ou em formato diferente de JPG ou PNG",
    ],
    faceVisible: "Seu rosto precisa estar bem visível na foto. Todas as fotos enviadas devem cumprir estes requisitos ou poderão ser removidas.",
    selectPhoto: "Escolher foto",
    uploading: "Enviando…",
    removePhoto: "Remover",
    tooLarge: "Essa imagem é maior que 5 MB.",
    wrongType: "Só aceitamos imagens JPG e PNG.",
    uploadRefused: "O envio foi recusado.",
    phone: "Telefone",
    fullName: "Nome",
    browser: (name) => `Navegador ${name}`,
    ipAddress: (ip) => `Endereço IP ${ip}`,
    unknownBrowser: "desconhecido",
    todayAt: (time) => `Hoje às ${time}`,
    dateAt: (date, time) => `${date} às ${time}`,
    changeEmailTitle: "Alterar e-mail",
    changeEmailBody: "Informe o novo endereço e sua senha atual. O novo endereço precisará ser confirmado de novo.",
    newEmail: "Novo e-mail",
    currentPassword: "Senha atual",
    changeEmailSubmit: "Alterar e-mail",
    emailChanged: "Seu e-mail foi alterado.",
    emailTaken: "Esse e-mail já está cadastrado.",
    emailInvalid: "Informe um e-mail válido.",
    emailSame: "Esse já é o seu e-mail.",
    wrongPassword: "Essa senha não está certa.",
    downloadData: "Baixar meus dados",
    deposit: "Depositar",
    withdraw: "Sacar",
    affiliateProgram: "Programa de Afiliados",
    cancel: "Cancelar",
    unreachable: "Não foi possível falar com o servidor.",
    detailsLead: "Informar seus dados pessoais corretamente facilita a verificação da conta e os depósitos. Os dados informados são mantidos em sigilo.",
    kycRejected: "Sua verificação não foi aprovada. Confira se os dados batem exatamente com seu documento de identidade e envie de novo.",
    kycApproved: "Sua identidade está verificada. Não é preciso mais nada.",
  },
  twoFactor: {
    on: "Ativada",
    off: "Desativada",
    onSince: (date) => `Ativada desde ${date}.`,
    enable: "Ativar",
    disable: "Desativar",
    setupTitle: "Configure seu app autenticador",
    step1: "Instale um app autenticador — Google Authenticator, Microsoft Authenticator, Authy ou 1Password.",
    step2: "Escaneie este QR code com o app, ou digite a chave manualmente.",
    manualKey: "Chave",
    step3: "Digite o código de 6 dígitos que o app mostra.",
    code: "Código",
    confirm: "Ativar",
    cancel: "Cancelar",
    codesTitle: "Guarde seus códigos de recuperação",
    codesBody: "Cada código permite entrar uma vez se você perder o celular. Guarde-os em local seguro: eles não serão mostrados de novo.",
    copy: "Copiar",
    copied: "Copiado",
    download: "Baixar",
    done: "Já guardei",
    disableTitle: "Desativar a verificação em duas etapas",
    disableBody: "Digite sua senha e um código do app, ou um código de recuperação.",
    password: "Senha",
    regenerate: "Novos códigos de recuperação",
    regenerateBody: "Digite um código do app. Os códigos de recuperação antigos deixam de funcionar.",
    recoveryLeft: (n) => `Restam ${n} código${n === 1 ? "" : "s"} de recuperação.`,
    invalidCode: "Esse código não está certo.",
    locked: "Muitos códigos errados. Tente de novo em 15 minutos.",
    wrongPassword: "Essa senha não está certa.",
    alreadyOn: "A verificação em duas etapas já está ativada.",
    notOn: "A verificação em duas etapas não está ativada.",
    failed: "Não deu certo. Tente de novo.",
  },
  kyc: {
    lead: "Envie uma foto nítida do seu documento e uma selfie segurando-o. Uma pessoa compara com os dados que você informou, normalmente em até um dia útil.",
    country: "País que emitiu o documento",
    documentType: "Documento",
    docTypes: { ID_CARD: "Carteira de identidade (RG/CIN)", DRIVERS_LICENSE: "Carteira de motorista (CNH)", PASSPORT: "Passaporte", RESIDENCE_PERMIT: "Autorização de residência" },
    cpf: "CPF",
    cpfHint: "Todo documento brasileiro traz o CPF, e é com ele que sua conta é conferida.",
    number: "Número do documento",
    numberHint: "Exatamente como está impresso no documento.",
    front: "Frente",
    frontHint: "O documento inteiro, os quatro cantos na foto, nada coberto, sem reflexo.",
    back: "Verso",
    backHint: "O outro lado, do mesmo jeito.",
    selfie: "Selfie com o documento",
    selfieHint: "Seu rosto e o documento ao lado, os dois bem visíveis.",
    choose: "Escolher foto",
    change: "Trocar",
    formats: "JPG, PNG ou WebP. Fotos grandes são reduzidas antes do envio.",
    submit: "Enviar para análise",
    sending: "Enviando…",
    reviewTitle: "Seus documentos estão em análise",
    reviewBody: (date) => `Enviados em ${date}. O resultado aparece aqui.`,
    rejectedTitle: "Seus documentos não foram aceitos",
    reason: "Motivo",
    editDetails: "Editar dados pessoais",
    needDetails: "Preencha seus dados pessoais primeiro.",
    alreadyVerified: "Sua identidade já está verificada.",
    alreadyPending: "Seus documentos já estão em análise.",
    tooMany: "Muitas tentativas hoje. Tente de novo amanhã.",
    countryInvalid: "Escolha o país que emitiu o documento.",
    docTypeInvalid: "Escolha um documento aceito para esse país.",
    cpfInvalid: "Esse CPF não é válido.",
    numberInvalid: "Digite o número como aparece no documento.",
    frontRequired: "Adicione a foto da frente.",
    backRequired: "Adicione a foto do verso.",
    selfieRequired: "Adicione a selfie com o documento.",
    fileType: "Só aceitamos fotos JPG, PNG ou WebP.",
    fileSize: "Essa foto tem mais de 8 MB.",
    failed: "Não foi possível enviar. Tente de novo.",
  },
};

const es: CabinetExtraCopy = {
  cashier: {
    amountRequired: "Introduce un importe.",
    belowMinDeposit: (min) => `El depósito mínimo es ${min}.`,
    aboveMaxDeposit: (max) => `El depósito máximo es ${max}.`,
    belowMinWithdrawal: (min) => `El retiro mínimo es ${min}.`,
    aboveMaxWithdrawal: (max) => `El retiro máximo es ${max}.`,
    acceptTerms: "Acepta los términos para continuar.",
    unknownMethod: "Elige un método de pago.",
    tooManyPending: (n) => `Ya tienes ${n} depósito${n === 1 ? "" : "s"} esperando revisión. Espera, o cancela uno abajo.`,
    noRealWallet: "Tu cuenta no tiene billetera real. Contacta con soporte.",
    insufficient: "Eso es más que tu saldo real.",
    pixKeyRequired: "Introduce tu clave PIX.",
    walletRequired: "Introduce la dirección de la billetera.",
    kycRequired: "Verifica tu identidad antes de retirar.",
    verifyNow: "Verificar ahora",
    limits: (min, max) => (max ? `Mín. ${min} · Máx. ${max}` : `Mín. ${min}`),
    depositRecorded: (reference) => `Depósito ${reference} registrado`,
    depositPendingBody: "Está esperando revisión. Tu saldo cambia cuando se apruebe — puedes seguirlo abajo y en el Historial de saldo.",
    another: "Hacer otro",
    viewHistory: "Historial de saldo",
    yourDeposits: "Tus depósitos",
    yourWithdrawals: "Tus retiros",
    noRequests: "Aún no hay solicitudes.",
    cancel: "Cancelar",
    cancelConfirm: "¿Cancelar esta solicitud?",
    cancelFailed: "No se pudo cancelar.",
    available: "Disponible",
    realOnly: "Los retiros salen de tu cuenta real, nunca de la de práctica.",
    fee: "Comisión",
    free: "gratis",
    youReceive: "Recibes",
    feeAfterFree: (description) => `Tras los gratis, cada retiro cuesta ${description}.`,
    requestSent: "Tenemos tu solicitud. El importe queda retenido de tu saldo hasta la revisión.",
    pixKey: "Clave PIX",
    pixHint: "CPF, correo, teléfono o clave aleatoria.",
    walletHint: "Comprueba la red: los fondos enviados por la red equivocada no se pueden recuperar.",
    promoApplied: (bonus) => `Se añade un bono de ${bonus} cuando se apruebe el depósito.`,
    promoUnknown: "Ese código no es válido.",
    promoUsed: "Ya usaste ese código.",
    promoPending: "Ese código ya está en un depósito esperando revisión.",
    promoMinimum: (min) => `Ese código requiere un depósito de al menos ${min}.`,
    promoNeedsAmount: "Introduce primero el importe.",
    promoRemove: "Quitar",
    bonus: "Bono",
    termsPlain: "Términos y Condiciones",
    status: "Estado",
    date: "Fecha",
  },
  profile: {
    photoAlt: "Tu foto de perfil",
    photoTitle: "Tu foto de perfil",
    notAllowed: "No está permitido publicar:",
    rules: [
      "imágenes sexualmente explícitas o pornográficas",
      "imágenes que inciten al odio o la hostilidad étnica o racial",
      "fotos de menores de 18 años",
      "fotos protegidas por derechos de autor de terceros",
      "imágenes de más de 5 MB o en un formato distinto de JPG o PNG",
    ],
    faceVisible: "Tu cara debe verse con claridad en la foto. Todas las fotos que subas deben cumplir estos requisitos o pueden ser retiradas.",
    selectPhoto: "Elegir foto",
    uploading: "Subiendo…",
    removePhoto: "Quitar",
    tooLarge: "Esa imagen pesa más de 5 MB.",
    wrongType: "Solo se aceptan imágenes JPG y PNG.",
    uploadRefused: "La subida fue rechazada.",
    phone: "Teléfono",
    fullName: "Nombre",
    browser: (name) => `Navegador ${name}`,
    ipAddress: (ip) => `Dirección IP ${ip}`,
    unknownBrowser: "desconocido",
    todayAt: (time) => `Hoy a las ${time}`,
    dateAt: (date, time) => `${date} a las ${time}`,
    changeEmailTitle: "Cambiar correo",
    changeEmailBody: "Introduce la nueva dirección y tu contraseña actual. La nueva dirección deberá confirmarse de nuevo.",
    newEmail: "Nuevo correo",
    currentPassword: "Contraseña actual",
    changeEmailSubmit: "Cambiar correo",
    emailChanged: "Tu correo ha sido cambiado.",
    emailTaken: "Ese correo ya está registrado.",
    emailInvalid: "Introduce un correo válido.",
    emailSame: "Ese ya es tu correo.",
    wrongPassword: "Esa contraseña no es correcta.",
    downloadData: "Descargar mis datos",
    deposit: "Depositar",
    withdraw: "Retirar",
    affiliateProgram: "Programa de Afiliados",
    cancel: "Cancelar",
    unreachable: "No se pudo contactar con el servidor.",
    detailsLead: "Facilitar tus datos personales correctamente agiliza la verificación de tu cuenta y sus depósitos. Los datos que nos des se mantienen confidenciales.",
    kycRejected: "Tu verificación no fue aprobada. Comprueba que tus datos coinciden exactamente con tu documento de identidad y envíalos de nuevo.",
    kycApproved: "Tu identidad está verificada. No hace falta nada más.",
  },
  twoFactor: {
    on: "Activada",
    off: "Desactivada",
    onSince: (date) => `Activada desde ${date}.`,
    enable: "Activar",
    disable: "Desactivar",
    setupTitle: "Configura tu app de autenticación",
    step1: "Instala una app de autenticación — Google Authenticator, Microsoft Authenticator, Authy o 1Password.",
    step2: "Escanea este código QR con la app, o escribe la clave a mano.",
    manualKey: "Clave",
    step3: "Introduce el código de 6 dígitos que muestra la app.",
    code: "Código",
    confirm: "Activar",
    cancel: "Cancelar",
    codesTitle: "Guarda tus códigos de recuperación",
    codesBody: "Cada código te permite entrar una vez si pierdes el teléfono. Guárdalos en un lugar seguro: no se volverán a mostrar.",
    copy: "Copiar",
    copied: "Copiado",
    download: "Descargar",
    done: "Ya los guardé",
    disableTitle: "Desactivar la verificación en dos pasos",
    disableBody: "Introduce tu contraseña y un código de la app, o un código de recuperación.",
    password: "Contraseña",
    regenerate: "Nuevos códigos de recuperación",
    regenerateBody: "Introduce un código de la app. Tus códigos de recuperación anteriores dejan de funcionar.",
    recoveryLeft: (n) => `Te quedan ${n} código${n === 1 ? "" : "s"} de recuperación.`,
    invalidCode: "Ese código no es correcto.",
    locked: "Demasiados códigos incorrectos. Vuelve a intentarlo en 15 minutos.",
    wrongPassword: "Esa contraseña no es correcta.",
    alreadyOn: "La verificación en dos pasos ya está activada.",
    notOn: "La verificación en dos pasos no está activada.",
    failed: "No funcionó. Inténtalo de nuevo.",
  },
  kyc: {
    lead: "Envía una foto nítida de tu documento y un selfie sosteniéndolo. Una persona los compara con los datos que indicaste, normalmente en un día hábil.",
    country: "País que emitió el documento",
    documentType: "Documento",
    docTypes: { ID_CARD: "Documento de identidad", DRIVERS_LICENSE: "Licencia de conducir", PASSPORT: "Pasaporte", RESIDENCE_PERMIT: "Permiso de residencia" },
    cpf: "CPF",
    cpfHint: "Todo documento brasileño lleva el CPF, y es con él que se verifica tu cuenta.",
    number: "Número del documento",
    numberHint: "Exactamente como aparece impreso en el documento.",
    front: "Anverso",
    frontHint: "El documento entero, las cuatro esquinas en la foto, nada tapado, sin reflejos.",
    back: "Reverso",
    backHint: "El otro lado, de la misma forma.",
    selfie: "Selfie con el documento",
    selfieHint: "Tu cara y el documento al lado, ambos bien visibles.",
    choose: "Elegir foto",
    change: "Cambiar",
    formats: "JPG, PNG o WebP. Las fotos grandes se reducen antes de enviarlas.",
    submit: "Enviar para revisión",
    sending: "Enviando…",
    reviewTitle: "Tus documentos están en revisión",
    reviewBody: (date) => `Enviados el ${date}. El resultado aparecerá aquí.`,
    rejectedTitle: "Tus documentos no fueron aceptados",
    reason: "Motivo",
    editDetails: "Editar datos personales",
    needDetails: "Completa primero tus datos personales.",
    alreadyVerified: "Tu identidad ya está verificada.",
    alreadyPending: "Tus documentos ya están en revisión.",
    tooMany: "Demasiados intentos hoy. Vuelve a intentarlo mañana.",
    countryInvalid: "Elige el país que emitió el documento.",
    docTypeInvalid: "Elige un documento aceptado para ese país.",
    cpfInvalid: "Ese CPF no es válido.",
    numberInvalid: "Introduce el número como aparece en el documento.",
    frontRequired: "Añade la foto del anverso.",
    backRequired: "Añade la foto del reverso.",
    selfieRequired: "Añade el selfie con el documento.",
    fileType: "Solo se aceptan fotos JPG, PNG o WebP.",
    fileSize: "Esa foto pesa más de 8 MB.",
    failed: "No se pudo enviar. Inténtalo de nuevo.",
  },
};

const DICTIONARIES: Record<AvalonLocale, CabinetExtraCopy> = { en, pt, es };

export function cabinetExtra(locale: string): CabinetExtraCopy {
  return DICTIONARIES[locale as AvalonLocale] ?? en;
}
