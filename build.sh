#!/bin/bash

rm -rf build/
rm -rf dist/ 

mkdir build

cp -rf icons build/
cp -rf src/modals build/
cp -rf config/i18n/locales build/
cp src/index.html build/

mkdir -p build/static/font
cp static/font/Roboto-Bold.ttf build/static/font/
cp static/font/Roboto-Regular.ttf build/static/font/
