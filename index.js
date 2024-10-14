
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

dotenv.config();
const app = express()
DbConnection()
const port = 3000
app.use(cors());
app.use(express.json());
app.use(cors())
app.use(express.json())
app.use('/users',userRouter)
app.use('/products',productRouter)
app.use('/carts',cartRouter)
app.use('/wishlist',wishlistRouter)
app.get('/payment', (req, res) => res.send('Hello World!'));
app.use('/payment', paymentRouter);
app.use('/orders',orderRouter)

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
