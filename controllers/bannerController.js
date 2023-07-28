

const Banner = require("../models/bannerModel")
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');


// Set up Multer storage to define the destination and filename for the uploaded image


// POST request to add a new banner
// router.post('/addbanner', upload.single('banner'),
const postBanner = async (req, res) => {
    try {
        const { title, link, startDate, endDate } = req.body;
        const imageUrl = req.file.filename

        // Ensure that the title value is either 'MAIN' or 'NORMAL'
        if (!['MAIN', 'NORMAL'].includes(title)) {
            return res.status(400).json({ message: 'Invalid title value' });
        }

        const newBanner = new Banner({
            title,
            image: imageUrl,
            link,
            startDate,
            endDate,
        });

        // Save the new banner to the database
        const savedBanner = await newBanner.save();

       res.redirect("/admin/addBanner");
    } catch (error) {
        console.error('Error adding new banner:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};





const getBanner = async (req, res) => {
  try {
    // Fetch banners with title equal to "MAIN" from the database
    const banners = await Banner.find();

    res.render("admin/addBanner", { banners }); // Pass the banners data to the view
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const postEdit= async (req, res) => {
  try {
    const { title, link, startDate, endDate } = req.body;
    const imageUrl = req.file.filename

    const updatedBanner = {
      title,
      image: imageUrl,
      link,
      startDate,
      endDate,
    };

    // Find the banner by ID and update its data
    const updatedBannerData = await Banner.findByIdAndUpdate(req.params.id, updatedBanner, { new: true });

      res.redirect("/admin/addBanner");
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// DELETE THE BANNER

const deleteBanner = async (req, res) => {
    try {
        const bannerId = req.params.id;
        const deletedBanner = await Banner.findByIdAndDelete(bannerId);

        if (!deletedBanner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


module.exports = {
     
    getBanner,
    postBanner,
    postEdit,
    deleteBanner
 }