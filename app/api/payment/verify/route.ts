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

        // 2. Fetch the matched order
        const { data: order, error: orderFetchErr } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', internalOrderId)
            .eq('razorpay_order_id', razorpay_order_id)
            .single();

        if (orderFetchErr || !order) {
            return NextResponse.json({ error: 'Order mismatch' }, { status: 400 });
        }

        if (order.payment_status === 'paid') {
             return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // 3. Update Order Status
        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'paid',
                status: 'processing',
                razorpay_payment_id: razorpay_payment_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

        // 4. Wallet Rewards Logic
        if (order.notes && order.notes.includes('COUPON_APPLIED:')) {
            const code = order.notes.split('COUPON_APPLIED:')[1];
            if (code) {
                const { data: coupon } = await supabaseAdmin
                    .from('coupons')
                    .select('*')
                    .eq('code', code)
                    .single();
                
                if (coupon && coupon.type === 'username' && coupon.owner_id) {
                    const rewardAmount = parseFloat((order.total * 0.10).toFixed(2));
                    
                    // Securely read wallet balance and increment
                    const { data: wallet } = await supabaseAdmin
                        .from('wallets')
                        .select('*')
                        .eq('user_id', coupon.owner_id)
                        .single();
                    
                    if (wallet) {
                        const newBalance = parseFloat(wallet.balance) + rewardAmount;
                        await supabaseAdmin
                            .from('wallets')
                            .update({ balance: newBalance, updated_at: new Date().toISOString() })
                            .eq('id', wallet.id);
                        
                        await supabaseAdmin
                            .from('wallet_transactions')
                            .insert({
                                wallet_id: wallet.id,
                                reference_id: order.order_number,
                                type: 'credit',
                                amount: rewardAmount,
                                balance_after: newBalance,
                                description: `Reward for ${code} usage`,
                                status: 'completed'
                            });
                    }
                }
            }
        }

        // 5. Update Inventory and Sold Counts
        const { data: orderItems } = await supabaseAdmin
            .from('order_items')
            .select('variant_id, quantity')
            .eq('order_id', order.id);

        if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
                // Fetch current inventory for the variant
                const { data: inv } = await supabaseAdmin
                    .from('inventory')
                    .select('id, quantity_available')
                    .eq('variant_id', item.variant_id)
                    .single();
                
                if (inv) {
                    const newAvailable = Math.max(0, (inv.quantity_available || 0) - item.quantity);
                    await supabaseAdmin
                        .from('inventory')
                        .update({ 
                            quantity_available: newAvailable,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', inv.id);
                }
                
                // Update total_sold on product_variants
                const { data: variant } = await supabaseAdmin
                    .from('product_variants')
                    .select('id, total_sold, product_id')
                    .eq('id', item.variant_id)
                    .single();
                    
                if (variant) {
                    await supabaseAdmin
                        .from('product_variants')
                        .update({ total_sold: (variant.total_sold || 0) + item.quantity })
                        .eq('id', variant.id);
                        
                    // Update total_sold on products
                    const { data: product } = await supabaseAdmin
                        .from('products')
                        .select('id, total_sold')
                        .eq('id', variant.product_id)
                        .single();
                        
                    if (product) {
                         await supabaseAdmin
                            .from('products')
                            .update({ total_sold: (product.total_sold || 0) + item.quantity })
                            .eq('id', product.id);
                    }
                }
            }
        }

        // 6. Empty the user's cart securely
        const { data: cart } = await supabaseAdmin
            .from('carts')
            .select('id')
            .eq('user_id', order.user_id)
            .single();
            
        if (cart) {
            await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);
        }

        // 6. Return success
        return NextResponse.json({ success: true, message: 'Payment verified and order processed' });

    } catch (error: any) {
        console.error("Signature Verification Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
