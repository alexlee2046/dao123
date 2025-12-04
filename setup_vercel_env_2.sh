#!/bin/bash

# Define variables
STRIPE_PK="pk_test_51SWdaY0sdMjU9FViFzegxNHSds7DNBO7sn26yynAOi8pNpm1Iiw4sWzluU20jvUC2ay6HBITJBXLHDa8E0pdJvCf007ac4Whq0"
STRIPE_WEBHOOK="whsec_CR15syaMjGI0lKSWsthEnApNiLtdEcLL"
STRIPE_SK="sk_test_51SWdaY0sdMjU9FVirxdVrnV9uq8BLaQjbZuwaxk7RAwbv9o1Anlc8q2oGFh320hjbpSNpnu0JvobBGT7hXH8LKHm002cBiYoZU"
SUPABASE_SERVICE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cmVtbHJvaGtsZGRwYXZ4ZXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY0NzEzMSwiZXhwIjoyMDgwMjIzMTMxfQ.z4-54qnbsDSr2Mi6dP9opS_Y1PHkRWrTfWbo-gLL4io"

# Create temp files
echo -n "$STRIPE_PK" > stripe_pk.txt
echo -n "$STRIPE_WEBHOOK" > stripe_webhook.txt
echo -n "$STRIPE_SK" > stripe_sk.txt
echo -n "$SUPABASE_SERVICE" > supabase_service.txt

# Add to Production
echo "Adding NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY..."
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production < stripe_pk.txt --force

echo "Adding STRIPE_WEBHOOK_SECRET..."
npx vercel env add STRIPE_WEBHOOK_SECRET production < stripe_webhook.txt --force

echo "Adding STRIPE_SECRET_KEY..."
npx vercel env add STRIPE_SECRET_KEY production < stripe_sk.txt --force

echo "Adding SUPABASE_SERVICE_ROLE_KEY..."
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production < supabase_service.txt --force

# Cleanup
rm stripe_pk.txt stripe_webhook.txt stripe_sk.txt supabase_service.txt

echo "Done!"
