import { userModel } from "../../../DataBase/models/user.model.js";
import { catchError } from "../../utiles/catchError.js";
import jwt from 'jsonwebtoken';

const extractUserIdFromToken = (req) => {
    const token = req.headers.token;
    if (!token) throw new Error('Token missing');
    const decoded = jwt.verify(token, 'ahmedrafat123');
    return decoded.userId;
};

export const addToWishlist = catchError(async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const { productId } = req.body;
        let result = await userModel.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } }, { new: true });

        if (result) {
            res.status(200).json({ msg: "Product added to wishlist successfully", result: result.wishlist });
        } else {
            res.status(404).json({ msg: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
});

export const removeFromWishlist = catchError(async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        const { productId } = req.body;
        let result = await userModel.findByIdAndUpdate(userId, { $pull: { wishlist: productId } }, { new: true });

        if (result) {
            res.status(200).json({ msg: "Product removed from wishlist successfully", result: result.wishlist });
        } else {
            res.status(404).json({ msg: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
});

export const clearWishlist = catchError(async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        let result = await userModel.findByIdAndUpdate(userId, { $set: { wishlist: [] } }, { new: true });

        if (result) {
            res.status(200).json({ msg: "Wishlist cleared successfully", result: result.wishlist });
        } else {
            res.status(404).json({ msg: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
});

export const getAllWishlist = catchError(async (req, res) => {
    try {
        const userId = extractUserIdFromToken(req);
        let result = await userModel.findOne({ _id: userId }).populate('wishlist');

        if (result) {
            res.status(200).json({ msg: "Wishlist retrieved successfully", result: result.wishlist });
        } else {
            res.status(404).json({ msg: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ msg: "Internal server error", error: error.message });
    }
});
