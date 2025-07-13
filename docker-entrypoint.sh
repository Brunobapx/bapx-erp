#!/bin/sh

# Exit on any error
set -e

echo "Starting ERP System..."

# Replace environment variables in built files if needed
# This is useful for runtime configuration
if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "Environment variables are set, application ready to start..."
else
    echo "Warning: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY should be set"
fi

# Execute the main command
exec "$@"