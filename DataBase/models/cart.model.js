import { mongoose } from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'user', required: true },
  items: [{
    productId: { 
      type: mongoose.Types.ObjectId, 
      ref: 'product',
      required: true
     },
    quantity: { type: Number, required: true, default: 1 },
    price:Number
  }],
  totalQuantity: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 }
}, {
    timestamps:true
});

export const cartModel = mongoose.model('Cart', cartSchema);