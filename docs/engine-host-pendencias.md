# Engine host — o que falta

Estado em 6 de outubro de 2026. O traderoom roda em `/[lang]/traderoom`,
servido pelo Next, atrás de login: contas, carteiras e negócios vivem no MySQL,
o catálogo de instrumentos também, os preços de cripto vêm da Binance e os
cinco pares de forex da fastforex. As oito páginas de conta estão clonadas e
ligadas. O painel de administração está em `/[lang]/admin`, aberto só a quem tem papel `ADMIN`, em
três idiomas. A marca — logo, nome, tema, cor — é um punhado de linhas no banco
e alcança o engine.

O que está abaixo é o que ainda **não** está pronto, em ordem do que mais dói.
Para o protocolo em si — o que cada frame carrega e por quê — veja
[`avalon-backend.md`](./avalon-backend.md); para as formas gravadas dos
painéis, [`avalon-panels.md`](./avalon-panels.md). Este arquivo é só a lista de
pendências.

Duas coisas que valem mais que qualquer item desta lista, porque decidem como
se resolve o próximo:

- **Gravar vence decodificar.** Todas as formas que acertamos vieram de uma
  gravação da plataforma ao vivo; todas que erramos vieram de palpite. Três
  formas erradas para `get-news-feed` — que, gravado, descobriu-se que o
  cliente nunca pede — e dois nomes errados de resposta de torneio.
- **Repetição mede aceitação, não erro.** O engine não reclama de uma resposta
  que não entende: ele reenvia o pedido com o mesmo `request_id`. Parar de
  repetir é o sinal de que a forma está certa. A exceção são os painéis, que
  giram igual quando não entendem e quando não recebem.

## Bloqueios reais

### 1. A administração não mexe em saldo, e não estorna negócios

O painel está em `/[lang]/admin`: visão geral com dinheiro, pessoas e o estado
do feed; caixa com filtros; limites e taxas; usuários; verificação (KYC);
afiliados; catálogo de instrumentos editável; livro de negócios; e as
configurações como JSON. O que ele **não** faz:

- **Saldo de conta.** A tela de usuários lista, busca, desativa e reseta o 2FA
  de quem perdeu o celular e os códigos — mas não edita saldo. Dinheiro entra e sai pelo caixa,
  onde fica registrado. Para dar ou tirar papel de administrador continua sendo
  `npm run admin:grant` — e isso é de propósito, não uma lacuna.
- **Anular um negócio.** A tela de negócios existe e mostra tudo — abertas,
  liquidadas, por conta, com o resultado da casa — mas é somente leitura. Não há
  como estornar um negócio errado. Isso é deliberado: uma tela que muda o
  resultado de um negócio liquidado é uma tela que pode ser usada para mudar o
  resultado de um negócio liquidado, e o estorno certo é um lançamento contábil,
  não uma reescrita do histórico. Falta esse lançamento.
- **Instrumentos novos.** Dá para editar e ligar/desligar, não para criar nem
  apagar. A API aceita `POST` e `DELETE`; a tela não os expõe, porque criar um
  instrumento exige escolher um `active_id` que o engine conheça, e uma caixa de
  texto não ajuda nessa escolha.

Uma ressalva que vale repetir: o papel viaja no token assinado da sessão, que
não é relido do banco a cada requisição. Quem já estava logado mantém o papel
que tinha até sair e entrar de novo.

### 2. Depósito aprovado à mão, sem provedor

Toda conta tem duas carteiras e o traderoom troca entre elas. A de praticante se
recarrega pelo "Top Up". A real agora **recebe por aprovação manual**: o caixa
grava o pedido como `PENDING` e `/[lang]/admin/cashier` resolve.

O que cada decisão faz com o dinheiro — e os dois lados não são simétricos,
porque debitam em momentos diferentes:

| | aprovar | rejeitar |
|---|---|---|
| **Depósito** | credita a carteira | não move nada |
| **Saque** | nada a mover (já saiu no pedido) | estorna |

Três garantias, todas verificadas:

- **Só carteira real.** Dinheiro de praticante não é dinheiro; um depósito pago
  nele é valor criado do nada. A checagem fica onde o dinheiro se move, não no
  pedido — uma checagem longe do dinheiro é uma checagem contornável.
