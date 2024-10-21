import { altModel } from './../../../DataBase/models/alternative.model.js';
import cloudinary from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dtys17buk',
  api_key: '522972777745776',
  api_secret: 'EJoZe64SGL5cTJ0tKEOoLnFKW7I',
});

// Add Alternative Controller
export const addAlternative = async (req, res) => {
    const { name, price, category, description } = req.body;
    const imageFile = req.file; // The uploaded file

    try {
        if (!imageFile) {
            return res.status(400).json({ msg: "Image is required" });
        }

        // Upload the image to Cloudinary
        const cloudinaryResponse = await cloudinary.v2.uploader.upload_stream(
            { resource_type: 'image' },
            async (error, result) => {
                if (error) {
                    return res.status(500).json({ msg: 'Cloudinary upload error', error: error.message });
                }

                const imageUrl = result.secure_url; // Get the URL of the uploaded image

                const isAlternative = await altModel.findOne({ name });
                if (isAlternative) {
                    return res.status(400).json({ msg: "Alternative medicine already added" });
                } else {
                    await altModel.create({ name, price, category, description, image: imageUrl });
                    return res.status(201).json({ msg: "Alternative medicine added successfully" });
                }
            }
        ).end(imageFile.buffer); // Send the image buffer
    } catch (error) {
        return res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Delete Alternative Controller
export const deleteAlternative = async (req, res) => {
    try {
        const { _id } = req.body;
        const deletedAlternative = await altModel.findById(_id);
        if (deletedAlternative) {
            await altModel.findByIdAndDelete(_id);
            return res.status(200).json({ message: "Deleted successfully" });
        } else {
            return res.status(404).json({ message: "Alternative medicine not found" });
        }
    } catch (error) {
        return res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Get All Alternatives Controller
export const getAllAlternatives = async (req, res) => {
    try {
        const allAlternatives = await altModel.find();
        return res.json({ message: "success", allAlternatives });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Alternative Controller
export const updateAlternative = async (req, res) => {
    const { _id, name, price, category, description, image } = req.body; 
    try {
        const alternative = await altModel.findById(_id);
        if (!alternative) {
            return res.status(404).json({ msg: 'Alternative medicine not found' });
        }

        const updatedAlternative = await altModel.findByIdAndUpdate(
            _id,
            { name, price, category, description, image },
            { new: true }
        );

        return res.status(200).json({
            msg: 'Alternative medicine updated successfully',
            alternative: updatedAlternative,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server error');
    }
};
