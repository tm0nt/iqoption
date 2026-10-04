# Os painéis do traderoom, gravados do feed ao vivo

Formas tiradas de uma sessão real em `trade.avalonbroker.com`, com 41 mil
quadros de socket e os corpos HTTP dos endpoints de leitura. O que está aqui é
a **estrutura**: quais chaves existem e que tipo de valor cada uma carrega.

A gravação em si não está no repositório e não deve entrar. Ela nomeia a pessoa
que a fez e as pessoas do ranking ao lado dela; `user_id`, `user_name`,
`email`, `ssid`, `skey` e os ids de carteira aparecem abaixo como
`<identity>` e em lugar nenhum com o valor real. O id próprio de um artigo de
ajuda ou de uma categoria de vídeo ficou, porque é parte da forma e não
identifica ninguém.

Para regravar: `scripts/record-live.mjs` abre um Chrome visível num perfil
descartável, a pessoa entra na conta dela, e o script grava só quadros de
socket e corpos de resposta — nunca um corpo de requisição, e nada de caminho
de autenticação.

## O que esta marca não tem

**Não existe feed de notícias.** "Market Analysis" é o calendário econômico:
abrir o painel e clicar num item mostra `Inflation Rate YoY — Thursday at
09:00`, com `actual`/`forecast`/`previous`, importância e ativos afetados. Em
41 mil quadros o cliente nunca enviou `get-news-feed`. O `news-feed` que este
servidor respondia foi escrito contra um painel que a plataforma não popula, e
é por isso que nenhuma forma inventada para ele jamais ia renderizar.

`get-feed-languages` continua existindo e respondendo `{"type": "news", …}` —
o conceito está no engine, a marca é que não usa.

## Webinars — HTTP, não socket

`GET https://api.trade.avalonbroker.com/v1/webinars` — o host é `gateway_api`,
não `event_api`. A resposta é um **array nu**, sem o envelope
`{isSuccessful, message, result}` que o resto desta API usa:

```jsonc
[{
  "id": 1160,
  "title": "Live 328 - Clube do Trading",
  "description": "Live 328",
  "image_url": "storage/public/db/03/7o1ivl0c704k2q3g.png",   // relativo, sem barra inicial
  "image_preview_url": "storage/public/db/03/7o1ivl0c704k2q40.png",
  "streaming_url": "https://www.youtube.com/watch?v=j9yuH7nJPtU",
  "schedule_datetime": 1790980732,   // segundos
  "status": "history",               // separa as abas NEW e HISTORY
  "lang": "pt",
  "duration": 3600,                  // segundos
  "is_liked": false,
  "like_count": 0,
  "watched_count": 0
}]
```

Nada de `start_time`, `lecturer`, `author` nem `end_at` — os nomes que eu havia
deduzido da tabela de strings estavam todos errados. A lição é a de sempre:
gravar vence decodificar.

## Os demais, pelo socket

## Help

```jsonc
// -> sendMessage get-faq
{}

// <- faq
{
 "items": [
  {
   "id": "<int>",
   "icon": "<string, 70 chars>",
   "title": "\"General Questions\"",
   "slug": "\"general-questions\"",
   "description": "\"\"",
   "questions": [
    {
     "id": "<int>",
     "answer": "<string, 308 chars>",
     "question": "<string, 47 chars>",
     "meta": "\"\"",
     "created": "<int>",
     "updated": "null"
    },
    "… 9 items"
   ],
   "created": "<int>",
   "updated": "<int>"
  },
  "… 5 items"
 ]
}
```

## Video Tutorials — categories

```jsonc
// -> sendMessage get-video-categories
{
 "platform": "\"desktop\"",
 "locale": "\"en_US\""
}

// <- video-categories
[
 {
  "id": "<int>",
  "title": "\"Common\"",
  "locale_key": "\"front.categories_common\"",
  "locale_title": "\"Basics\"",
  "has_new_video": "false",
  "bumpers": "[]",
  "instrument": "\"all-instrument\"",
  "weight": "<int>",
  "images": [
   {
    "id": "<int>",
    "category_id": "<int>",
    "locale": "\"en_US\"",
    "image": "<string, 35 chars>",
    "platform": "\"desktop\"",
    "created_at": "<int>",
    "updated_at": "<int>"
   },
   "… 1 items"
  ],
  "icons": [
   {
    "id": "<int>",
    "category_id": "<int>",
    "locale": "\"en_US\"",
    "image": "<string, 35 chars>",
    "platform": "\"desktop\"",
    "created_at": "<int>",
    "updated_at": "<int>"
   },
   "… 1 items"
  ],
  "videos_count": "<int>",
  "created_at": "<int>",
  "updated_at": "<int>"
 },
 "… 7 items"
]
```

## Video Tutorials — tags

