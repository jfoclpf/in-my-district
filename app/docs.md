## Requisitos para a APP

A forma mais prática, para preparar uma máquina para desenvolver e correr esta APP, é observar os ficheiros referentes à Integração Contínua (Github Continuous Integration):
 - Android: [`/.github/workflows/android.yml`](/.github/workflows/android.yml)
 - iOS: [`/.github/workflows/ios.yml`](/.github/workflows/ios.yml)

### [Apache Cordova](https://cordova.apache.org/)

Este projeto faz uso de <a href="https://cordova.apache.org/">Apache Cordova</a> para converter código HTML5 e Javascript para uma aplicação de dispositivo móvel, como Android ou iOS. Precisa, portanto, de ter Apache Cordova instalado na sua máquina.

### [Node JS](https://nodejs.org/en/download/)

O projeto necessita de alguns pacotes `npm`, sendo que o `npm` vem instalado com o `nodejs`.
Alguns scripts do projeto também fazem uso do `nodejs`.

### [gradle](https://docs.gradle.org/current/userguide/what_is_gradle.html)

O gradle é usado para fazer o `build` dos projetos Apache Cordova

### Java

É uma exigência do Apache Cordova a instalação do Java.

### [Android SDK](https://stackoverflow.com/questions/34556884/how-to-install-android-sdk-on-ubuntu) ou [Android Studio](https://developer.android.com/studio/install)

O Android SDK (que é instalado automaticamente quando se instala o Android Studio) é usado para testar a APP no seu telemóvel Android.

No caso de não ter instalado o Android Studio, poderá precisar também do [Android CMD Line tools](https://developer.android.com/studio/command-line) para obter as últimas versões dos comandos.

## Configurações

Por padrão a APP usa o ficheiro público de configurações [`/keys-configs/configs.sample.json`](/keys-configs/configs.sample.json). 

Para testes ou produção com um Servidor e Base de Dados personalizados deverá criar uma cópia privada deste ficheiro denominando-o de `/keys-configs/configs.json` e editando-o em conformidade (este ficheiro não será registado no git, vede [`/.gitignore`](/.gitignore)), sendo necessário também atribuir a variável de sistema `CONFIGS_PROD=1` antes dos comandos `cordova`, por exemplo em Unix/Bash `CONFIGS_PROD=1 cordova run android` (vede por exemplo os scripts localizados em [`/scripts`](./scripts)).

## Eventuais problemas com versões do Java

Um problema comum pode estar relacionado com as versões do Java. Para saber a versão corra `java -version` e `javac -version` (compilador).

Em Debian/Ubuntu para escolher a versão correta, corra `sudo update-alternatives --config javac`. Em macOS, por exemplo, `export JAVA_HOME=/usr/libexec/java_home -v 1.11`.

Edite também a variável `JAVA_HOME` em conformidade com a versão pretendida.

## Eventuais problemas com Gradle

O [gradle](https://docs.gradle.org/current/userguide/what_is_gradle.html) é um executor de tarefas de compilação e é instalado aquando de `cordova build`. Pode dar problemas nesse comando (erro: `Could not determine java version from 'x.x.x'`). O gradle pode envolver diferentes versões:

- a versão global: `gradle -v`
- a versão local do project (wrapper): `./platforms/android/gradlew -v`

Tal pode dar problemas porque diferentes versões de gradle dependem de diferentes versões de java. Verificar a variável `JAVA_HOME` com `echo $JAVA_HOME`. Para resolver o problema mudar esta variável e associá-la a outras versões de java, por exemplo:

`export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64/` ou<br>
`export JAVA_HOME=/usr/lib/jvm/jdk1.8.0_131/` ou<br>
mesmo apagar com `export JAVA_HOME=`

## Testar num smartphone

Para testar num smartphone Android precisa de ativar nas configurações do smartphone o [Developer options](https://developer.android.com/studio/command-line/adb#Enabling) e dentro desse menu precisa de ativar a opção <b>USB debugging</b>.

Depois corra numa linha de comandos

`adb devices`

para listar os dispositivos Android detectados. Caso o dispositivo seja detetado, corra

`cordova run android --device`

Para fazer debug no Chrome aceda a `chrome://inspect/#devices`

## Testar num emulador

Instalar o emulador

```
[sudo] sdkmanager --install "emulator"
```

Instalar as plataformas de teste, exemplo:

```
[sudo] sdkmanager --install "system-images;android-32;google_apis;x86_64"
[sudo] sdkmanager --install "system-images;android-33;google_apis;x86_64"
```

Criar o dispositivo virtual (AVD), exemplo:

```
avdmanager create avd -n emulator -k "system-images;android-32;google_apis;x86_64"
```

Confirmar que ficou instalado

```
avdmanager list avd
```

Correr o emulador

```
cordova emulate android --target=emulator
```

## Plugins necessários

* ver ficheiro `package.json`.
