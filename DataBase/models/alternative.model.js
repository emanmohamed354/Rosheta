import mongoose from "mongoose";

const altSchema=new mongoose.Schema({
    name: String,
    price: Number,
    category:String,
    description: String,
    image: { type: String, required: false }, // New property for image
} , {
    timestamps:true
})
export const altModel=mongoose.model('alternative',altSchema)