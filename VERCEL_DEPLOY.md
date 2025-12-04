# Deployment Guide for Vercel

## Prerequisites

1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **Vercel CLI** (Optional but recommended): `npm i -g vercel`

## Option 1: Deploy via Git (Recommended)

1.  Push your code to a GitHub repository.
2.  Go to the Vercel Dashboard and click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Configure Environment Variables**:
    Add the following variables in the "Environment Variables" section:
    *   `NEXT_PUBLIC_SUPABASE_URL`: (From your Supabase Project Settings)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (From your Supabase Project Settings)
    *   `STRIPE_SECRET_KEY`: (From your Stripe Dashboard)
    *   `STRIPE_WEBHOOK_SECRET`: (From your Stripe Webhook Settings)
    *   `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://your-project.vercel.app`)

5.  Click **"Deploy"**.

## Option 2: Deploy via CLI

1.  Run the following command in your terminal:
    ```bash
    npx vercel
    ```
2.  Follow the prompts:
    *   Set up and deploy? **Y**
    *   Which scope? (Select your account)
    *   Link to existing project? **N**
    *   Project name? **dao123** (or your choice)
    *   In which directory? **./**
    *   Want to modify these settings? **N** (Auto-detect Next.js is usually correct)

3.  **Set Environment Variables**:
    After the first deployment (which might fail due to missing env vars), go to the Vercel Dashboard for your new project, add the environment variables listed in Option 1, and redeploy.
    
    Or set them via CLI:
    ```bash
    npx vercel env add NEXT_PUBLIC_SUPABASE_URL
    # ... repeat for others
    npx vercel --prod
    ```

## Post-Deployment Setup

1.  **Stripe Webhook**:
    *   Get your Vercel deployment URL (e.g., `https://dao123.vercel.app`).
    *   Go to Stripe Dashboard -> Developers -> Webhooks.
    *   Add an endpoint: `https://dao123.vercel.app/api/stripe/webhook`
    *   Select events: `checkout.session.completed`.
    *   Copy the **Signing Secret** and update your `STRIPE_WEBHOOK_SECRET` environment variable in Vercel.

2.  **Supabase Auth**:
    *   Go to Supabase Dashboard -> Authentication -> URL Configuration.
    *   Add your Vercel URL to **Site URL** and **Redirect URLs**.
