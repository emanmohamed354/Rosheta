import express from 'express';
import { getOrders,getOrderDetails,updateOrderStatus} from "./order.controller.js";

export const orderRouter = express.Router();

orderRouter.get('/getOrders', getOrders); 
orderRouter.get('/:orderId', getOrderDetails);
orderRouter.put('/:orderId/updateStatus', updateOrderStatus);
export default orderRouter;
