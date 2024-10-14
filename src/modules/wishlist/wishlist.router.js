import express from "express"
import { addToWishlist, clearWishlist, getAllWishlist, removeFromWishlist } from "./wishlist.controller.js"

export let wishlistRouter=express.Router()

wishlistRouter.patch('/addToWishlist',addToWishlist)
wishlistRouter.delete('/removeFromWishlist',removeFromWishlist)
wishlistRouter.delete('/clearWishlist',clearWishlist)
wishlistRouter.get('/getAllWishlist',getAllWishlist)