import express from 'express';
import { handlePaymobWebhook } from './paymobWebhook.controller.js';

export let PaymobWebhookRouter = express.Router();

// Handle both GET and POST requests for the webhook
PaymobWebhookRouter.route('/paymob-webhook')
    .post(handlePaymobWebhook)
    .get(handlePaymobWebhook);
