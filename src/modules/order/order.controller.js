import { orderModel } from "../../../DataBase/models/order.model.js";
 import { productModel } from "../../../DataBase/models/product.model.js";
export const getOrders = async (req, res) => {
    const { userId } = req.query; 

    try {
        if (userId) {
            const orders = await orderModel.find({ userId }).populate('userId', 'userName email'); 
            return res.status(200).json({
                success: true,
                message: `Orders for user : ${userId}`,
                orders,
            });
        }

        const allOrders = await orderModel.find().populate('userId', 'userName email'); 
        res.status(200).json({
            success: true,
            message: 'All orders retrieved successfully',
            orders: allOrders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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

export const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        if (!['pending', 'completed', 'canceled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (status === 'completed') {
            let isAvailable = true;
            for (const item of order.items) {
                const product = await productModel.findOne({ name: item.productName });
                if (!product || product.quantity < item.quantity) {
                    isAvailable = false;
                    break;
                }
            }

            if (!isAvailable) {
                await orderModel.findByIdAndUpdate(orderId, { status: 'canceled' }, { new: true });
                return res.status(400).json({ success: false, message: 'Order canceled due to insufficient product quantity.' });
            }

            for (const item of order.items) {
                const product = await productModel.findOne({ name: item.productName });
                if (product) {
                    product.quantity -= item.quantity;
                    await product.save();
                }
            }
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

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
