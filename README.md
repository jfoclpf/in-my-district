[![Node.js CI](https://github.com/jfoclpf/in-my-district/actions/workflows/android.yml/badge.svg)](https://github.com/jfoclpf/in-my-district/actions/workflows/android.yml)
[![Node.js CI](https://github.com/jfoclpf/in-my-district/actions/workflows/ios.yml/badge.svg)](https://github.com/jfoclpf/in-my-district/actions/workflows/ios.yml)
[![Dependency Status][dependency status_img]][dependency status_url]
[![js-standard-style][js-standard-style_img]][js-standard-style_url]
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate?hosted_button_id=J7F3ALLQAFWEJ)

[js-standard-style_img]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[js-standard-style_url]: https://standardjs.com/

[dependency status_img]: https://david-dm.org/jfoclpf/in-my-district.svg
[dependency status_url]: https://david-dm.org/jfoclpf/in-my-district

# No meu bairro!

Aplicação móvel para comunicar ao seu município anomalias no seu bairro, como buracos na calçada ou lixo por recolher.

O código está desenhado em Javascript para ser corrido num smartphone. Para tal faz uso da plataforma <a href="https://cordova.apache.org/">Apache Cordova</a>.

* A APP para Android está <a href="https://play.google.com/store/apps/details?id=com.in.my.district">aqui</a>.

## Como instalar e testar
### Requisitos, _debug_ e eventuais problemas

* ver [documentação](https://github.com/jfoclpf/in-my-district/blob/master/docs.md)

### Android

 1. Clone este projeto<br>`git clone https://github.com/jfoclpf/in-my-district.git`
 2. Entre na pasta recém criada<br>`cd in-my-district`
 3. Adicione a plataforma<br>`cordova platform add android`
 3. Corra `cordova build android` para construir o projeto na sua máquina. Em Android cria o ficheiro APK na pasta `platforms/android/build/outputs/apk`

### iOS
```
git clone https://github.com/jfoclpf/in-my-district.git
cd in-my-district
cordova platform rm android
cordova platform add ios
open platforms/ios/No\ meu\ Bairro\!.xcworkspace/
```

## Contribuições são muito bem-vindas

 * Usamos StandardJS para o código
 * Respeite a estrutura dos ficheiros
 * Comente sempre o código (preferencialmente em Inglês), tal ajuda os outros a compreender as suas contribuiçes

## Licença

GNU GPLv3<br>
http://www.gnu.org/licenses/gpl-3.0.en.html <br>
http://choosealicense.com/licenses/gpl-3.0/
