#!/bin/bash

# Define variables
SUPABASE_URL="https://vvremlrohklddpavxewu.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cmVtbHJvaGtsZGRwYXZ4ZXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NDcxMzEsImV4cCI6MjA4MDIyMzEzMX0.sxPS3Od-4TpVRae_6m1-C0BkUN0MfEHe8zrhDlL58O4"

# Create temp files
echo -n "$SUPABASE_URL" > supabase_url.txt
echo -n "$SUPABASE_ANON_KEY" > supabase_anon_key.txt

# Add to Production
echo "Adding NEXT_PUBLIC_SUPABASE_URL to production..."
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production < supabase_url.txt --force

echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY to production..."
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < supabase_anon_key.txt --force

# Add to Preview (optional but good)
echo "Adding NEXT_PUBLIC_SUPABASE_URL to preview..."
npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview < supabase_url.txt --force

echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY to preview..."
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview < supabase_anon_key.txt --force

# Clean up
rm supabase_url.txt supabase_anon_key.txt

echo "Done!"
