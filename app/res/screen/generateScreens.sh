#!/bin/bash
# script that generates all the PNG icons from the single SVG root icon
# you need to have imagemagick, in Debian based OS: sudo apt install imagemagick

cd "${0%/*}" # directory of the script

# Android
convert screen.svg -background white -gravity center -resize "480x800" -extent "480x800" android/screen-hdpi-portrait.png
echo "android/screen-hdpi-portrait.png"
convert screen.svg -background white -gravity center -resize "200x320" -extent "200x320" android/screen-ldpi-portrait.png
echo "android/screen-ldpi-portrait.png"
convert screen.svg -background white -gravity center -resize "320x480" -extent "320x480" android/screen-mdpi-portrait.png
echo "android/screen-mdpi-portrait.png"
convert screen.svg -background white -gravity center -resize "720x1280" -extent "720x1280" android/screen-xhdpi-portrait.png
echo "android/screen-xhdpi-portrait.png"

# iOS
convert screen.svg -background white -gravity center -resize "2048x1536" -extent "2048x1536" ios/screen-ipad-landscape-2x.png
echo "ios/screen-ipad-landscape-2x.png"
convert screen.svg -background white -gravity center -resize "1024x768" -extent "1024x768" ios/screen-ipad-landscape.png
echo "ios/screen-ipad-landscape.png"
convert screen.svg -background white -gravity center -resize "1536x2048" -extent "1536x2048" ios/screen-ipad-portrait-2x.png
echo "ios/screen-ipad-portrait-2x.png"
convert screen.svg -background white -gravity center -resize "768x1024" -extent "768x1024" ios/screen-ipad-portrait.png
echo "ios/screen-ipad-portrait.png"
convert screen.svg -background white -gravity center -resize "960x640" -extent "960x640" ios/screen-iphone-landscape-2x.png
echo "ios/screen-iphone-landscape-2x.png"
convert screen.svg -background white -gravity center -resize "480x320" -extent "480x320" ios/screen-iphone-landscape.png
echo "ios/screen-iphone-landscape.png"
convert screen.svg -background white -gravity center -resize "640x960" -extent "640x960" ios/screen-iphone-portrait-2x.png
echo "ios/screen-iphone-portrait-2x.png"
convert screen.svg -background white -gravity center -resize "640x1136" -extent "640x1136" ios/screen-iphone-portrait-568h-2x.png
echo "ios/screen-iphone-portrait-568h-2x.png"
convert screen.svg -background white -gravity center -resize "320x480" -extent "320x480" ios/screen-iphone-portrait.png
echo "ios/screen-iphone-portrait.png"