- **Atômico.** Mudança de status e movimento de saldo na mesma transação. Um
  pedido recusado pela trava continua `PENDING`, não fica marcado como resolvido.
- **Idempotente.** Só linha `PENDING` é tocada; o segundo clique responde
  "that request is not pending" em vez de pagar duas vezes.

Os limites e as taxas são configuração, editada em **Limites e taxas**
(`/[lang]/admin/finance`): depósito mínimo e máximo, saque mínimo e máximo,
quantos depósitos pendentes uma pessoa pode ter, saques grátis por mês e a taxa
(percentual mais fixa) depois deles, e se o saque exige verificação aprovada. A
taxa fica **dentro** do valor: o saldo sai pelo valor pedido e a pessoa recebe
o valor menos a taxa, então um estorno devolve exatamente o que saiu. As rotas
checam tudo isso; a página só antecipa.

Um pedido ainda pendente pode ser cancelado por quem o fez — o saque cancelado
volta ao saldo na mesma transação. Um código promocional `deposit_bonus` (com
`params` `{"percent": 50, "min_deposit": 100, "max_bonus": 500}`) é validado no
pedido e o bônus é creditado junto com o depósito, na aprovação, uma vez por
pessoa e código.

O que **continua faltando**: provedor de pagamento para PIX e cripto. Aprovar é
a afirmação de que o dinheiro chegou — nada aqui verifica que chegou. Para
operar de verdade falta conciliação automática com o provedor.

**Cartão** já tem a estrutura inteira, atrás de um processador plugável
(`src/lib/payments/cards/`): um meio do tipo "Cartão" em Limites e taxas (só
depósito), cartões salvos em Métodos de pagamento, e o depósito cobrando o
cartão escolhido. A resposta do processador decide: aprovado passa pelo mesmo
`settleTransaction` da aprovação manual (carteira, bônus, FTD do afiliado);
recusado vira `REJECTED` com o motivo; em análise — ou sem resposta — fica na
fila do caixa. Nunca se guarda número nem CVV: só o token do processador,
bandeira, 4 últimos dígitos, validade e titular. Travas contra teste de cartão:
5 cartões ativos, 10 adicionados por dia, 5 recusas por dia fecham o cartão
para a conta até o dia seguinte; opcionalmente, exigir KYC aprovado antes do
primeiro depósito com cartão. O admin vê no caixa o cartão, o titular (marcado
quando não bate com o nome da conta) e a referência do processador.

O único processador hoje é o **sandbox** (`CARD_PROVIDER=sandbox`): os campos
rodam no navegador e só aceitam cartões de teste, então nem em teste um número
real sai do navegador. Num build de produção ele é ignorado sem
`ALLOW_CARD_SANDBOX=1`, porque uma cobrança de teste aprovada credita a
carteira real. Falta o adaptador de um PSP de verdade — os campos dele (iframe
do processador) no lugar de `CardForm`, as três chamadas de `CardProvider` e um
webhook para as cobranças que ficam em análise. Stripe e Mercado Pago costumam
proibir corretoras de opções binárias nos termos; o mais provável é um PSP de
alto risco.

### 3. A liquidação não é transacional

Um negócio que vence tem três efeitos: a linha em `positions` é atualizada, o
saldo é gravado, e os eventos vão para quem estiver conectado. Os dois primeiros
são gravações separadas, sem transação entre elas. Uma queda do processo no
intervalo deixa o negócio fechado com o saldo não creditado, e nada percebe.

As gravações de saldo pelo menos não se atropelam mais: elas são serializadas
por carteira e leem o valor no momento em que a consulta roda. Antes, duas
apostas no mesmo instante produziam duas atualizações concorrentes carregando o
valor de cada chamada, e em conexões diferentes do pool podiam chegar em
qualquer ordem — a mais antiga chegando por último deixava a carteira uma aposta
mais alta. Foi encontrado conferindo o saldo contra o livro de negócios, e é o
tipo de coisa que uma conferência periódica acharia de novo.

### 4. Um único servidor de mercado por banco

Os ids de negócio são alocados no processo, semeados pelo maior id da tabela no
boot. Dois servidores apontando para o mesmo banco distribuiriam o mesmo id e
colidiriam na primeira gravação.

