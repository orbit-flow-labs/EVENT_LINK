#!/bin/bash
# =================================================================
# Soroban Smart Contract Deployment Script for EventLink on Stellar
# =================================================================

set -e

echo "🚀 Step 1: Building Soroban Rust Smart Contract WASM..."
cd contracts/event_ticket
cargo build --target wasm32-unknown-unknown --release
cd ../..

WASM_PATH="contracts/event_ticket/target/wasm32-unknown-unknown/release/event_ticket.wasm"

if [ ! -f "$WASM_PATH" ]; then
    echo "❌ WASM file not found at $WASM_PATH"
    exit 1
fi

echo "✅ Contract compiled successfully: $WASM_PATH"

echo "🔑 Step 2: Configuring Stellar CLI & Testnet Keypair..."
stellar keys generate eventlink_deployer --network testnet --fund || true

DEPLOYER_ADDRESS=$(stellar keys address eventlink_deployer || echo "GCSOROBANEVENTORGANIZERSTELLARKEY2026")
echo "📍 Deployer Address: $DEPLOYER_ADDRESS"

echo "⚡ Step 3: Deploying WASM to Stellar Testnet Blockchain..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source eventlink_deployer \
  --network testnet)

echo "🎉 CONTRACT DEPLOYED SUCCESSFULLY!"
echo "---------------------------------------------------------"
echo "Soroban Contract ID: $CONTRACT_ID"
echo "---------------------------------------------------------"

echo "⚙️ Step 4: Initializing Contract State on Stellar..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source eventlink_deployer \
  --network testnet \
  -- \
  initialize \
  --organizer "$DEPLOYER_ADDRESS" \
  --name "DRIPS Soroban Hackathon Summit" \
  --total_supply 1000 \
  --royalty_bps 500

echo "✅ Initialization complete!"
echo "Update your .env file with:"
echo "SOROBAN_CONTRACT_ID=$CONTRACT_ID"
