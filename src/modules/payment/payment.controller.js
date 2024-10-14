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
    const { userId, items, paymentMethod } = req.body;

    // Validate required fields
    if (!userId || !items || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate API keys
    if (!process.env.PAYMOB_API_KEY || !process.env.PAYMOB_INTEGRATION_ID) {
        return res.status(500).json({ error: 'Missing configurations' });
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let totalPrice = 0;
        const availableItems = [];

        // Loop through items to check availability and calculate total price
        for (const item of items) {
            const product = await productModel.findById(item.productId); // Use productId from the request
            if (!product || product.quantity < item.quantity) {
                return res.status(400).json({ error: `Product with ID "${item.productId}" is unavailable or insufficient quantity.` });
            }

            totalPrice += product.price * item.quantity;

            availableItems.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price,
            });
        }

        // Proceed with Paymob authentication and order creation
        const authResponse = await axios.post('https://accept.paymobsolutions.com/api/auth/tokens', {
            api_key: process.env.PAYMOB_API_KEY,
        });
        const { token } = authResponse.data;

        const orderPayload = {
            auth_token: token,
            delivery_needed: 'false',
            amount_cents: totalPrice * 100,
            currency: 'EGP',
            items: availableItems.map(item => ({
                name: item.productId.toString(), // Use productId as name (or fetch the name if needed)
                quantity: item.quantity,
                amount_cents: item.price * 100,
            })),
        };

        const orderResponse = await axios.post('https://accept.paymobsolutions.com/api/ecommerce/orders', orderPayload);
        const orderId = orderResponse.data.id;

        const paymentKeyResponse = await axios.post('https://accept.paymobsolutions.com/api/acceptance/payment_keys', {
            auth_token: token,
            amount_cents: totalPrice * 100,
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                email: user.email,
                first_name: user.userName,
                last_name: user.lastName,
                phone_number: user.phone,
                street: user.address.street,
                building: user.address.building || 1,
                floor: user.address.floor || 1,
                apartment: user.address.apartment || 1,
                city: user.address.city,
                country: user.address.country,
                state: user.address.state,
            },
            currency: 'EGP',
            integration_id: process.env.PAYMOB_INTEGRATION_ID,
        });

        const { token: paymentToken } = paymentKeyResponse.data;

        // Save the order to the database
        const newOrder = new orderModel({
            userId: user._id,
            items: availableItems,
            totalPrice,
            paymentMethod,
            status: 'pending',
        });

        await newOrder.save();

        res.status(200).json({
            success: true,
            message: 'Payment initiated successfully.',
            paymentToken,
            orderId: newOrder._id,
            totalPrice,
            paymentMethod,
            items: availableItems,
            user: {
                userId: user._id,
                email: user.email,
                firstName: user.userName,
            },
        });

    } catch (error) {
        console.error('Error in creating payment:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Payment initiation failed', details: error.message });
    }
};



export const completePayment = async (req, res) => {
    const { orderId } = req.params; // Get the orderId from the URL
    const { paymentStatus, paymentDetails } = req.body; // Get payment details from the request body

    try {
        // Find the order by ID
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if payment was successful
        if (paymentStatus !== 'success') {
            return res.status(400).json({ success: false, message: 'Payment failed or not completed' });
        }

        // Check if there is enough product quantity available
        let isAvailable = true;
        for (const item of order.items) {
            // Find the product by its ID
            const product = await productModel.findById(item.productId); // Correctly use productId here
            if (!product || product.quantity < item.quantity) {
                isAvailable = false;
                console.log(`Checking product: ${product ? product.name : 'undefined'}, required: ${item.quantity}, available: ${product ? product.quantity : 'not found'}`);
                break;
            }
        }

        // If products are not available, cancel the order
        if (!isAvailable) {
            await orderModel.findByIdAndUpdate(orderId, { status: 'canceled' });
            return res.status(400).json({ success: false, message: 'Order canceled due to insufficient product quantity.' });
        }

        // Deduct the product quantities
        for (const item of order.items) {
            const product = await productModel.findById(item.productId); // Use productId to find the product
            if (product) {
                product.quantity -= item.quantity; // Deduct the quantity
                await product.save(); // Save the updated product
            }
        }

        // Update the order status to completed
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { status: 'completed', paymentDetails }, // Update order with new status and payment details
            { new: true } // Return the updated order
        );

        // Send response back to the client
        res.status(200).json({
            success: true,
            message: 'Payment completed and order status updated to completed.',
            order: updatedOrder,
            paymentDetails, // Include payment details in response
        });

    } catch (error) {
        console.error('Error in completing payment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