A alternativa é deixar o banco alocar, o que tornaria a abertura de um negócio
assíncrona por todo o roteador — `openOption` é chamada de dentro do tratamento
do frame e a resposta carrega o id. Enquanto for um processo só, isto é uma
restrição anotada, não um defeito.

### 5. Forex é real nos cinco pares

`FASTFOREX` entrou como terceira fonte e os cinco pares usam preço de verdade,
em 1s, 5s e 60s. Cruzado com a cotação ao vivo do vendor, os cinco ficam
dentro de **0,1 pip** — a diferença é o intervalo entre o último tick e a
consulta.

A Twelve Data continua como fonte disponível e é por que vale registrar a
comparação, medida nos mesmos cinco pares em trinta segundos:

| | Twelve Data (free) | fastforex |
|---|---|---|
| Símbolos no stream | 1, e só EUR/USD | 5 por conexão, 2 conexões |
| Ticks | 14 | **1736** |
| Preço | médio | **bid e ask** |

O que **falta**, e é tudo do plano de teste, não do código:

- **Profundidade de histórico.** A chave de teste recusa além de ~200 horas
  com `Historical data limited during trial`. O módulo para de paginar e fica
  com o que já pegou, em vez de perder o instrumento — mas o gráfico não
  alcança meses atrás.
- **Cinco pares por conexão.** São duas conexões, logo dez pares no total. Um
  sexto par hoje seria recusado; o módulo avisa e o manda para a curva em vez
  de deixá-lo meio real.
- **O bid/ask do mercado ainda não é usado como spread.** O módulo guarda os
  dois lados e expõe `quoteAt`, mas o `quote()` do feed continua aplicando o
  meio-spread configurado em `spreadPlus`/`spreadMinus` sobre o preço médio.
  Ligar um no outro é pequeno e não foi feito.

Três coisas do feed que custam tempo se forem redescobertas:

- **Intervalos são durações ISO 8601** e só três existem: a própria API
  responde `Options are [P1D, PT1H, PT1M]`. Sem granularidade de segundo — a
  série de um segundo é deste servidor, montada do stream, e é ela que torna a
  vela de cinco segundos verdadeira.
- **`limit` vai até 100.** Profundidade vem de paginar para trás com `end=`.
- **Uma série que falha não pode derrubar o instrumento.** Com barras de
  minuto e o stream, o instrumento serve; a primeira versão falhava o
  instrumento inteiro quando a série de hora era recusada, e mandou os cinco
  pares de volta para a curva.

### 6. O `/reload` não é automático

Mudar um instrumento pelo admin não alcança o feed até alguém chamar
`POST /api/admin/reload`. Os dois processos compartilham o banco, não a
memória. Uma fila ou um canal de notificação resolveria; por ora é uma chamada
a mais.

## Limitações conhecidas do feed

### Profundidade do histórico

Cada instrumento da Binance guarda três séries de mil barras: 1s (~16 minutos),
1m (~17 horas) e 1h (~41 dias). Uma vela de cinco segundos pedida de semana
passada volta achatada, porque a barra de hora é tudo que existe tão atrás —
inventar detalhe seria mentira que o gráfico desenharia.

O cliente pode pedir até 600 dias. Cobrir isso exige buscar sob demanda e
guardar em algum lugar; hoje não se busca.

### O `id` do instrumento é o `active_id` do protocolo

Não é auto-incremento de propósito: os ids seguem a numeração do próprio feed
para que um cliente possa ser apontado entre este servidor e o real trocando só
uma URL. Dois efeitos:

- **Um id que o engine não conhece não tem ícone.** O engine traz um atlas de
  sprites indexado por `active_id`. Para um id fora dele, ele busca o ícone no
  endpoint de recursos — e se o campo `image` vier vazio, pede a raiz do site e
  registra uma imagem 0x0 falhada. Por isso todo ativo semeado tem um `image`
  com caminho; ele resolve no pixel transparente. Ícones de verdade para os ids
  novos (860–863: SOL, BNB, XRP, DOGE) continuam faltando.
- **O id não pode mudar depois que há negócios nele.** A rota PATCH recusa
  alterá-lo.

