#!/bin/bash
# script to update static directory got from simply static wordpress plugin

unzip -o simply-static-*.zip -d static/
rm simply-static-*.zip

git add static/*
git commit -m "update static files"
