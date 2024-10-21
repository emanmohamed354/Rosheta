import express from 'express';
import { authenticatePaymob,createPayment,completePayment } from './payment.controller.js';

const router = express.Router();

router.post('/authenticate', authenticatePaymob);
router.post('/create-payment', createPayment);
router.post('/complete-payment', completePayment);
export default router;
