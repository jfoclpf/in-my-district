#!/bin/bash
# script that generates all the PNG icons from the single SVG root icon
# you need to have ImageMagick on your system, just run in Debian based OS:
# sudo apt install imagemagick


cd "${0%/*}" # directory of this script

for size in 144 192 48 512 72 92 512
do
    convert -background none -size $sizex$size icon.svg android/$size.png; echo "android/$size.png";
done

for size in 100 1024 114 120 128 144 152 167 16 172 180 192 196 20 216 256 29 32 40 48 50 512 55 57 58 60 64 72 76 80 87 88 92
do
    convert -background none -size $sizex$size icon.svg ios/$size.png; echo "ios/$size.png";
done

for size in 100 1024 114 120 128 144 152 167 16 172 180 192 196 20 216 256 29 32 40 48 50 512 55 57 58 60 64 72 76 80 87 88
do
    convert -background none -size $sizex$size icon.svg universal/$size.png; echo "universal/$size.png";
done

# if by any change we need to use inkscape CLI instead, we run:
# inkscape -z -w $size -h $size icon.svg -e <dir>/$size.png
