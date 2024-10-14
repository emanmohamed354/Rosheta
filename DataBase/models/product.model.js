import mongoose from "mongoose";

const productSchema=new mongoose.Schema({
    name: String,
    price: Number,
    quantity: Number,
    category:String,
    bestSeller: { type: Boolean, default: false }, // Optional property
    offer: { type: Boolean, default: false }, // Optional property
    description: String,
    image: { type: String, required: false }, 
} , {
    timestamps:true
})
export const productModel=mongoose.model('product',productSchema)