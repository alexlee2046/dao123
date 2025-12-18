import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for unsubscribe handling
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const logId = searchParams.get('id');

  if (!logId) {
    return new NextResponse(renderUnsubscribePage('error', 'Invalid unsubscribe link'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const supabase = getSupabaseAdmin();

  // Get email log to find contact info
  const { data: log, error } = await supabase
    .from('email_logs')
    .select(`
      id,
      contact_id,
      contacts (
        id,
        email,
        user_id
      )
    `)
    .eq('id', logId)
    .single();

  if (error || !log) {
    return new NextResponse(renderUnsubscribePage('error', 'Invalid unsubscribe link'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const contact = (log as any).contacts;

  if (!contact?.email || !contact?.user_id) {
    return new NextResponse(renderUnsubscribePage('error', 'Contact information not found'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Add to unsubscribe list
  const { error: unsubError } = await supabase
    .from('email_unsubscribes')
    .upsert({
      user_id: contact.user_id,
      contact_id: contact.id,
      email: contact.email.toLowerCase(),
      reason: 'user_request',
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,email',
    });

  if (unsubError) {
    console.error('[Unsubscribe] Error:', unsubError);
    return new NextResponse(renderUnsubscribePage('error', 'Failed to process unsubscribe'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new NextResponse(renderUnsubscribePage('success', contact.email), {
    headers: { 'Content-Type': 'text/html' },
  });
}

function renderUnsubscribePage(status: 'success' | 'error', message: string): string {
  const isSuccess = status === 'success';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? 'Unsubscribed' : 'Error'} - Dao123</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .icon.success {
      background: #d1fae5;
      color: #059669;
    }
    .icon.error {
      background: #fee2e2;
      color: #dc2626;
    }
    h1 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 12px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
    }
    .email {
      font-weight: 600;
      color: #374151;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${status}">
      ${isSuccess ? '✓' : '✕'}
    </div>
    <h1>${isSuccess ? 'Successfully Unsubscribed' : 'Something Went Wrong'}</h1>
    <p>
      ${isSuccess
        ? `You have been unsubscribed from our mailing list. The email address <span class="email">${message}</span> will no longer receive marketing emails from us.`
        : message
      }
    </p>
    ${isSuccess ? `
    <p style="margin-top: 16px; font-size: 14px;">
      Changed your mind? You can always subscribe again by signing up on our website.
    </p>
    ` : ''}
    <div class="footer">
      <a href="https://dao123.com">← Back to Dao123</a>
    </div>
  </div>
</body>
</html>
  `;
}
