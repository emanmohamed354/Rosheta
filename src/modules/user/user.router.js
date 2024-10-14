import express from 'express';
import { changeMyPassword, signIn, signUp, updateUserData, forgetPassword, resetPassword } from './user.controller.js';

import { getUsers } from './user.controller.js';


// Route to get all users

const userRouter=express.Router()
// school/si
userRouter.post('/signUp',signUp)
userRouter.post('/signIn',signIn)
userRouter.post('/changeMyPassword',changeMyPassword)
userRouter.get('/show', getUsers);
// userRouter.post('/updatePassword',updatePassword)
userRouter.put('/updateUserData',updateUserData)
userRouter.post('/forget-password', forgetPassword);
userRouter.post('/reset-password', resetPassword);


export default userRouter