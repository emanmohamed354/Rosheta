import express from 'express';
import {
    addAlternative,
    deleteAlternative,
    getAllAlternatives,
    updateAlternative
} from './alt.controller.js'; 
import multer from 'multer';

const upload = multer(); // Use memory storage for direct upload
export const altRouter = express.Router();

// Use the upload middleware for your routes
altRouter.post('/addAlternative', upload.single('image'), addAlternative); 
altRouter.delete('/deleteAlternative', deleteAlternative); 
altRouter.get('/getAllAlternatives', getAllAlternatives); 
altRouter.put('/updateAlternative', upload.single('image'), updateAlternative); // Adjust this for image uploads as well

export default altRouter;
