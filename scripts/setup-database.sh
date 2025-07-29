#!/bin/bash

# Database initialization script for VPS deployment
set -e

echo "🔧 Starting ERP Database Setup..."

# Load environment variables
if [ -f .env ]; then
    source .env
    echo "✅ Environment variables loaded"
else
    echo "❌ .env file not found"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Required Supabase environment variables not set"
    echo "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env"
    exit 1
fi

echo "🔍 Checking database status..."

# Function to call the initialization endpoint
initialize_database() {
    echo "🚀 Initializing database..."
    
    response=$(curl -s -X POST \
        "${VITE_SUPABASE_URL}/functions/v1/initialize-database" \
        -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    echo "📋 Response: $response"
    
    # Check if initialization was successful
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Database initialization completed successfully!"
        
        # Extract master user info if available
        if echo "$response" | grep -q '"masterUser"'; then
            echo ""
            echo "🔑 Master User Credentials:"
            echo "   Email: bapx@bapx.com.br"
            echo "   Password: 123456"
            echo ""
            echo "⚠️  IMPORTANT: Change the master password after first login!"
        fi
        
        return 0
    else
        echo "❌ Database initialization failed"
        echo "Response: $response"
        return 1
    fi
}

# Function to check if database is already initialized
check_database_status() {
    echo "🔍 Checking if database is already initialized..."
    
    response=$(curl -s -X POST \
        "${VITE_SUPABASE_URL}/functions/v1/initialize-database" \
        -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$response" | grep -q '"alreadyInitialized":true'; then
        echo "✅ Database is already initialized"
        return 0
    else
        echo "📊 Database needs initialization"
        return 1
    fi
}

# Wait for Supabase to be available
echo "⏳ Waiting for Supabase to be available..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s "${VITE_SUPABASE_URL}/rest/v1/" -H "apikey: ${VITE_SUPABASE_ANON_KEY}" > /dev/null 2>&1; then
        echo "✅ Supabase is available"
        break
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts - Waiting for Supabase..."
    sleep 5
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Supabase is not available after $max_attempts attempts"
    exit 1
fi

# Check if database needs initialization
if check_database_status; then
    echo "✅ Database setup is complete"
    exit 0
fi

# Initialize database
if initialize_database; then
    echo ""
    echo "🎉 ERP System Database Setup Complete!"
    echo ""
    echo "📋 What was created:"
    echo "   • All database tables and relationships"
    echo "   • System modules and permissions"
    echo "   • Default financial categories"
    echo "   • Payment methods and terms"
    echo "   • Master user account"
    echo ""
    echo "🚀 Your ERP system is ready to use!"
    echo "   Access: ${VITE_SUPABASE_URL%/functions*}"
    echo ""
else
    echo "❌ Database setup failed"
    exit 1
fi