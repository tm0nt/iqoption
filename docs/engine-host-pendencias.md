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

### 2. A liquidação não é transacional

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

### 3. Um único servidor de mercado por banco

Os ids de negócio são alocados no processo, semeados pelo maior id da tabela no
boot. Dois servidores apontando para o mesmo banco distribuiriam o mesmo id e
colidiriam na primeira gravação.

A alternativa é deixar o banco alocar, o que tornaria a abertura de um negócio
assíncrona por todo o roteador — `openOption` é chamada de dentro do tratamento
do frame e a resposta carrega o id. Enquanto for um processo só, isto é uma
restrição anotada, não um defeito.

### 4. Forex ainda é sintético

Só `BINANCE` e `SIMULATED` existem como fontes. Os cinco pares de forex usam a
curva determinística de `server/market/prices.mjs` — ela é convincente e não é
real. Trocar uma linha para `source = 'BINANCE'` com um `sourceSymbol` válido já
funciona hoje; o que falta é um provedor de forex de verdade.

Para acrescentar um: `server/market/binance.mjs` é o modelo. O contrato é
pequeno — `warmUp`, `connect`, `priceAt`, `candleAt` — e o despacho por fonte
está em `prices.mjs`.

### 5. O `/reload` não é automático

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
