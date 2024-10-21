import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
            quantity: { type: Number, required: true }
        }
    ],
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'Credit Card', 'PayPal'],
        default: "cash"
    },
    paymobOrderId:{type: String},
    paymentToken: { type: String }
    ,
    status: {
        type: String,
        enum: ['pending', 'completed', 'canceled', 'failed'], 
        default: 'pending' 
    }
    
}, { timestamps: true });
//256514954
export const orderModel = mongoose.model('Order', orderSchema);

