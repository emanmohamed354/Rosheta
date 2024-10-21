import { cartModel } from "../../../DataBase/models/cart.model.js";
import { orderModel } from "../../../DataBase/models/order.model.js";
import { productModel } from "../../../DataBase/models/product.model.js";
import { catchError } from "../../utiles/catchError.js";
import { userModel } from '../../../DataBase/models/user.model.js';
import jwt from 'jsonwebtoken';
import axios from "axios";
// Middleware or utility function to extract `userId` from the `token` header
const extractUserIdFromToken = (req) => {
    const token = req.headers.token; // Extract token from `token` header
    if (!token) throw new Error('Token missing');
    
    const decoded = jwt.verify(token, 'ahmedrafat123'); // Replace with your actual secret
    return decoded.userId; // Assuming the token contains `userId`
};

export const addProductToCart = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); // Extract `userId` from the token
    const { productId } = req.body; // Only `productId` is being sent in the body

    if (!productId) {
        return res.status(400).json({ msg: "Product ID is required" });
    }

    // Find the product to get its price
    const product = await productModel.findById(productId);
    if (!product) {
        return res.status(404).json({ msg: "Product not found" });
    }

    // Find or create a cart for the user
    let cart = await cartModel.findOne({ userId: userId });

    if (!cart) {
        // Create a new cart if it doesn't exist
        cart = new cartModel({
            userId: userId,
            items: [{ productId, quantity: 1, price: product.price }],
            totalQuantity: 1,
            totalPrice: product.price
        });
        await cart.save();
        return res.json({ msg: "Product added to cart", result: cart });
    }

    // Check if the product is already in the cart
    const item = cart.items.find((item) => item.productId.toString() === productId.toString());

    if (item) {
        // If product exists, increment its quantity and update price
        item.quantity += 1;
        item.price = product.price; // Update price if needed
    } else {
        // Add new product to the cart
        cart.items.push({ productId, quantity: 1, price: product.price });
    }

    // Update total quantity and total price
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Save the updated cart
    await cart.save();
    res.json({ msg: "Product added/updated in cart", cart });
});



export const updateProductQuantityInCart = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); // Extract `userId` from the token
    const { productId, quantity } = req.body; // Extract `productId` and `quantity` from the request body

    if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ msg: "Product ID and valid quantity are required" });
    }

    // Find the user's cart
    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
        return res.status(404).json({ msg: "Cart not found" });
    }

    // Find the product in the cart
    const item = cart.items.find((item) => item.productId.toString() === productId.toString());
    if (!item) {
        return res.status(404).json({ msg: "Product not found in cart" });
    }

    // Update the quantity of the product in the cart
    item.quantity = quantity;

    // Update total quantity and total price
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Save the updated cart
    await cart.save();
    res.json({ msg: "Product quantity updated", cart });
});


export const removeProductFromCart = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); // Extract userId from the token
    const { productId } = req.params; // Get productId from URL parameters

    if (!productId) {
        return res.status(400).json({ msg: "Product ID is required" });
    }

    // Find the user's cart
    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
        return res.status(404).json({ msg: "Cart not found" });
    }

    // Check if the product exists in the cart
    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId.toString());
    
    if (itemIndex === -1) {
        return res.status(404).json({ msg: "Product not found in cart" });
    }

    // Remove the product from the cart
    cart.items.splice(itemIndex, 1);

    // Update total quantity and total price
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Save the updated cart
    await cart.save();
    
    res.json({ msg: "Product removed from cart", cart });
});

export const getCartForUser = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); 
    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
        return res.status(404).json({ msg: "Cart not found" });
    } else if (cart.totalPrice === 0) {
        return res.json({ msg: "cart is empty", cart });
    }
    return res.json({ msg: "Cart retrieved successfully", cart });
    
});

