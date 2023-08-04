const productcollection = require("../models/productModel");
const categorycollections = require("../models/categoryModel");
const User = require("../models/usermodel");
const fs = require('fs');
const path = require('path'); // Add this line
const PDFDocument = require('pdfkit');
const Order = require('../models/orderModel')


const calculateOfferPrice = (product) => {
  if (product.category && product.category.offer && product.category.offer.percentage >= 1) {
    const offerPercentage = product.category.offer.percentage;
    return product.price - (product.price * (offerPercentage / 100));
  } else {
    return product.offer_price;
  }
};

const addtocart = async (req, res) => {
  try {
    const product = await productcollection.findById(req.params.id).populate('category');

    if (req.session.login) {
      const userId = req.session.user;
      const user = await User.findById(userId);

      const existingCartItem = user.cart.find(
        (item) => item.product.toString() === product._id.toString()
      );

      // Calculate the offer price for the product
      product.offer_price = calculateOfferPrice(product);
   

      if (existingCartItem) {
        // If the product already exists in the cart, update the quantity
        const requestedQuantity = parseInt(req.body[`quantity_${product._id}`]);
        const newQuantity = existingCartItem.quantity + requestedQuantity;

        // Check if the new quantity exceeds the available quantity
        if (newQuantity > product.quantity) {
          throw new Error("Insufficient stock");
        }

        existingCartItem.quantity = newQuantity;
      } else {
        // If the product doesn't exist in the cart, add a new cart item

        // Check if the item quantity is zero in the database
        if (product.quantity === 0) {
          throw new Error("Item is out of stock");
        }

        const requestedQuantity = parseInt(req.body[`quantity_${product._id}`]);

        // Check if the requested quantity exceeds the available quantity
        if (requestedQuantity > product.quantity) {
          throw new Error("Insufficient stock");
        }

        const cartData = {
          product: product._id,
          quantity: requestedQuantity,
        };
        user.cart.push(cartData);
      }

      await user.save();

      res.redirect("/cart");
    } else {
      // User is not logged in
      res.redirect("/login"); // Redirect the user to the login page or any other appropriate action
    }
  } catch (error) {
    console.log(error);
    if (error.message === "Item is out of stock") {
      res.redirect("/cart?error=out-of-stock");
    } else if (error.message === "Insufficient stock") {
      res.redirect("/cart?error=insufficient-stock");
    } else {
      res.status(500).send("Error adding product to cart");
    }
  }
};

  
  

