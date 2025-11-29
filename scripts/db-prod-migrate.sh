#!/bin/bash
# Production database migration script
set -e  # Exit on error

source .env.local

if [ -z "$DATABASE_URL_PROD" ]; then
  echo "Error: DATABASE_URL_PROD is not set in .env.local"
  exit 1
fi

# Debug: Check if DATABASE_URL_PROD looks valid (without exposing the full value)
if [[ ! "$DATABASE_URL_PROD" =~ ^postgres ]]; then
  echo "Warning: DATABASE_URL_PROD doesn't start with 'postgres'"
  echo "First 20 chars: ${DATABASE_URL_PROD:0:20}..."
fi

# Check if it's empty or just whitespace
if [ -z "${DATABASE_URL_PROD// }" ]; then
  echo "Error: DATABASE_URL_PROD appears to be empty or whitespace only"
  exit 1
fi

export DATABASE_URL="$DATABASE_URL_PROD"

# Debug: Show connection string structure (masking password)
echo "=== Connection String Debug ==="
echo "Full length: ${#DATABASE_URL_PROD} characters"
echo ""

# Extract and display URL parts (masking password)
if [[ "$DATABASE_URL_PROD" =~ ^(postgresql?://)([^:]+):([^@]+)@([^:/]+)(:([0-9]+))?/(.+)$ ]]; then
  PROTOCOL="${BASH_REMATCH[1]}"
  USERNAME="${BASH_REMATCH[2]}"
  PASSWORD="${BASH_REMATCH[3]}"
  HOST="${BASH_REMATCH[4]}"
  PORT="${BASH_REMATCH[6]:-5432}"
  DATABASE="${BASH_REMATCH[7]}"
  
  echo "Protocol: $PROTOCOL"
  echo "Username: $USERNAME"
  echo "Password: [MASKED - length: ${#PASSWORD} chars]"
  echo "  Password preview (first 10): ${PASSWORD:0:10}..."
  echo "  Password preview (last 10): ...${PASSWORD: -10}"
  echo "Host: $HOST"
  echo "Port: $PORT"
  echo "Database: $DATABASE"
  echo ""
  echo "Reconstructed (masked): ${PROTOCOL}${USERNAME}:***@${HOST}:${PORT}/${DATABASE}"
else
  echo "Warning: Could not parse connection string format"
  echo "First 50 chars: ${DATABASE_URL_PROD:0:50}..."
  echo "Last 50 chars: ...${DATABASE_URL_PROD: -50}"
fi
echo "=============================="
echo ""

drizzle-kit migrate
