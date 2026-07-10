import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const { couponCode } = await req.json();

        if (!couponCode) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        const { data: cp, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .ilike('code', couponCode.trim())
            .eq('is_active', true)
            .maybeSingle();

        if (error || !cp) {
            return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 });
        }

        const now = new Date();
        const activationDate = cp.activation_date ? new Date(cp.activation_date) : null;

        if (activationDate && activationDate > now) {
            return NextResponse.json({ error: 'Coupon code is not active yet' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            code: cp.code,
            discount_percentage: cp.discount_percentage
        });
    } catch (e: any) {
        console.error('Coupon validation error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
