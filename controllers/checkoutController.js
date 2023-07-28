const Order = require("../models/orderModel");
const User = require("../models/usermodel");
const categorycollections = require("../models/categoryModel");
const productcollection = require("../models/productModel");
const Razorpay = require('razorpay');
const userRouter = require("../routes/users");
const Coupon=require("../models/couponModel")

const razorpay = new Razorpay({ 
  key_id: 'rzp_test_oLMzBcAQa08Hks', 
  key_secret: 'YZ3PhIrXxOCbpCTy2bqavBqV'
})
  

const calculateOfferPrice = (product) => {
  if (product.category && product.category.offer && product.category.offer.percentage >= 1) {
    console.log("hello ")
    const offerPercentage = product.category.offer.percentage;
    return product.price - (product.price * (offerPercentage / 100));
  } else {
    return product.offer_price;
  }
};

const getcartdata = async (req, res) => {
  try {
    const categories = await categorycollections.find({ deleted: false });
    const products = await productcollection.find({ deleted: false });

    if (req.session.login) {
      const userId = req.session.user;
      const cartTotal = req.session.cartTotalAmount;
      const user = await User.findById(userId).populate({
        path: "cart.product",
        populate: {
          path: "category",
          model: "Category",
        },
      });

      // Calculate offer prices for each cart item
      const cartItems = user.cart.map((item) => {
        const product = item.product;
        const quantity = item.quantity;
        const offer_price = calculateOfferPrice(product); // Calculate the offer price
        return { product, quantity, offer_price };
      });

      res.render("user/checkout", {
        user: req.session.name,
        categories,
        cartTotal,
        products,
        cartItems,
        addresses: user.address,
      });
    } else {
      res.render("user/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const storeUserAddress = async (req, res) => {
  try {
    const { fullName, mobileNumber, houseNo, street, state, zip } = req.body;

    const newAddress = {
      name: fullName,
      phone: mobileNumber,
      housenumber: houseNo,
      street: street,
      state: state,
      postcode: zip,
    };

    const userId = req.session.user;
    await User.findByIdAndUpdate(
      userId,
      { $push: { address: newAddress } },
      { new: true }
    );

    res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const submitOrder = async (req, res) => {
  try {
    req.session.cartTotal = req.body.totalAmount;

    const {
      addressId,
      paymentMethod,
      totalAmount,
      subTotal,
      discount,
      products,
    } = req.body;

    console.log("its for subtotal",totalAmount)

    const user = await User.findById(req.session.user);
    const address = user.address.find((item) => item._id.toString() === addressId);

    const parsedSubTotal = parseFloat(subTotal.replace("Rs ", ""));
    const parsedDiscount = parseFloat(discount.replace("Rs ", ""));
    const parsedTotal = parseFloat(totalAmount.replace("Rs ", ""));

    if (paymentMethod === 'cod') {
      const orderItems = await Promise.all(products.map(async (product) => {
        await productcollection.findByIdAndUpdate(product._id, { $inc: { quantity: -product.quantity } });

        return {
          product: product._id,
          quantity: product.quantity
        };
      }));

      const order = new Order({
        user: user._id,
        items: orderItems,
        subtotal: parsedSubTotal,
        discount: parsedDiscount,
        total: parsedTotal,
        paymentMethod: paymentMethod,
        shippingAddress: {
          name: address.name,
          houseNumber: address.houseNo,
          city: address.city,
          state: address.state,
          pin: address.zip,
          phone: address.phone,
        },
      });

      await order.save();

      user.cart = [];
      await user.save();

      res.json({ success: true });
    } else {
      const razorpayOptions = {
        amount: parsedTotal * 100, // Amount in paise or the smallest currency unit
        currency: 'INR',
        receipt: 'order_receipt', // A unique identifier for the order
        payment_capture: 1
      };

      razorpay.orders.create(razorpayOptions, async (err, order) => {
        if (err) {
          console.error(err, 'error message');
          res.json({ success: false });
          return;
        }

        const orderId = order.id;
        const orderItems = await Promise.all(products.map(async (product) => {
          await productcollection.findByIdAndUpdate(product._id, { $inc: { quantity: -product.quantity } });

          return {
            product: product._id,
            quantity: product.quantity
          };
        }));

        const newOrder = new Order({
          user: user._id,
          items: orderItems,
          subtotal: parsedSubTotal,
          discount: parsedDiscount,
          total: parsedTotal,
          paymentMethod: paymentMethod,
          shippingAddress: {
            name: address.name,
            houseNumber: address.houseNo,
            city: address.city,
            state: address.state,
            pin: address.zip,
            phone: address.phone,
          },
          razorpayOrderId: orderId
        });

        await newOrder.save();

        user.cart = [];
        await user.save();

        res.json({ success: true, razorpayOrderId: orderId });
      });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
};





const orderplaced=async(req,res)=>{

  try{

    res.render("user/success")


  }
  catch(error)
  {
    console.log(error.message)
  }
}


const couponRoute= async (req, res) => {
  try {
    const { couponCode, grandTotal } = req.body;

    // Find the coupon by code
    const coupon = await Coupon.findOne({ name: couponCode });

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }

    if (!coupon.active) {
      return res.status(400).json({ error: 'Coupon is inactive.' });
    }

    const now = new Date();
    if (now > coupon.expiry) {
      return res.status(400).json({ error: 'Coupon has expired.' });
    }

    // Check if the grand total is greater than 1000 (if required)
    // If not, return without applying the discount
    if (grandTotal < 1000) {
      return res.json({ grandTotal });
    }

    // Calculate the discount amount based on the coupon's percentage
    const discountAmount = (grandTotal * coupon.discount) / 100;
    const updatedTotal = grandTotal - discountAmount;

    return res.json({ grandTotal: updatedTotal });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = {
  getcartdata,
  storeUserAddress,
  submitOrder,
  orderplaced,
  couponRoute
};
