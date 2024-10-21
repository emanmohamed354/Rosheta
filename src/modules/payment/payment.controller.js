import axios from 'axios';
import { userModel } from '../../../DataBase/models/user.model.js';
import { orderModel } from '../../../DataBase/models/order.model.js';
import { productModel } from '../../../DataBase/models/product.model.js';

// Function to authenticate with Paymob
export const authenticatePaymob = async (req, res) => {
    if (!process.env.PAYMOB_API_KEY) {
        return res.status(500).json({ success: false, error: 'Missing configuration' });
    }

    try {
        const authResponse = await axios.post('https://accept.paymobsolutions.com/api/auth/tokens', {
            api_key: process.env.PAYMOB_API_KEY,
        });
        const { token } = authResponse.data;
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('Error in Paymob authentication:', error.response ? error.response.data : error);
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
};

export const createPayment = async (req, res) => {
    console.log('Incoming Request:', req.body);

    const { userId, items, paymentMethod } = req.body;

    // Validate required fields
    if (!userId || !items || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required fields: userId, items, and paymentMethod are required.' });
    }

    const { PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID } = process.env;

    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID) {
        return res.status(500).json({ error: 'Missing Paymob configurations.' });
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        let totalPrice = 0;
        const shippingFee = 40; // Shipping fee in EGP
        const availableItems = [];

        // Validate item availability
        for (const item of items) {
            const product = await productModel.findById(item.productId);
            if (!product) {
                return res.status(404).json({ error: `Product ID "${item.productId}" not found.` });
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({ error: `Insufficient quantity for product ID "${item.productId}". Available: ${product.quantity}, Requested: ${item.quantity}.` });
            }
            totalPrice += product.price * item.quantity;
            availableItems.push({ productId: product._id, quantity: item.quantity, price: product.price });
        }

        // Add shipping fee to the total price
        totalPrice += shippingFee;

        // Authenticate with Paymob
        const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
            api_key: PAYMOB_API_KEY,
        });
        const { token } = authResponse.data;

        // Prepare items for Paymob, including shipping fee
        const shippingItem = {
            name: 'Shipping Fee',
            quantity: 1,
            amount_cents: shippingFee * 100,
        };

        const itemsForPaymob = availableItems.map(item => ({
            name: item.productId.toString(),
            quantity: item.quantity,
            amount_cents: item.price * 100,
        }));

        itemsForPaymob.push(shippingItem);

        // Recalculate total amount in cents
        const totalAmountCents = itemsForPaymob.reduce((sum, item) => sum + (item.amount_cents * item.quantity), 0);

        // Create order
        const orderPayload = {
            auth_token: token,
            delivery_needed: 'false',
            amount_cents: totalAmountCents,
            currency: 'EGP',
            items: itemsForPaymob,
        };

        console.log('Order Payload:', orderPayload);

        const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', orderPayload);
        const paymobOrderId = orderResponse.data.id; // Get Paymob order ID

        // Create payment key
        const paymentKeyPayload = {
            auth_token: token,
            amount_cents: totalAmountCents,
            expiration: 3600,
            order_id: paymobOrderId, // Use Paymob order ID
            billing_data: {
                email: user.email,
                first_name: user.userName,
                last_name: user.lastName || 'N/A',
                phone_number: user.phone || 'N/A',
                street: user.address?.street || 'N/A',
                building: user.address?.building || 'N/A',
                floor: user.address?.floor || 'N/A',
                apartment: user.address?.apartment || 'N/A',
                city: user.address?.city || 'N/A',
                country: user.address?.country || 'N/A',
                state: user.address?.state || 'N/A',
            },
            currency: 'EGP',
            integration_id: PAYMOB_INTEGRATION_ID,
        };

        console.log('Payment Key Payload:', paymentKeyPayload);

        const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', paymentKeyPayload);

        console.log('Payment Key Response:', paymentKeyResponse.data);

        const paymentToken = paymentKeyResponse.data.token;
        if (!paymentToken) {
            console.error('Payment Key Response Error:', paymentKeyResponse.data);
            return res.status(500).json({ error: 'Payment token is undefined', details: paymentKeyResponse.data });
        }

        // Save order
        const newOrder = new orderModel({
            userId: user._id,
            items: availableItems,
            totalPrice,
            paymentMethod,
            status: 'pending',
            paymentToken,
            paymobOrderId, // Store Paymob order ID
        });

        await newOrder.save();

        // Send successful response
        res.status(200).json({
            success: true,
            message: 'Payment initiated successfully.',
            paymentToken,
            orderId: newOrder._id, // Your internal order ID
            paymobOrderId, // Paymob order ID
            totalPrice,
            paymentMethod,
            items: availableItems,
            user: { userId: user._id, email: user.email, firstName: user.userName },
        });

    } catch (error) {
        console.error('Error in creating payment:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Payment initiation failed', details: error.message });
    }
};

export const completePayment = async (req, res) => {
    const { orderId } = req.body; // Your internal order ID

    try {
        // Find the order by orderId
        const order = await orderModel.findById(orderId).select('paymentToken');

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const paymentToken = order.paymentToken;
        console.log('Retrieved payment token:', paymentToken);

        // Here you would typically verify the payment status with Paymob
        // For simplicity, let's assume the payment is completed successfully

        // Update the order status
        order.status = 'completed';
        await order.save();

        res.status(200).json({ success: true, message: 'Payment completed successfully', details: 'Order status updated to completed' });
    } catch (error) {
        console.error('Error in completing payment:', error);
        res.status(500).json({ success: false, error: 'Payment completion failed', details: error.message });
    }
};

export const handlePaymobWebhook = async (req, res) => {
    const data = req.body;

    console.log('Incoming Request:', data); // Log the entire request for debugging

    const paymobOrderId = data.order; // Paymob order ID

    try {
        // Lookup the order by Paymob order ID
        const order = await orderModel.findOne({ paymobOrderId }); // Use paymobOrderId to find order

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order status based on payment success
        if (data.success === true) {
            order.status = 'completed'; // Update status to completed
        } else {
            order.status = 'failed'; // Update status to failed
        }

        await order.save();
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing webhook:', error); // Enhanced error logging
        return res.status(500).json({ error: 'Internal server error' });
    }
};
