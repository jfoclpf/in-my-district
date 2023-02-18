## Como instalar e testar a APP
### Requisitos, _debug_ e eventuais problemas

* ver [documentação](/docs.md)

### Android

Para preparar a máquina (Debian/Ubuntu) vede [`/.github/workflows/android.yml`](/.github/workflows/android.yml)

 1. Clone este projeto<br>`git clone https://github.com/jfoclpf/in-my-district.git`
 2. Entre na pasta recém criada<br>`cd in-my-district/app`
 3. Adicione a plataforma<br>`cordova platform add android`
 3. Corra `cordova build android` para construir o projeto na sua máquina. Em Android cria o ficheiro APK na pasta `platforms/android/build/outputs/apk`

### iOS

Para preparar a máquina macOS vede [`/.github/workflows/ios.yml`](/.github/workflows/ios.yml)

```
git clone https://github.com/jfoclpf/in-my-district.git
cd in-my-district/app
cordova platform rm android
cordova platform add ios
open platforms/ios/No\ meu\ Bairro\!.xcworkspace/
```
