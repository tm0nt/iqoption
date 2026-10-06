# Arte dos instrumentos

`avalon-asset-images.json` mapeia o ticker de um instrumento ao caminho da
imagem que a plataforma usa para ele: `EURUSD` para
`/storage/public/5a/c8/f1a43625d.png`.

Os caminhos são hashes de conteúdo e **não dão para derivar**. A coluna
`assets.image` já carregou `/storage/public/assets/<id>.png`, que parecia
razoável e que a CDN responde com uma página de erro — foi assim que todos os
ícones viraram um pixel transparente sem ninguém notar.

O mapa saiu de uma gravação da plataforma ao vivo, onde cada instrumento
publica o seu `image`. Está aqui porque a gravação não está: ela pesa 249 MiB,
carrega a sessão de quem a fez e vive fora do repositório. Sem este arquivo,
acrescentar um instrumento significaria gravar tudo de novo.

## Como usar

Ao cadastrar um instrumento, procure o ticker aqui e ponha o caminho em
`assets.image`. Depois rode o espelhador, que baixa o que faltar:

```
node scripts/download-artwork.mjs <gravação.jsonl>
```

Os arquivos vão para `public/storage/`, que é ignorado pelo git — como o build
do engine, nada disso é nosso. O rewrite em `next.config.ts` manda
`/storage/public/*` para um pixel transparente, e é `afterFiles`, então o Next
verifica `public/` primeiro: arquivo espelhado ganha, e só os buracos caem no
pixel.

## O que tem aqui

712 instrumentos, dos quais 687 já têm o arquivo espelhado neste repositório.
Os 25 restantes são de famílias que esta plataforma não negocia — pedi-los é
uma linha a mais no espelhador, não um problema.
