#!/bin/bash

echo "🔧 Starting TypeScript fixes..."

# 1. Clean build cache
echo "📦 Cleaning cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf dist

# 2. Install/update packages
echo "📦 Installing required packages..."
npm install @coinbase/onchainkit@latest wagmi@latest viem@2.x @tanstack/react-query@latest @farcaster/frame-sdk@latest

# 3. Install type definitions
echo "📦 Installing type definitions..."
npm install -D @types/node@latest @types/react@latest @types/react-dom@latest

# 4. Update tsconfig if needed
echo "⚙️  Checking tsconfig.json..."

# 5. Run type check
echo "🔍 Running type check..."
npx tsc --noEmit

echo "✅ Fix script completed!"
echo ""
echo "If there are still errors, please check:"
echo "1. src/types/global.d.ts - Updated window.ethereum type"
echo "2. src/hooks/useWalletState.ts - Added type assertions"
echo "3. src/components/CustomConnectModal.tsx - Removed duplicate ethereum interface"