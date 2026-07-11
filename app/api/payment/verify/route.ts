import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            internalOrderId 
        } = await req.json();

        // 1. Verify Razorpay Signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', secret)
                                  .update(body.toString())
                                  .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
        }

        // The database function locks the order and completes every dependent
        // write in one transaction. If any step fails, PostgreSQL rolls back
        // all steps and a retry cannot double-credit or double-decrement stock.
        const { data, error } = await supabaseAdmin.rpc('finalize_paid_order', {
            p_order_id: internalOrderId,
            p_razorpay_order_id: razorpay_order_id,
            p_razorpay_payment_id: razorpay_payment_id,
        });

        if (error) {
            console.error('Checkout finalization failed:', error);
            const isOrderMismatch = error.message.includes('Order mismatch');
            return NextResponse.json(
                { error: isOrderMismatch ? 'Order mismatch' : 'Could not finalize payment. Please contact support if payment was deducted.' },
                { status: isOrderMismatch ? 400 : 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: data?.already_processed ? 'Already processed' : 'Payment verified and order processed',
        });

    } catch (error: any) {
        console.error("Signature Verification Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
