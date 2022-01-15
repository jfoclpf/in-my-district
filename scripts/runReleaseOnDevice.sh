#!/bin/bash

export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64/
export ANDROID_SDK_ROOT=/home/joao/Android/Sdk/
export PATH=${PATH}:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools

cd "${0%/*}" # directory of the script
cd ..        # root directory of the project

#adb kill-server
#adb start-server

# detect if device is connected
adb get-state 1>/dev/null 2>&1 && printf "\033[32mDEVICE ATTACHED\033[0m\n\n" || { printf "\033[31m No device attached\n\n"; exit 1; }

# uninstall only if exists
adb shell pm list packages | grep com.in.my.district && adb uninstall com.in.my.district

# extract $PASS
source keys/keyPassword

cordova clean

cordova build --release android

cp keys/autocosts.keystore platforms/android/app/build/outputs/apk/release/
cd platforms/android/app/build/outputs/apk/release/

# old method of signing; after Android 11 one must use apksigner instead
# jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore autocosts.keystore -storepass $PASS app-release-unsigned.apk autocosts

zipalign -v 4 app-release-unsigned.apk inMyDistrict.apk
apksigner sign --ks autocosts.keystore --pass-encoding utf-8 --ks-key-alias autocosts --ks-pass pass:$PASS --key-pass pass:$PASS inMyDistrict.apk


cd ../../../../../../..

cordova run android --device --release --noprepare --nobuild
