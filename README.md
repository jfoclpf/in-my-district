<h1 align="center">
  <a href="https://nomeubairro.app/"><img src="https://play-lh.googleusercontent.com/DX65ws86EvEk4-_c7bVtDHygeZPPnguGWe3IrSV6AMjj6J72y-pAdWc07g0Rz_3VVg=w200-h200-rw" alt="logo" width="200"/></a>
  <br>
  No meu Bairro!
  <br>
</h1>


[![Node.js CI](https://github.com/jfoclpf/in-my-district/actions/workflows/android.yml/badge.svg)](https://github.com/jfoclpf/in-my-district/actions/workflows/android.yml)
[![Node.js CI](https://github.com/jfoclpf/in-my-district/actions/workflows/ios.yml/badge.svg)](https://github.com/jfoclpf/in-my-district/actions/workflows/ios.yml)
[![js-standard-style][js-standard-style_img]][js-standard-style_url]

[js-standard-style_img]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[js-standard-style_url]: https://standardjs.com/

Aplicação móvel para comunicar ao seu Município e/ou Junta de Freguesia anomalias no seu bairro, como buracos na calçada ou lixo por recolher.

O código está desenhado em Javascript para ser corrido num smartphone. Para tal faz uso da plataforma <a href="https://cordova.apache.org/">Apache Cordova</a>.

A APP para Android está aqui: 
 - [F-Droid](https://f-droid.org/packages/com.in.my.district/), 
 - [Google Play](https://play.google.com/store/apps/details?id=com.in.my.district)

## Estrutura

Este mono-repositório contém o código de três componentes principais, contidos nas seguintes diretorias:

 - [`app/`](app/): Aplicação móvel para Android ou iOS, escrita em Apache Cordova (Javascript)
 - [`server/`](server/): Servidor em NodeJS para comunicar com a APP e com uma base de dados MySQL
 - [`website/`](website/): Página web desenvolvida em Wordpress para anunciar o projeto e publicar as ocorrências

## Contribuições são muito bem-vindas

 * Usamos StandardJS para o código
 * Respeite a estrutura dos ficheiros
 * Comente sempre o código (preferencialmente em Inglês), tal ajuda os outros a compreender as suas contribuiçes

## Licença

[GNU GPLv3](http://www.gnu.org/licenses/gpl-3.0.en.html)
