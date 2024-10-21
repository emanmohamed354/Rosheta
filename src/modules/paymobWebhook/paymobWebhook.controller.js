import { orderModel } from "../../../DataBase/models/order.model.js";
import { productModel } from "../../../DataBase/models/product.model.js"; // Import your product model

export const handlePaymobWebhook = async (req, res) => {
    // Access query parameters
    const data = req.query;

    console.log('Incoming Webhook Request:', data); // Log the entire request for debugging

    // Access the Paymob order ID from query parameters
    const paymobOrderId = data.order;
    console.log("The order is: " + paymobOrderId);

    // Check if Paymob order ID is provided
    if (!paymobOrderId) {
        return res.status(400).json({ error: 'Paymob order ID is missing' });
    }
    try {
        // Lookup the order by Paymob order ID
        const order = await orderModel.findOne({ paymobOrderId }); // Ensure you store paymobOrderId correctly during order creation

        if (!order) {
            console.error(`Order not found for Paymob order ID: ${paymobOrderId}`);
            return res.status(404).json({ error: 'Order not found for Paymob order ID' });
        }

        // Check the success parameter in the webhook payload
        if (data.success === 'true') { // Check as a string since query params are strings
            order.status = 'completed'; // Update status to completed
            console.log(`Payment successful for order ID: ${order._id}`);

            // Deduct the quantities of products ordered
            for (const item of order.items) { // Iterate over the items in the order
                const productData = await productModel.findById(item.productId); // Lookup the product by ID

                if (productData) {
                    // Deduct quantity
                    productData.quantity -= item.quantity; // Assuming `quantity` is a field in your product model
                    if (productData.quantity < 0) {
                        productData.quantity = 0; // Prevent negative quantities
                    }

                    await productData.save(); // Save updated product quantity
                } else {
                    console.error(`Product not found for ID: ${item.productId}`);
                }
            }
        } else {
            order.status = 'failed'; // Update status to failed
            console.log(`Payment failed for order ID: ${order._id} ${JSON.stringify(data)}`);
        }

        await order.save(); // Save updated order status

        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing webhook:', error); // Enhanced error logging
        return res.status(500).json({ error: 'Internal server error' });
    }
};
