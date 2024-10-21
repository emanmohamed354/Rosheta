import express from 'express';
import { addProduct, deleteProduct, getAllProducts, updateProduct } from './product.controller.js';
import { getProductCountByCategory } from './product.controller.js';
import multer from 'multer';

const upload = multer(); 
export const productRouter = express.Router();

productRouter.post('/addProduct', upload.single('image'), addProduct); 
productRouter.delete('/deleteProduct', deleteProduct);
productRouter.get('/getAllProducts', getAllProducts);
productRouter.put('/updateProduct', updateProduct); 
productRouter.use('/category', getProductCountByCategory); 

export default productRouter;
