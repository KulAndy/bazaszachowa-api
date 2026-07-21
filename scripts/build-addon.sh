#!/bin/bash
set -e

pushd src/chess-addon > /dev/null

echo "Cleaning addon build..."
rm -rf build

echo "Configuring addon..."
npx node-gyp configure

echo "Building addon..."
npx node-gyp build

popd > /dev/null

echo "Testing addon..."
node test-addon.js

echo "Addon OK"