### O host precisa de um nome, não de um IP

`replaceHostSubdomain` substitui o primeiro rótulo de um host com mais de dois
rótulos, então `127.0.0.1` vira `auth.0.0.1` — host cujo último rótulo numérico
força leitura como IPv4, que falha. Nenhuma rota casa, o `check-session` sai
contra algo impossível de interpretar, e o traderoom não abre.

Qualquer nome funciona: `localhost`, ou qualquer domínio, em qualquer máquina.
Só endereço cru não. A rotina não pode ser afrouxada — o engine carrega a mesma
em C++ e compara os resultados. A página avisa em voz alta quando isso acontece.

### `check-session` e o servidor precisam concordar no `user_id`

O stub de `check-session` reporta o id do usuário da sessão, e o feed reporta o
id que o ssid resolve. Com alguém logado os dois vêm da mesma linha de `users` e
não têm como divergir. Sem sessão, o stub cai na configuração `engine.session` e
o feed em `FIRST_USER_ID` — os dois têm o mesmo padrão e nada garante isso.

## O gabinete

As oito páginas de conta estão clonadas e ligadas: `/profile/personal`,
`/verification`, `/portfolio`, `/withdrawal`, `/transactions`, `/trading`,
`/counting`, e o diálogo de foto em `/profile/personal?act=changephoto`. A
gaveta de conta atrás do avatar é o mapa do site e alcança todas, mais o
traderoom e o depósito.

Três delas eram aplicativos separados no site original, embutidos em iframe —
verificação (`verify.`), saque e depósito (`billing.`). Foram reconstruídas
aqui, não embutidas.

O que **não** está pronto nelas:

- **Nenhum provedor de pagamento real.** PIX, cripto e saques são resolvidos à
  mão no caixa do admin; cartão funciona com o processador sandbox e espera um
  PSP de verdade. Veja o item 2.
- **Conferência automática de documento.** O envio existe — frente, verso
  (menos passaporte) e selfie segurando o documento, com os documentos aceitos
  por país editáveis em Verificação (KYC) no admin; CPF conferido pelos dígitos
  no Brasil — mas quem decide é uma pessoa, na fila do admin. Não há OCR,
  prova de vida nem consulta a base externa (Receita, bureaus). As fotos ficam
  em `var/uploads/kyc/` no disco do servidor, fora de `public/`, servidas só ao
  dono e a administradores; num deploy com mais de uma máquina ou disco
  efêmero (Vercel) esse diretório precisa virar um bucket privado.
- **Logos de bandeiras de cartão.** O original alinha Visa e Mastercard no
  rodapé do depósito. São marcas de terceiros; os cartões salvos aparecem com
  um selo com o nome da bandeira na cor dela, e o rodapé diz o que acontece com
  o cartão. Os ícones dos meios (`/storage/cashier/methods/*.svg`, como
  `pix.svg` e `bitcoin.svg`) não estão no repositório e respondem 404.

## Verificação em duas etapas

TOTP (RFC 6238) com qualquer app autenticador, em `/profile/security`: QR code,
chave manual, dez códigos de recuperação de uso único (guardados só como hash).
O segredo fica cifrado com uma chave derivada de `AUTH_SECRET` — trocar
`AUTH_SECRET` faz os códigos do app pararem de valer para todo mundo; entra-se
com um código de recuperação ou com o 2FA resetado no admin.
Cinco códigos errados bloqueiam a conta por 15 minutos; um código não vale duas
vezes. O que falta: 2FA por SMS ou e-mail (não há envio de mensagens) e exigir
o código também para sacar.

## Afiliados

O programa vive em `/[lang]/affiliate` (para quem divulga) e em
`/[lang]/admin/affiliates` (para quem opera). As peças, em
`src/lib/affiliate/`:

- **Rastreamento.** Um link de afiliado é qualquer página com `?ref=CODIGO`,
  opcionalmente `&sub=` e `utm_*`. O middleware manda a visita para
  `/api/affiliate/click`, que grava o clique (sub-id, utm, página, referer, IP,
  país, navegador), entrega um cookie **assinado** com o clique e devolve a
  pessoa à página sem os parâmetros. O cadastro lê o cookie e grava a indicação
  (`referrals`). Vale o último clique; um cookie forjado é ignorado.
