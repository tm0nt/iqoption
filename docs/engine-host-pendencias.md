# Engine host — o que falta

Estado em 4 de outubro de 2026. O traderoom roda em `/[lang]/traderoom`, servido
pelo Next, atrás de login: contas, carteiras e negócios vivem no MySQL, o
catálogo de instrumentos também, e os preços de cripto vêm da Binance. As oito
páginas de conta — perfil, verificação, portfólio, saque, histórico de saldo,
histórico de negócios, depósito e a foto — estão clonadas e ligadas. O painel de
administração está em `/[lang]/admin`, aberto só a quem tem papel `ADMIN`. O que
está abaixo é o que ainda não está pronto, em ordem do que mais dói.

Para o protocolo em si — o que cada frame carrega e por quê — veja
[`avalon-backend.md`](./avalon-backend.md). Este arquivo é só a lista de
pendências.

## Bloqueios reais

### 1. A administração não cobre contas, e não estorna

O painel está em `/[lang]/admin`: visão geral com o estado do feed, catálogo de
instrumentos editável, livro de negócios e as configurações como JSON. O que ele
**não** faz:

- **Contas.** Não lista usuários, não desativa ninguém, não mexe em saldo. Para
  dar ou tirar papel de administrador continua sendo `npm run admin:grant` — e
  isso é de propósito, não uma lacuna.
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

O que **continua faltando**: provedor de pagamento. Aprovar é a afirmação de que
o dinheiro chegou — nada aqui verifica que chegou. Para operar de verdade falta
conciliação automática com o provedor.

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

### 5. Forex ainda é sintético

Só `BINANCE` e `SIMULATED` existem como fontes. Os cinco pares de forex usam a
curva determinística de `server/market/prices.mjs` — ela é convincente e não é
real. Trocar uma linha para `source = 'BINANCE'` com um `sourceSymbol` válido já
funciona hoje; o que falta é um provedor de forex de verdade.

Para acrescentar um: `server/market/binance.mjs` é o modelo. O contrato é
pequeno — `warmUp`, `connect`, `priceAt`, `candleAt` — e o despacho por fonte
está em `prices.mjs`.

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

- **Nada paga ninguém.** Um depósito grava uma linha pendente e o saldo não se
  move; um saque debita no pedido e fica pendente para sempre, porque não existe
  quem aprove. Falta a tela de operação do caixa e o provedor de pagamento.
- **O documento de identidade.** A etapa de detalhes grava e move a conta para
  `PENDING`; o envio do documento não existe, então ninguém chega a `APPROVED`.
- **As sub-páginas do perfil.** O menu lateral lista seis — notificações,
  configurações de conta, redes sociais, meios de pagamento, segurança — e só
  "Personal Data" existe. As outras cinco dão 404.
- **Promoções.** O campo de código promocional existe e responde que não há
  promoção alguma, porque não há.
- **Logos de bandeiras de cartão.** O original alinha Visa e Mastercard no
  rodapé do depósito. São marcas de terceiros e exibi-las afirmaria uma relação
  de pagamento que não existe; a linha diz o que é verdade no lugar.

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

Existe `content_items` no banco e uma tela em `/[lang]/admin/content` que
escreve nela: webinars, tutoriais, notícias, ajuda e promoções, cada item com
título, resumo, corpo, imagem, link, apresentador, data, duração, prioridade e
idioma — um item sem idioma aparece nos três.

O caminho até o engine está ligado e **verificado no fio**:

- `GET /api/engine/stubs/webinars.json?locale=xx` devolve os webinars do banco.
- `get-news-feed` devolve as notícias do banco (confirmado no transcript:
  `status 2000`, itens reais).

O que **não** funciona ainda: os dois painéis continuam mostrando o estado
vazio. Não é falta de dados nem erro de transporte — o transcript mostra
`status 2000` com itens reais, o engine não registra erro nem timeout, e não
reenvia o pedido. É a forma do item.

### O que já foi descartado

Três tentativas, todas verificadas no engine:

1. **Campos planos** (`title`, `content`, `image`, `url`, `date`) — o que o
   primeiro palpite mandava. Nem `title` nem `content` existem na tabela de
   strings do binário.
2. **Contêiner `news` vs `articles`** — `articles`, `news_id` e `body` estão na
   tabela; `news` não. Mandamos sob os dois nomes. Não resolveu.
3. **Forma aninhada "smartfeed"** — a atual. É a mais fundamentada: a tabela
   carrega `title.bold_text`, `description.text`, `description.html`,
   `image.url`, `link.url`, `main_button.*`, `timer.*`, `video.embed_url`, que
   é como este build nomeia chave aninhada. Os setters de `IQNewsArticleData`
   dão o resto do conjunto (`activeIds`, `mainActiveId`, `forexCountries`,
   `topics`, `https`, `url`), e `active_ids`, `image_url`, `source_url` e
   `https` aparecem em snake case. Mesmo assim o painel não renderiza.

A resposta hoje também devolve `from`, `n`, `config` e `lang` do pedido — uma
lista paginada precisa casar resposta com pergunta, e `lang` volta na forma
exata que chegou (`en_US`, não `en`). Isso está certo independentemente do
resto e fica.

### Onde olhar a seguir

O construtor de `IQNewsArticleData` recebe uma tupla de **29 campos** (tipos
decodificáveis do símbolo mangled: 8 strings, 3 vetores de string, 2 vetores de
int, 4 bools, 4 ints, um `IQOptionType`, um `IQNewsButtonData`, um
`IQNewsPriority`). Conhecemos ~12 nomes. Os outros 17 estão no binário; o pool
de strings é fundido por sufixo, então vizinhança no `strings` não é semântica
e procurar por ali não ajudou.

Dois caminhos melhores que continuar adivinhando:

- **Gravar a resposta real.** É o método que resolveu todo o resto deste
  projeto. Exige uma sessão autenticada no feed deles com o painel de Análise
  de Mercado aberto.
- **Desmontar a função.** `F2::APNews::onDataReceived` e o construtor da tupla,
  com `wasm-objdump`/`wasm2wat`, mostram a ordem de leitura das chaves.

Vale registrar a armadilha: **o painel gira igual quando não entende e quando
não recebe.** Não há sinal de erro para guiar, o que é exatamente o oposto das
expirações e das carteiras, onde o engine nomeava o que faltava. Medir por
repetição não funciona aqui porque ele não repete o pedido.

Falta também descobrir o que Vídeo Tutoriais, Ajuda e Alertas pedem — ainda não
foram instrumentados — e Torneios e Tabela de Líderes inteiros.

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
