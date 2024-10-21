
import { DbConnection } from './DataBase/dbConnection.js'
import userRouter from './src/modules/user/user.router.js'
import { productRouter } from './src/modules/product/product.router.js'
import { cartRouter } from './src/modules/cart/cart.router.js'
import { wishlistRouter } from './src/modules/wishlist/wishlist.router.js'
import {orderRouter} from './src/modules/order/order.router.js'
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import paymentRouter from './src/modules/payment/payment.router.js';
import { PaymobWebhookRouter } from './src/modules/paymobWebhook/paymobWebhook.router.js'
import altRouter from './src/modules/alt/alt.router.js';

dotenv.config();
const app = express()
DbConnection()

const port = 3000
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
    next();
});
app.use('/users',userRouter)
app.use('/products',productRouter)
app.use('/carts',cartRouter)
app.use('/wishlist',wishlistRouter)
app.use('/payment', paymentRouter);
app.use('/orders',orderRouter)
app.use('/pay',PaymobWebhookRouter)
app.use('/alternatives', altRouter);  

app.get('/', (req, res) => {
    res.send('Welcome to the API');
});

// Error handling middleware (optional)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// {
//     "userId": "66f851ed780f05324fe2e752",  // replace with a valid ObjectId
//     "amount": 100.00, {
//     "email": "eman23121@gmail.com",
//     "password": "NewSecurePassword123"
// }

//     "items": [
//         {
//             "productId": "PRODUCT_ID_HERE",  // Optional
//             "quantity": 1,
//             "price": 100.00
//         }
//     ],
//     "paymentMethod": "credit-card"
// }