```jsonc
// -> sendMessage get-video-tags
{
 "platform": "\"desktop\"",
 "locale": "\"en_US\""
}

// <- video-tags
[
 {
  "id": "<int>",
  "title": "\"Indicators\"",
  "locale_key": "\"front.tags_indicators\"",
  "locale_title": "\"Indicators\"",
  "visible": "true",
  "created_at": "<int>",
  "updated_at": "<int>"
 },
 "… 3 items"
]
```

## Video Tutorials — videos

```jsonc
// -> sendMessage get-videos
{
 "platform": "\"desktop\"",
 "locale": "\"en_US\"",
 "category_filter": "<int>"
}

// <- videos
[
 {
  "id": "<int>",
  "title": "<string, 37 chars>",
  "locale_key": "\"front.video_bitcoin\"",
  "locale_title": "<string, 37 chars>",
  "new": "false",
  "watched": "false",
  "weight": "<int>",
  "published": "true",
  "images": [
   {
    "id": "<int>",
    "video_id": "<int>",
    "locale": "\"en_US\"",
    "platform": "\"all\"",
    "image": "<string, 42 chars>",
    "created_at": "<int>",
    "updated_at": "<int>"
   },
   "… 1 items"
  ],
  "video_locales": [
   {
    "id": "<int>",
    "video_id": "<int>",
    "locale": "\"en_US\"",
    "platform": "\"all\"",
    "video": "<string, 42 chars>",
    "format": "\"mp4\"",
    "duration": "<int>",
    "vimeo_link": "<string, 28 chars>",
    "created_at": "<int>",
    "updated_at": "<int>"
   },
   "… 2 items"
  ],
  "tags": [
   {
    "id": "<int>",
    "title": "\"Basics\"",
    "locale_key": "\"front.tags_basic\"",
    "locale_title": "\"Basics\"",
    "visible": "true",
    "created_at": "<int>",
    "updated_at": "<int>"
   },
   "… 2 items"
  ],
  "categories": [
   {
    "id": "<int>",
    "title": "\"Common\"",
    "locale_key": "\"front.categories_common\"",
    "locale_title": "\"Basics\"",
    "has_new_video": "false",
    "bumpers": "[]",
    "instrument": "\"all-instrument\"",
    "weight": "<int>",
    "images": [
     "{…}",
     "… 1 items"
    ],
    "icons": [
     "{…}",
     "… 2 items"
    ],
    "videos_count": "<int>",
    "created_at": "<int>",
    "updated_at": "<int>"
   },
   "… 1 items"
  ],
  "created_at": "<int>",
  "updated_at": "<int>"
 },
 "… 9 items"
]
```

## Alerts

```jsonc
// -> sendMessage get-alerts
{
 "asset_id": "<int>",
 "type": [
  "\"price\"",
  "… 2 items"
 ]
}

// <- alerts
{
 "total": "<int>",
 "records": [
  {
   "id": "<int>",
   "user_id": "<number: identity>",
   "asset_id": "<int>",
   "instrument_types": [
    "\"marginal-forex\"",
    "… 1 items"
   ],
   "type": "\"price\"",
   "activations": "<int>",
   "created_at": "<int>",
   "value": "<float>"
  },
  "… 1 items"
 ]
}
```

## Leaderboard — top

```jsonc
// -> sendMessage get-leaderboard-top
{
 "type": "\"all\"",
 "instrument_type": "\"all\"",
 "country_id": "<int>"
}

// <- leaderboard-top
[
 {
  "user_id": "<number: identity>",
  "user_name": "<string: identity>",
  "country_id": "<int>",
  "pnl": "<float>"
 },
 "… 100 items"
]
```

## Leaderboard — your place

```jsonc
// -> sendMessage get-leaderboard-position
{
 "type": "\"all\"",
 "instrument_type": "\"all\"",
 "country_id": "<int>"
}

// <- leaderboard-position
{
 "error": "<string, 33 chars>"
}
```

## Tournaments

```jsonc
// -> sendMessage get-tournaments-info
{
 "status": [
  "<int>",
  "… 3 items"
 ],
 "full_info": "true",
 "locale": "\"en\""
}

// <- tournaments-info
{
 "2": {
  "list": "[]",
  "count": "<int>"
 },
 "3": {
  "list": "[]",
  "count": "<int>"
 },
 "5": {
  "list": [
   {
    "id": "<int>",
    "cost": "<int>",
    "name": "\"Torneio Avalon\"",
    "time": "<int>",
    "type": "<int>",
    "flags": [
     "\"BR\"",
     "… 3 items"
    ],
    "rebuy": "true",
    "parent": {},
    "status": "<int>",
    "currency": "\"USD\"",
    "end_date": "<int>",
    "position": "null",
    "image_url": "null",
    "is_winner": "false",
    "balance_id": "null",
    "prize_pool": "<int>",
    "prize_type": "\"prizes\"",
    "rebuy_cost": "<int>",
    "registered": "false",
    "start_date": "<int>",
    "win_amount": "<int>",
    "description": "<string, 911 chars>",
    "instruments": [
     "\"binary-options\"",
     "… 3 items"
    ],
    "option_type": "\"binary\"",
    "rebuy_count": "<int>",
    "users_count": "<int>",
    "illustration": "null",
    "start_amount": "<int>"
   },
   "… 2 items"
  ],
  "count": "<int>"
 }
}
```

