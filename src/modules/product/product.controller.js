import { productModel } from "../../../DataBase/models/product.model.js";
import cloudinary from "cloudinary";

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dtys17buk',
  api_key: '522972777745776',
  api_secret: 'EJoZe64SGL5cTJ0tKEOoLnFKW7I',
});

export const addProduct = async (req, res) => {
    const { name, price, category, quantity, bestSeller, offer, description } = req.body;
    const imageFile = req.file; // Get the uploaded file
    try {
        const isProduct = await productModel.findOne({ name });
        if (isProduct) {
            return res.status(400).json({ msg: "Product already added" });
        }

        if (imageFile) {
            // Upload image to Cloudinary
            const result = await cloudinary.v2.uploader.upload_stream(
                { resource_type: 'image' },
                async (error, result) => {
                    if (error) return res.status(500).json({ message: error.message });

                    // Create the product with the image URL
                    await productModel.create({
                        name,
                        price,
                        category,
                        quantity,
                        bestSeller,
                        offer,
                        description,
                        image: result.secure_url, // Use the secure URL from Cloudinary
                    });

                    return res.status(201).json({ msg: "Product added successfully" });
                }
            ).end(imageFile.buffer); // Send the image buffer
        } else {
            return res.status(400).json({ msg: "Image is required" });
        }
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { _id } = req.body;
        const deletedProduct = await productModel.findById(_id);
        if (deletedProduct) {
            await productModel.findByIdAndDelete(_id);
            res.status(200).json({ message: "Deleted successfully" });
        } else {
            res.status(400).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const allProducts = await productModel.find();
        res.json({ message: "success", allProducts });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    const { _id, name, quantity, price, category, description, bestSeller, offer, image } = req.body;
    try {
        const product = await productModel.findById(_id);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        const updatedProduct = await productModel.findByIdAndUpdate(
            _id,
            { name, quantity, price, category, description, bestSeller, offer, image },
            { new: true }
        );

        res.status(200).json({
            msg: 'Product updated successfully',
            product: updatedProduct,
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};
export const getProductCountByCategory = async (req, res) => {
    const { category } = req.body; 
    if (!category) {
        return res.status(400).json({ success: false, message: 'Category is Miss.' });
    }
    try {
        const productCount = await productModel.countDocuments({ category });

        const products = await productModel.find({ category });

        res.status(200).json({
            success: true,
            message: `Products in category: ${category}`,
            productCount,
            products: products.map(product => ({
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                bestSeller: product.bestSeller,
                offer: product.offer,
                description: product.description,
                image: product.image
                productId:product._id
            })),
        });
    } catch (error) {
        console.error('Error fetching products', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
