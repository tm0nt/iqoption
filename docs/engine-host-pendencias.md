# Engine host — o que falta

Estado em 4 de outubro de 2026. O traderoom roda em `/[lang]/traderoom`, servido
pelo Next, com o catálogo de instrumentos vindo do MySQL e os preços de cripto
vindo da Binance. O que está abaixo é o que ainda não está pronto, em ordem do
que mais dói.

Para o protocolo em si — o que cada frame carrega e por quê — veja
[`avalon-backend.md`](./avalon-backend.md). Este arquivo é só a lista de
pendências.

## Bloqueios reais

### 1. A administração não distingue administrador de usuário comum

`/api/admin/*` agora exige sessão — o middleware recusa com 401 sem ela — mas
**qualquer conta serve**. Quem se registrar na plataforma muda o que ela
negocia, com que pagamento, e para qual WebSocket cada sessão aponta.

Falta um papel. O mínimo: uma coluna `role` em `users`, o middleware exigindo
`admin` em `/api/admin/*`, e o primeiro administrador criado por script e não
por formulário.

### 2. Não existe interface de administração

As rotas existem e respondem JSON; a tela não. Hoje se mexe por `curl`:

```sh
curl -s localhost:3000/api/admin/assets | jq '.assets[] | {id, ticker, source, enabled}'
curl -s -X PATCH localhost:3000/api/admin/assets/860 \
  -H 'content-type: application/json' -d '{"enabled":false,"profit":80}'
curl -s -X POST localhost:3000/api/admin/reload
```

### 3. As posições não persistem

Contas e carteiras agora vivem no banco: `resolveSession` resolve o ssid em
`trading_sessions`, carrega o usuário e suas carteiras, e cada aposta e cada
liquidação gravam o saldo de volta. Um ssid que ninguém emitiu é recusado com
o código 4010 — a porta aberta que havia aqui está fechada, salvo quando
`AVALON_ALLOW_ANONYMOUS=1` a reabre de propósito para desenvolvimento sem o app.

**Os negócios em si continuam em memória** (`server/market/positions.mjs`).
Reiniciar o feed com posições abertas as apaga, e o histórico volta vazio.
Falta um modelo `Position` — as formas estão em `avalon-backend.md`: o conjunto
de campos de `DealBinary` e o envelope `{positions, total, limit}`.

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
9. Dar papel de administrador antes de expor `/api/admin/*` (item 1).
