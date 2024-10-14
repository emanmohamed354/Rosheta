import express from 'express';
import { authenticatePaymob,createPayment,completePayment } from './payment.controller.js';

const router = express.Router();

router.post('/authenticate', authenticatePaymob);
router.post('/create-payment', createPayment);
router.post('/complete-payment/:orderId', completePayment);
router.get('/status/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const response = await axios.get(`https://paymob.com/api/payment/status/${orderId}`, {
            headers: {
                'Authorization': `Bearer YOUR_ACCESS_TOKEN` // Use your actual token securely
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ message: 'Unable to fetch payment details' });
    }
});
export default router;
