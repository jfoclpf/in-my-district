Aqui devem ficar 4 ficheiros com chaves, credenciais e informação particular para cada máquina. Abrir os ficheiros "samples" para ver exemplos.

 - a chave para assinar a APP (por exemplo para a Play Store). Para gerar uma chave [correr](https://stackoverflow.com/questions/3997748/how-can-i-create-a-keystore):
```
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
```
 - `appSigningEnvs`: um ficheiro com o nome da chave, password para essa chave e as variáveis relevantes, que serão usadas nos BASH scripts em `/scripts` (por exemplo [aqui](https://github.com/jfoclpf/in-my-district/blob/main/scripts/buildReleaseAAB.sh#L11))
 - `appSecrets.js`: credenciais para o código Javascript da APP, como por exemplo o UUID dos smartphones dos administradores
 - `serverSecrets.json`: credenciais para o código do servidor, como por exemplo as credenciais da Base de Dados
