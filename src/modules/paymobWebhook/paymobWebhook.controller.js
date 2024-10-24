import { orderModel } from "../../../DataBase/models/order.model.js";
import { productModel } from "../../../DataBase/models/product.model.js"; 

export const handlePaymobWebhook = async (req, res) => {
    try {
        const data = req.query;
        const paymobOrderId = data.order;

        if (!paymobOrderId) {
            return res.status(400).json({ error: 'Paymob order ID is missing' });
        }

        // Timeout for finding order to avoid hanging indefinitely
        const order = await orderModel.findOne({ paymobOrderId }).maxTimeMS(2000);
        if (!order) {
            return res.status(404).json({ error: 'Order not found for Paymob order ID' });
        }

        if (data.success === 'true') {
            order.status = 'completed';

            // Collect product IDs
            const productIds = order.items.map(item => item.productId);
            
            // Fetch products with a timeout
            const products = await productModel.find({ _id: { $in: productIds } }).maxTimeMS(3000);

            if (!products || products.length === 0) {
                return res.status(404).json({ error: 'Products not found for given IDs' });
            }

            // Process product updates
            const productUpdates = products.map(product => {
                const orderedItem = order.items.find(item => item.productId.toString() === product._id.toString());
                if (orderedItem) {
                    product.quantity = Math.max(0, product.quantity - orderedItem.quantity);
                    return product.save(); // Save in parallel
                }
            });

            await Promise.all(productUpdates); // Ensure parallel saving
        } else {
            order.status = 'failed';
        }

        await order.save(); // Save the updated order status

        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing webhook:', error);

        // Return an error response based on the error type
        if (error.name === 'MongoError') {
            return res.status(500).json({ error: 'Database error while processing webhook' });
        }

        return res.status(500).json({ error: 'Internal server error' });
    }
};