## Tournaments — winners

```jsonc
// -> sendMessage get-tournament-winners
{
 "tournament_id": "<int>"
}

// <- tournament-winners
{
 "id": "<int>",
 "winners": [
  {
   "user_id": "<number: identity>",
   "position": "<int>",
   "name": "\"Drierley S.\"",
   "avatar_url": "\"\"",
   "country": "\"Brazil\"",
   "flag": "\"BR\"",
   "balance": "<float>"
  },
  "… 30 items"
 ],
 "winners_table": {
  "1": "<int>",
  "2": "<int>",
  "3": "<int>",
  "4": "<int>",
  "5": "<int>",
  "6": "<int>",
  "7": "<int>",
  "8": "<int>",
  "9": "<int>",
  "10": "<int>"
 }
}
```

## Market Analysis — calendar

```jsonc
// -> sendMessage get-economic-calendar-events
{
 "offset": "<int>",
 "limit": "<int>",
 "assets": "[]",
 "category_groups": [
  "\"business\"",
  "… 13 items"
 ],
 "countries": [
  "\"au\"",
  "… 29 items"
 ],
 "importances": [
  "<int>",
  "… 2 items"
 ],
 "locale": "\"en_US\""
}

// <- economic-calendar-events
{
 "events": [
  {
   "id": "<int>",
   "actual": "\"\"",
   "country": "\"us\"",
   "datetime": "<int>",
   "forecast": "\"\"",
   "importance": "<int>",
   "name": "\"Fed Collins Speech\"",
   "previous": "\"\""
  },
  "… 60 items"
 ]
}
```

## Market Analysis — filters

```jsonc
// -> sendMessage get-economic-calendar-filters
{}

// <- economic-calendar-filters
{
 "category_groups": [
  "\"business\"",
  "… 13 items"
 ],
 "countries": [
  {
   "short_name": "\"au\"",
   "currency": "\"AUD\""
  },
  "… 29 items"
 ],
 "importances": [
  "<int>",
  "… 3 items"
 ]
}
```

## Market Analysis — one event

```jsonc
// -> sendMessage get-economic-calendar-events-info
{
 "locale": "\"en_US\"",
 "ids": [
  "<int>",
  "… 1 items"
 ]
}

// <- economic-calendar-events-info
{
 "events": [
  {
   "id": "<int>",
   "country": "\"us\"",
   "ticker": "\"UNITEDSTANONMANPMI\"",
   "period": "\"Sep\"",
   "previous": "\"55.4\"",
   "actual": "\"\"",
   "forecast": "\"55.7\"",
   "description": "<string, 350 chars>",
   "original_description": "<string, 350 chars>",
   "assets": [
    "<int>",
    "… 17 items"
   ],
   "historical_values": [
    {
     "datetime": "<int>",
     "value": "\"55.4\""
    },
    "… 30 items"
   ]
  },
  "… 1 items"
 ],
 "total": "<int>"
}
```

## Promo — available codes

```jsonc
// -> sendMessage promo-codes.get-available-promo-codes
{
 "limit": "<int>",
 "offset": "<int>",
 "locale": "\"en_US\"",
 "currency": "\"BRL\""
}

// <- available-promo-codes
[
 {
  "code": "\"WELCOME100\"",
  "id": "<int>",
  "title": "\"Bonus up to 100%\"",
  "description": "<string, 206 chars>",
  "description_short": "<string, 44 chars>",
  "type": "\"deposit_bonus\"",
  "params": {},
  "conditions": [
   {
    "key": "\"ttl\"",
    "parameters": [
     "{…}",
     "… 1 items"
    ]
   },
   "… 1 items"
  ],
  "restrictions": [
   {
    "key": "\"eol\"",
    "parameters": [
     "{…}",
     "… 1 items"
    ]
   },
   "… 1 items"
  ],
  "recalls": "[]",
  "status": "\"executed\"",
  "quantity": "<int>",
  "kinds": [
   "\"exclusive\"",
   "… 1 items"
  ],
  "applied_at": "<int>",
  "executed_at": "<int>"
 },
 "… 1 items"
]
```

## Promo — one code

```jsonc
// -> sendMessage promo-codes.get-promo-code-details
{
 "id": "<int>",
 "locale": "\"en_US\"",
 "currency": "\"BRL\""
}

// <- promo-code-details
{
 "code": "\"WELCOME100\"",
 "id": "<int>",
 "instructions": {
  "title": "<string, 27 chars>",
  "steps": [
   {
    "title": "<string, 62 chars>",
    "description": "<string, 62 chars>"
   },
   "… 2 items"
  ]
 },
 "information": {
  "details": "<string, 597 chars>"
 }
}
```