const getCart = async (req, res) => {
  try {
    const categories = await categorycollections.find({ deleted: false });
    const products = await productcollection.find({ deleted: false });

    const userId = req.session.user;
    const user = await User.findById(userId).populate({
      path: 'cart.product',
      populate: {
        path: 'category',
        model: 'Category',
      },
    });

    if (user) {
      const cartItems = user.cart.map((item) => {
        const product = item.product;
        const quantity = item.quantity;
        const offer_price = calculateOfferPrice(product);

          console.log("this checking for offer priceeeee",offer_price)
        // Calculate the offer price
        return { product, quantity, offer_price };
      });

      res.render('user/cart', {
        user: req.session.name,
        categories,
        products,
        cartItems,
      });
    } else {
      res.render('user/login', {});
    }
  } catch (error) {
    console.log(error.message);
  }
};


  const updateCartItemQuantity = async (req, res) => {
    try {
      const productId = req.body.product;
      const quantity = parseInt(req.body.quantity);
  
      if (isNaN(quantity)) {
        throw new Error('Invalid quantity value');
      }
  
      if (req.session.login) {
        const userId = req.session.user;
        const user = await User.findById(userId);
  
        const cartItem = user.cart.find(item => item.product.toString() === productId);
        if (cartItem) {
          cartItem.quantity = quantity;
          await user.save();
          const product = await productcollection.findById(productId);
          res.json({ price: product.offer_price });
        } else {
          throw new Error('Cart item not found');
        }
      } else {
        const cartItems = req.session.cartItems || [];
        const cartItem = cartItems.find(item => item.product.toString() === productId);
        if (cartItem) {
          cartItem.quantity = quantity;
          req.session.cartItems = cartItems;
          const product = await productcollection.findById(productId);
          res.json({ price: product.offer_price });
        } else {
          throw new Error('Cart item not found');
        }
      }
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  };
  const removeCartItem = async (req, res) => {
    
    const userId = req.session.user;
    const productId = req.params.id;
  
    try {
      const user = await User.findById(userId).populate("cart.product");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Find the index of the cart item with the matching product ID
      const cartItemIndex = user.cart.findIndex(
        (item) => item.product._id.toString() === productId
      );
  
      if (cartItemIndex === -1) {
        return res.status(404).json({ message: "Product not found in the cart" });
      }
  
      user.cart.splice(cartItemIndex, 1);
      await user.save();
  
      res.redirect("/cart");
    } catch (error) {
      console.error("Error deleting product from the cart:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};



  
const getADD= async (req, res) => {
  const productId = req.params.productId;
  const quantity = parseInt(req.body.quantity || 1); // Default quantity is 1

  try {
    // Check if the user is authenticated (you can use a middleware for this)
    if (!req.session.login) {
      return res.json({ success: false, message: "User not logged in" });
    }

    const userId = req.session.user;
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const product = await productcollection.findById(productId);

    // Check if the product exists
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Find the item in the user's cart, if it already exists
    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    // Check if the new quantity exceeds the available quantity
    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      if (newQuantity > product.quantity) {
        return res.json({ success: false, message: "Insufficient stock" });
      }

      existingCartItem.quantity = newQuantity;
    } else {
      // If the product doesn't exist in the cart, add a new cart item

      // Check if the item quantity is zero in the database
      if (product.quantity === 0) {
        return res.json({ success: false, message: "Item is out of stock" });
      }

      // Check if the requested quantity exceeds the available quantity
      if (quantity > product.quantity) {
        return res.json({ success: false, message: "Insufficient stock" });
      }

      const cartData = {
        product: productId,
        quantity: quantity,
      };
      user.cart.push(cartData);
    }

    await user.save();

    // Respond with a success message
    res.json({ success: true, message: "Product added to cart" });
  } catch (error) {
    console.log(error);
    // Handle any errors and respond with a failure message
    res.status(500).json({ success: false, message: "Error adding product to cart" });
  }
};


const downloadOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // Fetch the order details from the database based on the orderId
    const order = await Order.findById(orderId).populate('items.product', 'productname');

    // Check if the order exists
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the response headers for download
    const filename = `invoice_${orderId}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/pdf');

    // Stream the PDF directly to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(18).text('Invoice', { align: 'center' });
    doc.moveDown(0.5);

    // Order ID and Date
    doc.fontSize(14).text('Order ID:', { continued: true }).text(orderId);
    doc.moveDown(0.5);
    doc.fontSize(12).text('Date:', { continued: true }).text(order.createdAt.toDateString());
    doc.moveDown(0.5);

    // Products and Quantity
    doc.fontSize(14).text('Products:', { underline: true });
    doc.font('Helvetica-Bold'); // Use a bold font for the table headers

    // Table headers
    doc.text('No.', 50, doc.y, { width: 30 });
    doc.text('Product Name', 150, doc.y, { width: 250 });
    doc.text('Quantity', 400, doc.y, { width: 100 });

    doc.moveDown(0.5);
    doc.font('Helvetica'); // Switch back to the regular font

    // Table rows
    order.items.forEach((item, index) => {
      const y = doc.y;
      doc.text(`${index + 1}.`, 50, y, { width: 30 });
      doc.text(item.product.productname, 150, y, { width: 250 });
      doc.text(item.quantity.toString(), 400, y, { width: 100 });
    });
    doc.moveDown(0.5);

    // Shipping Address
    doc.fontSize(14).text('Shipping Address:', { underline: true });
    doc.fontSize(12).text(`Name: ${order.shippingAddress.name}`);
    doc.fontSize(12).text(`House Number: ${order.shippingAddress.houseNumber}`);
    doc.fontSize(12).text(`City: ${order.shippingAddress.city}`);
    doc.fontSize(12).text(`State: ${order.shippingAddress.state}`);
    doc.fontSize(12).text(`Pin: ${order.shippingAddress.pin}`);
    doc.fontSize(12).text(`Phone: ${order.shippingAddress.phone}`);
    doc.moveDown(0.5);

    // Total Amount
    doc.fontSize(14).text('Total Amount:', { underline: true });
    doc.fontSize(12).text(`Subtotal: ${order.subtotal}`);
    if (order.discount) {
      doc.fontSize(12).text(`Discount: ${order.discount}`);
    }
    doc.fontSize(12).text(`Total: ${order.total}`);

    // Finalize the PDF and end the response stream
    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


  module.exports = {
    addtocart,
    getCart,
    updateCartItemQuantity,
    removeCartItem,
    getADD,
    downloadOrder
 
  
   
  };
  