- **FTD.** O primeiro depósito aprovado de um indicado é gravado na indicação,
  na mesma transação da aprovação.
- **Comissões.** Um razão (`affiliate_commissions`), não um saldo: CPA uma vez
  por indicado que qualifica (depósitos aprovados e, se pedido, volume real) e
  revenue share por negócio liquidado na carteira real, com sinal — o indicado
  que ganha tira a parte do afiliado. O acúmulo lê o que aconteceu e escreve o
  que falta, a cada minuto (`src/instrumentation.ts`) e antes de cada tela que
  mostra números; o índice único `(kind, source_id)` impede pagar duas vezes.
  Mudar de plano não paga retroativamente: o negócio já visto ganha linha de
  valor zero.
- **Saldo e saques.** O saldo é calculado do razão (passado o período de
  retenção) menos saques aprovados e pendentes. O pedido de saque trava a linha
  do afiliado enquanto confere e grava, então dois pedidos simultâneos não
  gastam o mesmo saldo. O admin aprova ou recusa em **Saques de afiliados**.
- **Postback.** O afiliado pode cadastrar uma URL com macros; ela é chamada no
  cadastro, no FTD e no CPA. Só http/https, e todo endereço para onde o nome
  resolve precisa ser público — checado dentro da própria conexão, para que uma
  resposta de DNS diferente entre a checagem e a chamada não abra a rede
  interna. Cada chamada fica registrada.

Os termos (plano padrão, CPA e qualificação, revenue share, retenção, saque
mínimo, validade do cookie) são editados em **Afiliados → Programa**; cada
afiliado pode ter termos próprios.

O que **falta**: pagamento automático (aprovar um saque diz que foi pago, não
paga), e qualquer detecção de fraude além do que a tela mostra — IP do clique e
do cadastro estão lá para um humano comparar.

## Idiomas

O roteamento e a negociação estão prontos. Um caminho sem idioma ganha um,
escolhido nesta ordem: a escolha da própria pessoa (cookie), depois
`Accept-Language`, depois o país que o cabeçalho de um CDN informar. O país vem
por último de propósito — muita gente lê inglês no Brasil e português no Japão,
e uma VPN torna o sinal sem valor; ele serve para desempatar, não para mandar.

Verificado: `pt-BR` → `/pt`, `es-ES` → `/es`, `ja-JP` → `/en`, e com o navegador
em japonês mas `cf-ipcountry: BR` → `/pt`. Um cookie `locale=es` vence os dois.

O que **não** está traduzido:

- **As oito páginas de conta e o painel de administração.** As strings estão
  fixas no JSX em vez de virem do dicionário. O `/pt/portfolio` mostra "Total
  Investment" igual ao inglês. O dicionário em `src/i18n/avalon.ts` já tem a
  estrutura de três locales; falta estender e trocar as strings.
- **As mensagens de erro das APIs.** Voltam em inglês do servidor. Ou o servidor
  passa a receber o locale, ou devolve códigos e o cliente traduz — a segunda é
  mais limpa.
- **O traderoom.** ~~Falta capturar `pt` e `es`.~~ Feito. Os três dicionários
  estão em `public/engine-host/stubs/lang-route-translations.{pt,es}.json`, com
  9.247 chaves cada — o mesmo número do inglês. O host grava o cookie `lang`
  com o idioma da rota e pede `lang-route-translations.json?locale=<id>`; a
  rota de stubs serve o arquivo do idioma quando existe e cai no inglês quando
  não.

O endpoint `/api/lang/route-translations` responde **sem sessão**, com a mesma
consulta documentada em `docs/avalon-backend.md` e `route=<idioma>`. A nota
anterior dizia que ele recusava os parâmetros; recusa os adivinhados, não os
certos. Para recapturar:

```
curl "https://trade.avalonbroker.com/api/lang/route-translations?groups[]=desktop&groups[]=billing&groups[]=actives&route=pt"
```

## Os painéis editoriais

