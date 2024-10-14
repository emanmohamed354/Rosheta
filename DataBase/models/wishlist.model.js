import { mongoose } from 'mongoose';

const wishlistSchema = new mongoose.Schema({
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
}, {
    timestamps:true
});

export const wishlistModel = mongoose.model('wishlist', wishlistSchema);