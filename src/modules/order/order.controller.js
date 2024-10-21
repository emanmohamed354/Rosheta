import { orderModel } from "../../../DataBase/models/order.model.js";
import { productModel } from "../../../DataBase/models/product.model.js";

export const getOrders = async (req, res) => {
    const { userId } = req.query;

    try {
        const query = userId ? { userId } : {};
        const orders = await orderModel.find(query).populate('userId', 'userName email');

        res.status(200).json({
            success: true,
            message: userId ? `Orders for user: ${userId}` : 'All orders retrieved successfully',
            orders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const getOrderDetails = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await orderModel.findById(orderId).populate('userId', 'userName email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({
            success: true,
            message: `Order details for order ID: ${orderId}`,
            order,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
export const getAllOrders = async (req, res) => {
        try {
            const orders = await orderModel.find();
            res.status(200).json({
                success: true,
                orders,
            });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
  };
  
  
  export const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        // Check for valid statuses
        if (!['pending', 'completed', 'canceled', 'failed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Find the order
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // If status is 'c' for complete
        if (status === 'completed') {
            // Check product availability
            const productChecks = await Promise.all(order.items.map(item =>
                productModel.findById(item.productId)
            ));

            // Check if all products are available
            const isAvailable = productChecks.every((product, index) => 
                product && product.quantity >= order.items[index].quantity
            );

            if (!isAvailable) {
                await orderModel.findByIdAndUpdate(orderId, { status: 'canceled' }, { new: true });
                return res.status(400).json({ success: false, message: 'Order canceled due to insufficient product quantity.' });
            }

            // Update product quantities
            await Promise.all(order.items.map(async (item) => {
                const product = await productModel.findById(item.productId);
                if (product) {
                    product.quantity -= item.quantity; // Deduct quantity
                    if (product.quantity < 0) product.quantity = 0; // Prevent negative quantities
                    await product.save(); // Save updated product quantity
                }
            }));
        }

        // Update order status
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

        // Respond with the updated order
        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