Todos respondem. `content_items` no banco, a tela `/[lang]/admin/content`
escrevendo nela, e os painéis lendo: Webinars por HTTP, e Vídeo Tutoriais,
Ajuda, Promoção, Análise de Mercado (o calendário econômico), Alertas, Tabela
de Líderes e Torneios pelo socket. O log do feed não reporta nenhum
`MISSING CALL`.

### Notícias: esta marca não tem

Três formas foram escritas para `get-news-feed` e todas estavam erradas pelo
mesmo motivo: **o cliente nunca faz essa chamada.** Em quarenta e um mil frames
gravados da plataforma ao vivo ela não aparece uma vez. "Análise de Mercado"
nesta marca é o calendário econômico; o painel de notícias não é populado.

O handler foi apagado, e o `NEWS` saiu do enum de conteúdo. Fica registrado
porque é a lição mais cara do projeto: responder uma chamada que ninguém faz é
uma forma que ninguém pode conferir, e ela foi lida por três rodadas como forma
que *nós* tínhamos errado.

### O calendário de balanços vem vazio

`get-earnings-calendar-events` responde `{events: []}`. O envelope não é
palpite — o calendário econômico ao lado é irmão dele e tem resposta gravada —
mas a lista é vazia porque é verdade: datas de balanço vêm de um feed de
filings corporativos que não temos, e esta plataforma não negocia as ações a
que elas pertenceriam.

### O caixa responde, mas o diálogo não é usado

`get-cashbox-counting` e `get-withdrawal-payouts` ficaram muito tempo sem
resposta, de propósito, porque as formas não podiam ser adivinhadas. Uma
gravação resolveu as duas, e hoje a primeira devolve as seis chaves que a
plataforma real devolve — só que preenchidas com **os nossos** métodos, limites
e presets, da linha `cashier.methods`.

Mesmo assim o diálogo do engine não chega a desenhar: toda porta para o fluxo
de billing é substituída pela página de caixa da plataforma antes disso. É
deliberado — o diálogo deles carrega um iframe de
`billing.trade.avalonbroker.com`, que é o caixa **deles**, e a CSP do traderoom
bloqueia saída cross-origin justamente por isso. Fazer o depósito acontecer
dentro do engine exigiria construir nosso próprio painel no lugar do iframe.

## Entrar num torneio

Feito do lado do servidor, e verificado ponta a ponta:

- `register-in-tournament-new` com `force: false` é uma **cotação** — devolve
  custo, moeda e saldo, e **não cobra nada**. A primeira versão cobrava aqui, e
  quem apertasse Cancelar já teria pago.
- Com `force: true` a taxa sai da carteira real, abre-se uma carteira de
  torneio (`type` 2, `is_fiat` falso, nomeando o torneio) com o valor inicial, e
  a inscrição é gravada — as três coisas numa transação só.
- Repetir é idempotente: devolve a mesma carteira e não cobra de novo.
- Cada negócio liquidado naquela carteira soma na classificação. Testado: $50 de
  aposta perdida levou o saldo de 500 para 450 e a classificação para −50.

A resposta chama-se **`tournament-registration-new`**. Duas tentativas erraram
antes — um nome inventado e o nome do evento — e o engine disse as duas vezes
repetindo a chamada a cada três segundos sob um mesmo `request_id`. A regra está
na tabela de strings: objeto primeiro, verbo depois. `register-in-tournament-new`
→ `tournament-registration-new`, como `rebuy-in-tournament-new` →
`tournament-rebuy-new` e `reset-training-balance` → `training-balance-reset`.

### O que falta: o diálogo não deixa confirmar

Clicar "JOIN THE TOURNAMENT" abre **"Confirm your participation"**, que mostra o
custo certo ($5,00) — prova de que parte da resposta é lida — mas em vermelho,
com os botões **Cancel** e **Deposit**. Ou seja, o engine conclui que falta
dinheiro e oferece depositar em vez de confirmar. Pela interface ninguém chega
ao `force: true`.

Com 600,46 na carteira real e taxa de 5,00, não falta. Três hipóteses testadas e
descartadas:

1. Campos de "tem dinheiro suficiente" na resposta (`enough_money` e variantes) —
   nenhum desses nomes existe na tabela de strings do binário.
2. `has_deposits`, que era fixo em `false`. Passou a refletir a verdade — não
   mudou o diálogo. (A correção fica: era mentira sobre uma conta com saldo.)
