#!/bin/bash

cd "${0%/*}" # directory of the script
cd ..        # directory of the app dir

# extract variables
source ../keys-configs/appSigningEnvs

export PATH=${PATH}:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools

cordova clean

cordova build --release android

cp ../keys-configs/$KEY_FILENAME platforms/android/app/build/outputs/apk/release/
cd platforms/android/app/build/outputs/apk/release/

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $KEY_FILENAME -storepass $KEY_PASS app-release-unsigned.apk $KEY_ALIAS

zipalign -v 4 app-release-unsigned.apk inMyDistrict.apk

cd ../../../../../../..
rm -f dist/inMyDistrict.apk

cp platforms/android/app/build/outputs/apk/release/inMyDistrict.apk dist/

GREEN=$(tput setaf 2)
printf "\n\n${GREEN}File created at: dist/inMyDistrict.apk\n\n"
