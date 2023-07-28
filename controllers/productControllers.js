const categoryModel=require("../models/categoryModel")
const productModel = require("../models/productModel")
const  Order =require("../models/orderModel")

const getAddproduct=async (req,res)=>{

    try
    {
        const categories=await categoryModel.find().lean()
        res.render("admin/addproducts",{categories,errorMessageproduct: req.flash("error")})

    }
    catch(error)
    {
        console.log(error.message)
    }
    
}

// post product
const postProduct = async (req, res) => {
  try {
    const { productname, brand, price,offer_price, description, quantity, category } = req.body;
    const images = req.files.map((file) => file.filename);

    const existingProduct = await productModel.findOne({
      productname: { $regex: productname, $options: "i" },
    });

    if (existingProduct) {
      req.flash("error", "Product already exists");
      res.redirect("/admin/addproducts");
    } else {
      // Validate price and quantity
      const priceRegex = /^\d+(\.\d{1,2})?$/; // Regular expression to match a positive decimal number with up to 2 decimal places
      const quantityRegex = /^[1-9]\d*$/; // Regular expression to match a positive integer
      const offer_priceRegex=/^\d+(\.\d{1,2})?$/;

      if (!priceRegex.test(price) || !quantityRegex.test(quantity) || !offer_priceRegex.test(offer_price)) {
        req.flash("error", "Invalid price or quantity format");
        res.redirect("/admin/addproducts");
        return;
      }

      // Convert price and quantity to numbers
      const parsedPrice = parseFloat(price);
      const parsedQuantity = parseInt(quantity);
      const parseOfferPrice=parseFloat(offer_price)

      const product = new productModel({
        productname,
        brand,
        price: parsedPrice,
        description,
        offer_price: parseOfferPrice,
        quantity: parsedQuantity,
        category,
        image: images,
      });

      const saveproduct = await product.save();

      if (saveproduct) {
        req.flash("success", "Product added successfully");
        res.redirect("/admin/products");
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Server error" });
  }
};
//  list unlist product
const unlistporduct= async (req,res)=>{
    let id=req.params.id
    console.log(id)
    try{
      let product= await productModel.findById(id)
      console.log(product)
    
      product.deleted=!product.deleted;
      await product.save()
      res.redirect("/admin/products")
    }catch(err){
      console.log(err)
    }
  }

//   get edit product page
const editProducts=async(req,res)=>{

    try{

        const categories=await categoryModel.find().lean()
        const productId=req.query.id;
        const product=await productModel.findOne({_id:productId}).populate("category").lean()
        if(product)
        {
            res.render("admin/editproducts",{user:product,categories})
        }
        else{
            res.redirect("/editproducts")
        }
    }
    catch(errror)
    {
        console.log(error.message)
    }
}
const removeImage=async(req,res)=>{

    try{
        console.log(req.body)
        const productId=req.body.id;
        const position=req.body.position;
        const product=await productModel.findById(productId)
        const image=product.image[position]

        await productModel.updateOne(
           { _id:productId},
           {$pull:{image:image}}

        ).then((resoponse)=>{
            console.log("response from database",resoponse)
        })
        res.json({remove:true})
    }
    catch(error)
    {
        res.render("admin/500")
        console.log(error)
    }
}

// post edit data

const editPostProduct = async (req, res) => {
    try {
      console.log("edit products", req.body);
      console.log(req.params.id);
      const productId = req.params.id;
      let images = [];
  
      if (req.files && req.files.length > 0) {
        const existingProduct = await productModel.findById(productId).lean();
        images = existingProduct.image.concat(
          req.files.map((file) => file.filename)
        );
      } else {
        const existingProduct = await productModel
          .findById(productId)
          .select("image")
          .lean();
        images = existingProduct.image;
      }
  
      await productModel.findByIdAndUpdate(productId, {
        $set: {
          productname: req.body.productname,
          brand: req.body.brand,
          price: req.body.price,
          offer_price:req.body.offer_price,
          description: req.body.description,
          quantity: req.body.quantity,
          category: req.body.category,
          image: images,
        },
      }).then((response) => {
        console.log("response from database", response);
      });
  
      res.redirect("/admin/products");
    } catch (error) {
      console.log(error.message);
    }
  };
  
//   singleproduct
// /all products




// In your productControllers.js or the relevant file
const getOrderedProducts = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    // Extract the products from the order and send them as a response
    const products = order.items.map(item => ({
      _id: item.product._id,
      productName: item.product.productname
    }));

    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Define the route for fetching ordered products

const postRating= async (req, res) => {
  try {
    const { orderId, productName, rating, comment } = req.body;

    console.log("for testing body",req.body)

    // Find the product by name
    const product = await productModel.findOne({ _id: productName });
    console.log("for testing",product)
    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    // Add the product review to the reviews array
    product.reviews.push({
      user: req.session.user, // Assuming you're using authentication and have access to the user's ID
      rating: parseInt(rating),
      comment: comment
    });

    // Save the updated product to the database
    await product.save();

    // Return a success response
    res.json({ success: true, message: 'Product review submitted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};




module.exports={
    removeImage,
    getAddproduct,
    postProduct,
    unlistporduct,
    editProducts,
  editPostProduct,
  getOrderedProducts,
  postRating

  
    
}