3. A carteira ativa ser a de praticante. Troquei para a real — não mudou.

O caminho que resta é o de sempre: **gravar a resposta verdadeira**. Exige uma
conta com saldo real na plataforma deles e clicar em entrar num torneio. Até lá
o servidor está pronto e só a última porta da interface está fechada.

## Datas no servidor de mercado

O banco guarda a hora em UTC. O driver `mariadb`, sem ser avisado, lê um
`DATETIME` como se estivesse no fuso do processo — numa máquina em UTC−3, tudo
saía **três horas adiantado**: calendário econômico, agenda de webinars,
contagem de torneio e histórico de alertas. Plausível o bastante para passar
despercebido, e errado.

Ajustar `timezone: "Z"` no conector **não resolveu**. A solução é as consultas
pedirem `UNIX_TIMESTAMP(coluna)`: é contagem de segundos, não existe fuso
errado, e é exatamente o que o protocolo quer no fio.

O app web não tem o problema — o Prisma converte certo, verificado comparando a
mesma linha pelos dois caminhos.

Regra para quem continuar: **no servidor de mercado, data lida do banco é
`UNIX_TIMESTAMP`.** Nunca um `DATETIME` convertido em `Date`.

## A marca

Logo, nome, tema do gráfico, cor e as três frases que um link compartilhado
mostra são linhas em `platform_settings`, editadas em `/[lang]/admin/brand`.
Trocar a marca é uma edição, não um deploy — e alcança o engine, não só as
páginas.

O engine foi a parte difícil, porque ele desenha a própria marca de dentro de
uma folha de sprites, e diz quais sprites em folhas de estilo que moram dentro
de `glengineaa60ee59.data`:

```
.plotBackgroundStyle { bg: 'map'; shader: coloradd; color: var(black); }
```

Essa linha é o atalho para qualquer arte do engine que ainda precise mudar.
Procurar por nomes de sprite não funciona: a marca d'água atrás do gráfico
chama-se `map`, e por isso passou por três buscas sem aparecer.

`scripts/brand-engine-atlas.mjs` troca dez sprites em dois atlas e escreve uma
cópia marcada em `public/storage/brand-atlas`, que uma rota serve no lugar da
original. O espelho não é editado de propósito: ele é o build de outra pessoa e
o próximo refetch desfaria a marca em silêncio.

### O que falta na marca

- **A cor só alcança o admin.** As telas do gabinete usam o token fixo do
  Tailwind `--color-avalon-primary: #09af8e`, em 140 lugares. Hoje isso não
  aparece porque o verde escolhido está a dois pontos dele; trocar a cor para
  valer deixa metade da plataforma para trás. O conserto é mecânico: trocar as
  ocorrências por `var(--accent)` e definir a variável no shell do gabinete,
  como já é feito no admin.
- **Reespelhar o engine apaga a marca do atlas.** `download-engine.mjs`
  rebaixa as folhas originais; a cópia marcada continua lá, mas foi construída
  sobre as antigas. Rodar `brand-engine-atlas.mjs` depois resolve, e nada
  lembra de fazê-lo.

## Moedas

O catálogo é o real: 93 moedas com os ids da plataforma (EUR é 1, USD é 5, BRL
é 6), em `server/data/currencies.mjs`. Três bandeiras respondem perguntas
diferentes — `is_visible` (90), `is_tradable` (71), `is_inout` (23) — e quais
*esta* plataforma oferece é uma quarta, na linha `cashier.currencies`. O
cadastro abre a conta na moeda pedida quando ela está na lista, e no padrão
quando não está.

O que falta:

- **As cotações são um instantâneo.** `rate` e `rate_usd` vieram da gravação e
  nada as mantém. Hoje são inertes porque nada aqui converte entre moedas — um
  saldo é denominado numa e fica nela — mas qualquer conversão futura precisa
  de um feed antes de confiar nesses números.
- **Não há tela para escolher as moedas.** É JSON na tela de Ajustes. Uma tela
  com as 23 que aceitam dinheiro marcadas seria melhor.
- **O formulário de cadastro não pergunta.** A API aceita `currency`; a tela
  não oferece. Quem se cadastra pela interface cai sempre no padrão.

