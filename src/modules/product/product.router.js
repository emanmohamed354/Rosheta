import express from 'express';
import { addProduct, deleteProduct, getAllProducts, updateProduct } from './product.controller.js';
import { getProductCountByCategory } from './product.controller.js';
import multer from 'multer';

const upload = multer(); // Use memory storage for direct upload
export const productRouter = express.Router();

productRouter.post('/addProduct', upload.single('image'), addProduct); // Adjusted to use multer
productRouter.delete('/deleteProduct', deleteProduct);
productRouter.get('/getAllProducts', getAllProducts);
productRouter.put('/updateProduct', updateProduct); // You may want to adjust this for image uploads too
productRouter.use('/category', getProductCountByCategory); 

export default productRouter;
