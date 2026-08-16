#!/bin/bash
set -e

echo "Linting TypeScript..."
npx eslint src

echo "Building TypeScript..."
npx tsc

echo "Copying native addon..."
mkdir -p public_nodejs/chess-addon/build/Release
cp src/chess-addon/build/Release/chess.node \
   public_nodejs/chess-addon/build/Release/chess.node

echo "TypeScript build complete"
