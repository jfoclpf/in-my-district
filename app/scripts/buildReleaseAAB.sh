#!/bin/bash

cd "${0%/*}" # directory of the script
cd ..        # directory of the app dir

# extract variables
source ../keys/appSigningEnvs

export PATH=${PATH}:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools

cordova clean

cordova build android --prod --release &&

cd platforms/android/ && ./gradlew bundle &&

cd ../../

cp ../keys/$KEY_FILENAME platforms/android/app/build/outputs/bundle/release/
cd platforms/android/app/build/outputs/bundle/release/

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $KEY_FILENAME -storepass $KEY_PASS app-release.aab $KEY_ALIAS &&

cd ../../../../../../..
rm -f dist/inMyDistrict.aab

cp platforms/android/app/build/outputs/bundle/release/app-release.aab dist/inMyDistrict.aab

GREEN=$(tput setaf 2)
printf "\n\n${GREEN}File created at: dist/inMyDistrict.aab\n\n"
