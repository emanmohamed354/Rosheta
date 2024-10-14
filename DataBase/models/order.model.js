import mongoose from "mongoose";


const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, required: true }
        }
    ],
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Credit Card', 'PayPal'], // Example enum values
        required: true
    }
    ,
    status: {
        type: String,
        enum: ['pending', 'completed', 'canceled'], // Enum values
        default: 'pending' // Default value
    }
}, { timestamps: true });

export const orderModel = mongoose.model('Order', orderSchema);

