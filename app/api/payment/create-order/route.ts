import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { addressId, couponCode } = await req.json();
        
        // 1. Authenticate user from Authorization Header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // 2. Fetch User's DB Cart to verify total securely
        const { data: cart } = await supabaseAdmin
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

        const { data: items } = await supabaseAdmin
            .from('cart_items')
            .select(`
                quantity,
                variant_id,
                product_variants (
                    id,
                    size,
                    price,
                    products (
                        name
                    )
                )
            `)
            .eq('cart_id', cart.id);

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // Calculate Subtotal securely
        let subtotal = 0;
        let discount = 0;
        items.forEach((item: any) => {
            const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
            const price = variant?.price || 0;
            subtotal += (price * item.quantity);
        });

        // 3. Process Coupon if exists
        let activeCoupon = null;
        if (couponCode) {
            const { data: cp } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .ilike('code', couponCode.trim())
                .eq('is_active', true)
                .maybeSingle();
            
            if (cp) {
                // Determine if valid based on activation_date if it's username type
                const now = new Date();
                const activationDate = cp.activation_date ? new Date(cp.activation_date) : null;
                
                if (!activationDate || activationDate <= now) {
                    activeCoupon = cp;
                    discount = subtotal * (cp.discount_percentage / 100);
                }
            }
        }

        const shippingFee = 0; // Configurable
        const finalTotal = subtotal - discount + shippingFee;

        // 4. Create Razorpay Sub-Order
        // Amount must be in the smallest currency unit (paise for INR)
        const amountInPaise = Math.round(finalTotal * 100);
        
        // Generate a custom order number internally
        const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: orderNumber,
            notes: {
                userId,
                addressId,
                couponCode: activeCoupon?.code || '',
            }
        });

        // 5. Create Pending Order in Supabase
        const { data: orderData, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId,
                address_id: addressId,
                order_number: orderNumber,
                status: 'pending',
                payment_status: 'pending',
                subtotal,
                discount,
                shipping_fee: shippingFee,
                total: finalTotal,
                coupon_code: activeCoupon ? activeCoupon.code : null,
                razorpay_order_id: razorpayOrder.id,
            })
            .select('id')
            .single();

        if (orderError) {
            console.error("Order creation error details:", JSON.stringify(orderError, null, 2));
            return NextResponse.json({ 
                error: `Failed to create internal order: ${orderError.message}`,
                details: orderError.hint || orderError.details 
            }, { status: 500 });
        }

        // 6. Bulk Insert Order Items
        const orderItemsPayload = items.map((item: any) => {
            const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
            const product = variant?.products ? (Array.isArray(variant.products) ? variant.products[0] : variant.products) : null;
            
            return {
                order_id: orderData.id,
                variant_id: item.variant_id,
                product_name: product?.name || 'Unknown',
                variant_label: variant?.size || '',
                quantity: item.quantity,
                unit_price: variant?.price || 0,
                total_price: (variant?.price || 0) * item.quantity,
            };
        });

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItemsPayload);

        if (itemsError) {
             console.error("Order items error:", itemsError);
             // We won't crash hard, but it should be logged. The order is securely generated.
        }

        // Return razorpay specifics
        return NextResponse.json({
            orderId: orderData.id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });

    } catch (e: any) {
        console.error("Payment API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
