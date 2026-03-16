import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  // Check if email service is available
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ 
      success: false, 
      error: 'Email service temporarily unavailable. Please try again later.' 
    }, { status: 503 });
  }

  try {
    const body = await request.json();

    const { name, email, topic, message }: { name: string; email: string; topic: string; message: string } = body;

    // Server-side validation
    if (!name || name.trim().length === 0 || name.trim().length > 100) {
      return NextResponse.json({ success: false, error: 'Name is required and must be under 100 characters' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
    }
    if (!topic || topic.trim().length === 0 || topic.length > 100) {
      return NextResponse.json({ success: false, error: 'Subject is required and must be under 100 characters' }, { status: 400 });
    }
    if (!message || message.trim().length === 0 || message.length > 2000) {
      return NextResponse.json({ success: false, error: 'Message is required and must be under 2000 characters' }, { status: 400 });
    }

    // Basic spam check
    const suspicious = [name, email, topic, message].some(field => field.toLowerCase().includes('viagra') || field.toLowerCase().includes('casino'));
    if (suspicious) {
      return NextResponse.json({ success: false, error: 'Spam detected' }, { status: 400 });
    }

    // Initialize Resend with checked env var
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Send email
    const adminEmail = 'nicolas_driesen@hotmail.be'; // Change to your email
    await resend.emails.send({
      from: `Hidden Gems Contact <contact@spotly.app>`, // Verified domain in Resend dashboard
      to: adminEmail,

      subject: `New Contact Form: ${topic}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #244E41;">New Message from Hidden Gems Explorer</h1>
          <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Topic:</strong> ${topic}</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 12px; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #64748b; font-size: 14px;">Sent via Hidden Gems Contact Form</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}

