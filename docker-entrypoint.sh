#!/bin/sh

# Exit on any error
set -e

echo "Starting ERP System..."

# Replace environment variables in built files if needed
# This is useful for runtime configuration
if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "Environment variables are set, checking database setup..."
    
    # Check if this is first run by looking for a setup marker
    if [ ! -f "/tmp/.database_checked" ]; then
        echo "First run detected, initializing database..."
        
        # Wait for network to be available
        sleep 10
        
        # Try to initialize database
        if wget -q --spider "$VITE_SUPABASE_URL/functions/v1/initialize-database" 2>/dev/null; then
            echo "Supabase available, calling database initialization..."
            wget -q --post-data='{}' \
                --header="Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
                --header="Content-Type: application/json" \
                -O /tmp/init_response.json \
                "$VITE_SUPABASE_URL/functions/v1/initialize-database" || echo "Database initialization call completed"
            
            if [ -f "/tmp/init_response.json" ]; then
                echo "Database initialization response:"
                cat /tmp/init_response.json
            fi
        else
            echo "Supabase not available yet, skipping auto-initialization"
        fi
        
        # Mark as checked
        touch /tmp/.database_checked
        echo "Database check completed"
    else
        echo "Database already checked in this container session"
    fi
else
    echo "Warning: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY should be set"
fi

# Execute the main command
exec "$@"