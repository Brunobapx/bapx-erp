#!/bin/bash

# Manual database setup script for local development or troubleshooting
set -e

echo "🛠️ Manual ERP Database Setup"
echo "This script will manually initialize your database"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your Supabase credentials"
    echo ""
    echo "Example .env content:"
    echo "VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=your-anon-key"
    exit 1
fi

source .env

echo "🔍 Configuration:"
echo "   Supabase URL: $VITE_SUPABASE_URL"
echo "   Anon Key: ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo ""

read -p "Continue with database setup? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting manual database initialization..."

# Call the initialization function
response=$(curl -s -X POST \
    "${VITE_SUPABASE_URL}/functions/v1/initialize-database" \
    -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}')

echo "📋 Response received:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Check response
if echo "$response" | grep -q '"success":true'; then
    if echo "$response" | grep -q '"alreadyInitialized":true'; then
        echo "✅ Database was already initialized"
    else
        echo "✅ Database initialization completed successfully!"
        echo ""
        echo "🔑 Master User Credentials:"
        echo "   Email: bapx@bapx.com.br"
        echo "   Password: 123456"
        echo ""
        echo "⚠️  IMPORTANT: Change the master password after first login!"
    fi
    echo ""
    echo "🎉 Your ERP system is ready to use!"
else
    echo "❌ Database initialization failed"
    echo "Please check the response above for error details"
    exit 1
fi