import express from "express"
import { addProductToCart, clearCart, getCartForUser, processCashPayment, removeProductFromCart, updateProductQuantityInCart } from "./cart.controller.js"

export let cartRouter=express.Router()

cartRouter.get('/getCartForUser', getCartForUser);
cartRouter.post('/addProductToCart',addProductToCart)
cartRouter.put('/updateProductQuantityInCart',updateProductQuantityInCart)
cartRouter.delete('/removeProductFromCart/:productId',removeProductFromCart)
cartRouter.delete('/clearCart',clearCart)
cartRouter.post('/payment/cash', processCashPayment);

