#!/bin/bash

rm -rf build/
rm -rf dist/ 

mkdir -p build/cases

cp -rf assets build/
cp -rf config/i18n/locales build/
cp src/cases/mainTest.html build/cases/
