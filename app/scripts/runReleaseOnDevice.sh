#!/bin/bash

cd "${0%/*}" # directory of the script
cd ..        # app directory of the project

#adb kill-server
#adb start-server

# extract variables
source ../keys-configs/appSigningEnvs

export PATH=${PATH}:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools
export CONFIGS_PROD=1

# detect if device is connected
adb get-state 1>/dev/null 2>&1 && printf "\033[32mDEVICE ATTACHED\033[0m\n\n" || { printf "\033[31m No device attached\n\n"; exit 1; }

# uninstall only if exists
adb shell pm list packages | grep com.in.my.district && adb uninstall com.in.my.district

cordova clean
ls "../keys-configs/$KEY_FILENAME"

printf '\n\n\n\n\n'

cordova run android --release -- --keystore="../keys-configs/$KEY_FILENAME" --storePassword=$KEY_PASS --alias=$KEY_ALIAS --password=$KEY_PASS --packageType=apk