export const clearCart = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); 

    let cart = await cartModel.findOne({ userId: userId });

    if (!cart) {
        return res.status(404).json({ msg: "Cart not found for this user" });
    }

    cart.items = [];
    cart.totalQuantity = 0;
    cart.totalPrice = 0;

    await cart.save();

    res.json({ msg: "Cart cleared successfully", cart });
});


export const processCashPayment = async (req, res) => {
    const { userId, items } = req.body;

    // Validate required fields
    if (!userId || !items) {
        return res.status(400).json({ error: 'Missing required fields: userId and items are required.' });
    }

    try {
        // Step 1: Validate user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        let totalPrice = 0;
        const availableItems = [];

        // Step 2: Validate item availability and calculate total price
        for (const item of items) {
            const product = await productModel.findById(item.productId);
            if (!product) {
                return res.status(404).json({ error: `Product ID "${item.productId}" not found.` });
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({ error: `Insufficient quantity for product ID "${item.productId}". Available: ${product.quantity}, Requested: ${item.quantity}.` });
            }

            totalPrice += product.price * item.quantity;
            availableItems.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price,
            });

        }

        // Step 3: Create the cash payment order
        const newOrder = new orderModel({
            userId: user._id,
            items: availableItems,
            totalPrice,
            paymentMethod: 'cash',
            status: 'pending', // Initial status
        });

        await newOrder.save();

        // Step 4: Clear the user's cart after successful payment
        const cart = await cartModel.findOne({ userId });
        if (cart) {
            cart.items = [];
            cart.totalQuantity = 0;
            cart.totalPrice = 0;
            await cart.save();
        }

        // Step 5: Send successful response
        res.status(200).json({
            success: true,
            message: 'Cash payment processed successfully.',
            orderId: newOrder._id,
            totalPrice,
            paymentMethod: 'Cash',
            items: availableItems,
            user: { userId: user._id, email: user.email, firstName: user.userName },
        });

    } catch (error) {
        console.error('Error in processing cash payment:', error);
        res.status(500).json({ error: 'Cash payment failed', details: error.message });
    }
};



const PAYMOB_API_KEY = 'ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2T1RrM05qZzJMQ0p1WVcxbElqb2lhVzVwZEdsaGJDSjkuWGJNSEktY05PV0x1YkZadnlLaGdQSGxFTTNVY0ZnY0p3aE9fUHFqU1VwRnlPVmVFMnhVTXQ3TGEycFpRenIyRG5TVU1HUTdUS2FFMmZ4YldYeTVRbFE=';
const INTEGRATION_ID = 'your_integration_id_here';
const IFRAME_ID = 'your_iframe_id_here';

// Process Visa Payment
export const processVisaPayment = async (req, res) => {
    const { amount, currency } = req.body; // Get payment details from request body

    try {
        // Step 1: Authenticate to get token
        const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
            api_key: PAYMOB_API_KEY
        });
        const token = authResponse.data.token;

        // Step 2: Create an order
        const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
            auth_token: token,
            delivery_needed: false,
            amount_cents: amount, // Paymob expects amount in cents
            currency,
            items: [],
        });
        const orderId = orderResponse.data.id;

        // Step 3: Generate payment key
        const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
            auth_token: token,
            amount_cents: amount,
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                apartment: "NA",
                email: "user@example.com",
                floor: "NA",
                first_name: "John",
                last_name: "Doe",
                phone_number: "+201000000000",
                city: "Cairo",
                country: "EG",
                street: "NA",
                postal_code: "NA"
            },
            currency,
            integration_id: INTEGRATION_ID,
        });
        const paymentToken = paymentKeyResponse.data.token;

        // Step 4: Prepare the Visa payment URL
        const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentToken}`;

        // Send response with the payment URL for the client to redirect to
        res.json({ msg: 'Payment initiated, please complete in the iframe', paymentUrl });

    } catch (error) {
        // Handle error in the process
        res.status(500).json({ msg: 'Payment failed', error: error.message });
    }
};