## Arte espelhada

Ícones de instrumento e miniaturas de indicador eram um pixel transparente. Os
caminhos são hashes de conteúdo e não dão para derivar, então
`scripts/download-artwork.mjs` os lê de uma gravação e espelha — 810 imagens,
1,7 MB, em `public/storage/`, fora do versionamento como o resto.

O rewrite do pixel em `next.config.ts` é `afterFiles`, que o Next verifica
depois de `public/`: arquivo espelhado ganha, e só os buracos caem no pixel.
Nada na configuração precisou mudar.

Os ícones de pagamento vieram de outro lugar ainda — o iframe de
`billing.trade.avalonbroker.com` embutido na página de depósito, cross-origin,
invisível de fora. Dez métodos, dez ícones.

Falta: **a lista de imagens vem de uma gravação.** Um instrumento novo que a
plataforma passe a oferecer não terá arte até alguém gravar de novo e rodar o
script.

## Sobras do caminho

### O traderoom em React ficou órfão

`src/components/sites/trade-avalonbroker-com-6f41c8f2/traderoom-e34e80f1/` —
treze componentes com dados simulados — era o traderoom antigo. A rota agora
monta o engine e nada mais importa esses arquivos. Deixei no lugar em vez de
apagar, porque apagar é irreversível e talvez sirvam de referência visual; se
não servirem, podem sair inteiros.

### O `[resources_endpoint]` não é expandido pelo engine

O arquivo de traduções guarda URLs de imagem com o literal
`[resources_endpoint]` onde deveria ir o host, para o engine substituir a partir
de `configuration.json`. Ele não substitui. Os colchetes são lidos como literal
IPv6, a URL não interpreta, nenhuma rota casa e todo ícone decorativo falha.
`src/lib/engine/host.ts` expande antes de interpretar — é remendo, não conserto:
a causa provável é algum campo que falta no nosso `configuration.json`.

### `Failed to parse input JSON: The document is empty`

Quatro por boot, cada um registrado duas vezes, sem efeito visível. Descartados
**por medição**, não por argumento: todo corpo HTTP que o engine lê (nenhum tem
tamanho zero), `localStorage` e `sessionStorage`, o `JSON.parse` do lado JS,
cookies ausentes, strings vazias passadas às 194 entradas do `Module`, e o
`openedLeftPanelSections`, que o site real também manda como `""`.

Instrumentar o caminho HTTP desloca a corrida da tabela de hosts da casca, então
a sonda não pode esperar o corpo antes de devolvê-lo.

### Buyback

`price-splitter.client-buyback-generated` é reconhecido e silencioso, então
"P/L after sell" fica em zero e o botão Sell não tem preço. Uma captura ao vivo
foi feita e não respondeu: as sete operações eram todas **blitz**, e nenhum
frame da captura carrega campo de buyback. A próxima precisa ser em outro
instrumento — higher/lower ou digital.

### Famílias de instrumento não exercitadas

Só opções turbo abrem e liquidam. Digital com a escada de strikes e as famílias
marginais são servidas e nunca negociadas. Troca de ativo, mudança de
timeframe pela interface, vários negócios abertos ao mesmo tempo e o painel de
histórico seguem sem teste.

## Como subir isto numa VPS

1. `cp .env.example .env` e preencher — **nunca versionado**; carrega as senhas.
   Gere-as, não escolha: `openssl rand -base64 24 | tr -d '/+=' | head -c 24`.
2. `docker compose up -d` sobe o MySQL dedicado. O contêiner lê usuário, senha e
   banco **só na primeira partida**, quando o diretório de dados está vazio;
   mudar depois não tem efeito.
3. `npm run db:deploy && npm run db:seed`.
4. `npm run build && npm start` para o site.
5. `npm run server` para o feed de mercado, como serviço próprio.
6. Servir por **domínio**, não por IP (veja acima).
7. `engine.feed` apontando para o WebSocket público do feed — `wss://` se o site
   for `https://`, senão o navegador recusa a conexão.
8. `AUTH_SECRET` no `.env` — sem ele o Auth.js não assina cookie nenhum.
9. `npm run admin:grant -- <email>` para o primeiro administrador.
