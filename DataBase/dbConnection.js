import mongoose from "mongoose"
export const DbConnection=()=>{
    mongoose.connect('mongodb+srv://ahmedrafat12:ahmedrafat12345@cluster0.mnfstos.mongodb.net/Pharmacy').then(()=>{
        console.log(' dataBase Connected111')
    }).catch((error)=>{
        console.log('error in dataBase');     
    })
}