#!/bin/bash
cd "${0%/*}"

cordova build

if [ -z "$1" ] 
then
    cordova emulate --target=avd android
else
    cordova emulate --target=$1 android
fi



