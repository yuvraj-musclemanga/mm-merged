import { NextRequest, NextResponse } from 'next/server';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function POST(req: NextRequest) {
    try {
        const { name, phone, email, query } = await req.json();

        if (!name || !email || !query) {
            return NextResponse.json(
                { error: 'Name, email and query are required.' },
                { status: 400 }
            );
        }

        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.BREVO_SENDER_EMAIL;   // your verified sender
        const recipientEmail = process.env.BREVO_RECIPIENT_EMAIL || senderEmail; // inbox that receives queries

        if (!apiKey || !senderEmail) {
            console.error('Brevo env vars missing: BREVO_API_KEY or BREVO_SENDER_EMAIL');
            return NextResponse.json(
                { error: 'Email service is not configured.' },
                { status: 500 }
            );
        }

        // ── 1. Notify the store ─────────────────────────────────────────────
        const storeEmailPayload = {
            sender: { name: 'Musclemanga Contact Form', email: senderEmail },
            to: [{ email: recipientEmail, name: 'Musclemanga Team' }],
            replyTo: { email, name },
            subject: `New Contact Query from ${name}`,
            htmlContent: `
                <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border:1px solid #222;">
                    <h2 style="margin-top:0;letter-spacing:0.1em;font-size:1.25rem;text-transform:uppercase;">New Contact Query</h2>
                    <hr style="border-color:#333;margin:24px 0;" />
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr>
                            <td style="padding:8px 0;color:#888;width:120px;text-transform:uppercase;letter-spacing:0.05em;">Name</td>
                            <td style="padding:8px 0;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Email</td>
                            <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#fff;">${email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Phone</td>
                            <td style="padding:8px 0;">${phone || '—'}</td>
                        </tr>
                    </table>
                    <hr style="border-color:#333;margin:24px 0;" />
                    <p style="color:#888;text-transform:uppercase;letter-spacing:0.05em;font-size:0.8rem;">Message</p>
                    <p style="white-space:pre-wrap;line-height:1.6;">${query}</p>
                    <hr style="border-color:#333;margin:24px 0;" />
                    <p style="color:#555;font-size:0.75rem;">Sent via musclemanga.in contact form</p>
                </div>
            `,
        };

        const storeRes = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify(storeEmailPayload),
        });

        if (!storeRes.ok) {
            const errBody = await storeRes.text();
            console.error('Brevo send error (store):', errBody);
            return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
        }

        // ── 2. Auto-reply to the visitor ────────────────────────────────────
        const autoReplyPayload = {
            sender: { name: 'Musclemanga', email: senderEmail },
            to: [{ email, name }],
            subject: `We received your message — Musclemanga`,
            htmlContent: `
                <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border:1px solid #222;">
                    <h2 style="margin-top:0;letter-spacing:0.1em;font-size:1.25rem;text-transform:uppercase;">Message Received</h2>
                    <hr style="border-color:#333;margin:24px 0;" />
                    <p>Hi ${name},</p>
                    <p style="color:#aaa;line-height:1.7;">
                        Thanks for reaching out! We've received your message and our team will get back to you within <strong style="color:#fff;">24–48 hours</strong>.
                    </p>
                    <p style="color:#aaa;line-height:1.7;">
                        In the meantime, feel free to browse our latest drops at <a href="https://musclemanga.in" style="color:#fff;">musclemanga.in</a>.
                    </p>
                    <hr style="border-color:#333;margin:24px 0;" />
                    <p style="color:#555;font-size:0.75rem;">— The Musclemanga Team</p>
                </div>
            `,
        };

        // Fire auto-reply without blocking the response
        fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify(autoReplyPayload),
        }).catch(err => console.error('Auto-reply failed:', err));

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Contact API error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
