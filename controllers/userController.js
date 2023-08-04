const productcollection = require("../models/productModel");
const categorycollections = require("../models/categoryModel");
const bcrypt = require("bcrypt");
const User = require("../models/usermodel");
const nodemailer = require("nodemailer");
const { otpGen } = require("../controllers/otpControllers");
const Order = require("../models/orderModel");
const { ObjectId } = require("mongodb");
const Banner = require("../models/bannerModel")
require('dotenv').config()



const calculateOfferPrice = (product) => {
  if (product.category && product.category.offer && product.category.offer.percentage >= 1) {
    console.log("hello ")
    const offerPercentage = product.category.offer.percentage;
    return product.price - (product.price * (offerPercentage / 100));
  } else {
    return product.offer_price;
  }
};


const getHome = async (req, res) => {
  try {
    const data = await productcollection.find({ deleted: false }).populate('category');

    // Check the offer percentage for each product and calculate the offer price
    for (const product of data) {
      product.offer_price = calculateOfferPrice(product);
    }

    const data_cat = await categorycollections.find({ deleted: false });
     const banners = await Banner.find();

    
    if (req.session.login) {
      res.render("user/home", { user: req.session.name, product: data, category: data_cat,banners });
    } else {
      res.render("user/home", { product: data, category: data_cat,banners });
    }
  } catch (error) {
    console.log(error.message);
  }
};


// login

const getLogin = (req, res) => {
  try {
    res.render("user/Login");
  } catch (error) {
    console.log(error.message);
  }
};

// post login

// signup
const getSingup = (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    console.log(error.message);
  }
};
// post signup

const postsignup = async (req, res) => {
  try {
    const { name, email, number, password } = req.body;
    const data = await User.findOne({ email: email });
    if (data) {
      res.render("user/signup", { message: "email already exist" });
    } else {
      const data = new User({
        name: name,
        email: email,
        number: number,
        password: password,
      });

      req.session.name = name;
      req.session.email = email;
      req.session.number = number;
      req.session.password = password;
      const result = await data.save();
      if (result) {
        res.render("user/signup", { message: "registration successfully " });
      } else {
        res.render("user/signup", { message: "registration faild" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

//   otp
const sMail = (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.nodeMailerUserName,
      pass: process.env.nodeMailerPassword,
    },
  });

  const mailOptions = {
    from: "amalfrancis744@gmail.com",
    to: email,
    subject: "Your OTP",
    text: `Your OTP is ${otp}`,
  };

  // send the email-------------------

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent:" + info.response);
    }
  });
};

var oneTimePin;
var userdata;

const signupSubmit = async (req, res) => {
  try {
    const { name, email, number, password } = req.body;
    const data = await User.findOne({ email: email });
    console.log("data", data);
    if (data) {
      res.render("user/signup", { message: "email already exist" });
    } else {
      oneTimePin = otpGen();
      userdata = req.body;
      req.session.pass = oneTimePin;
      sMail(req.body.email, oneTimePin);

      res.redirect("/otp");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    let { val1, val2, val3, val4, val5, val6 } = req.body;
    console.log(req.body);
    let formOtp = Number(val1 + val2 + val3 + val4 + val5 + val6);
    if (formOtp == oneTimePin) {
      let { name, email, number, password } = userdata;
      const user = new User({
        name: name,
        email: email,
        number: number,
        password: password,
      });
      const userData = await user.save();
      if (userData) {
        res.render("user/login", { message: "registration succuss" });
      }
    } else {
      res.render("user/signup", { message: "registration failed" });
    }
  } catch (error) {
    console.log("verifyOtp", error.message);
  }
};
const LoadOtp = (req, res) => {
  try {
    res.render("user/otp");
  } catch (error) {
    console.log(error.message);
  }
};

//resend otp----------
const resendotp = (req, res) => {
  oneTimePin = otpGen();
  sMail(userdata.email, oneTimePin);
  res.redirect("/otp");
};

//   postlogin

const postlogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email,
    });
    if (user) {
      const passwordMatch = password === user.password;
      if (passwordMatch) {
        req.session.login = true;
        req.session.user = user._id;
        req.session.name = user.name;
        req.flash("sucess", "login sucessfully");
        res.redirect("/");
      } else {
        res.render("user/Login", { message: "invalid username and password" });
      }
    } else {
      res.render("user/Login", { message: "Invalid username and password" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
// userlOGOUT

const getLogout = (req, res) => {
  req.session.destroy(() => {
    res.render("user/Login");
  });
};
const unblockuser = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.query.id });
    if (userData) {
      await User.updateOne({ _id: userData._id }, { $set: { status: false } });
      res.redirect("/admin/usermanage");
    }
  } catch (error) {
    console.log(error);
  }
};
const blockuser = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.query.id });
    if (userData) {
      await User.updateOne({ _id: userData._id }, { $set: { status: true } });
      res.redirect("/admin/usermanage");
    }
  } catch (error) {
    console.log(error);
  }
};
const getsingleproduct = async (req, res) => {
  try {
    const id = req.query.id;
    const data = await productcollection
      .findById(id)
      .populate('category')
      .populate('reviews.user', 'name'); // Populate the user data for each review

    data.offer_price = calculateOfferPrice(data);
    

    if (req.session.login) {
      res.render("user/singleproduct", { user: req.session.name, product: data });
    } else {
      res.render("user/singleproduct", { product: data });
    }
  } catch (error) {
    console.log(error.message);
  }
};



const getUserProfile = async (req, res) => {
  try {
    if (req.session.user) {
      const userData = await User.findOne({ _id: req.session.user });
      const orderData = await Order.find({ user: req.session.user }).populate('items.product');
      const user = await User.findOne({ _id: req.session.user }, { address: 1 }).lean();

      res.render("user/account", {
        data: userData,
        address: user.address,
        messages: req.flash(),
        user: user,
        order: orderData
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateData = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.number;
    const id = req.body.id;

    const data = await User.findByIdAndUpdate(id, {
      $set: { name: name, email: email, number: mobile },
    });
    if (data) {
      req.flash("success", "Userprofile updated successfully");
      res.redirect("/account");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUserAddress = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.user;
      const { fullName, mobileNumber, houseNo, street, state, zip } = req.body;
      const addressId = req.params.id;
      const user = await User.findById(userId);
      const address = user.address.find((address) =>
        address._id.toString() === addressId
      );

      if (!address) return res.status(404).json({ error: "Address not found" });
      address.name = fullName;
      address.phone = mobileNumber;
      address.housenumber = houseNo;
      address.street = street;
      address.state = state;
      address.postcode = zip;
      await user.save();

      res.redirect("/account");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const getProducts = async (req, res) => {
  try {
    let search = req.query.search || "";
    let filter2 = req.query.filter || "ALL";
    let sort = req.query.sort || "Low";
    const pageNO = parseInt(req.query.page) || 1;
    const perpage = 12;
    const skip = perpage * (pageNO - 1);

    const catData = await categorycollections.find({ deleted: false });
    let cat = catData.map((category) => category._id);

    let filter;
    if (filter2 === "ALL") {
      filter = [...cat];
    } else {
      filter = req.query.filter.split(",");
    }

    if (filter2 !== "ALL") {
      filter = filter.map((categoryId) => new ObjectId(categoryId));
    }

    const sortDirection = sort === "High" ? -1 : 1;

    const data = await productcollection.aggregate([
      {
        $match: {
          productname: { $regex: "^" + search, $options: "i" },
          category: { $in: filter },
        },
      },
      { $sort: { price: sortDirection } },
      { $skip: skip },
      { $limit: perpage },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
      { $unwind: "$category" },
      {
        $project: {
          _id: 1,
          productname: 1,
          brand: 1,
          price: 1,
          description: 1,
          quantity: 1,
          image: 1,
          deleted: 1,
          offer_price: {
            $cond: {
              if: {
                $gte: ["$category.offer.percentage", 1] // Check if offer percentage is greater than or equal to 1
              },
              then: {
                $subtract: [
                  "$price",
                  { $multiply: ["$price", { $divide: ["$category.offer.percentage", 100] }] } // Calculate the offer_price using the offer percentage
                ]
              },
              else: "$offer_price" // If offer percentage is less than 1, use the regular price as offer_price
            }
          },
          category: 1,
        }
      },
    ]);

    const productCount = await productcollection.countDocuments({
      productname: { $regex: search, $options: "i" },
      category: { $in: filter },
    });

    const totalPage = Math.ceil(productCount / perpage);

    if (req.session.login) {
      res.render("user/products", {
        user: data,
        data2: catData,
        total: totalPage,
        filter: filter2,
        sort: sort,
        search: search,
        users: req.session.name,
      });
    } else {
      res.render("user/login");
    }
  } catch (error) {
    console.log(error);
  }
};



const filtercategory = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const categoryId = req.query.id;
    const data2 = await categorycollections.find().lean();
    const pageNO = req.query.page;
    const perpage = 6;

    // Count the total number of products that match the search term and category
    const count = await productcollection
      .find({
        category: categoryId,
        $or: [
          { productname: { $regex: ".*" + search + ".*", $options: "i" } },
          { brand: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .countDocuments();

    const totalpage = Math.ceil(count / perpage);
    let a = [];
    let i = 0;
    for (var j = 1; j <= totalpage; j++) {
      a[i] = j;
      i++;
    }

    const data = await productcollection
      .find({
        category: categoryId,
        $or: [
          { productname: { $regex: ".*" + search + ".*", $options: "i" } },
          { brand: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .skip((pageNO - 1) * perpage)
      .limit(perpage)
      .populate("category");

    res.render("user/products", { user: data, data2, total: a });
  } catch (error) {
    console.log(error.message);
  }
};

const getUsername = async (req, res) => {
  try {
   
    
      res.render("user/forgotpassword");
    
  } catch (error) {
    console.log(error.message);
  }
};

const getUserCredentials = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (user) {
      // Send the user's email and password to their email address using nodemailer
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "amalfrancis744@gmail.com",
          pass: "nmifhllqxjmxtful",
        },
      });

      const mailOptions = {
        from: "amalfrancis744@gmail.com",
        to: email,
        subject: "Your Credentials for login",
        text: `Your email is: ${email}\nYour password is: ${user.password}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          res.render("user/login", { message: "Check your mail for your credentials" });
        }
      });
    } else {
      res.render("user/forgotpassword", { message: "Email does not exist" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, repeatNewPassword } = req.body;
    if (req.session.user) {
      const userData = await User.findOne({ _id: req.session.user });
      const orderData = await Order.find({ user: req.session.user }).populate('items.product');
      const user = await User.findOne({ _id: req.session.user }, { address: 1 }).lean();

      // Check if the new passwords match
      if (newPassword !== repeatNewPassword) {
        return res.render("user/account", { data: userData, order: orderData, address: user.address, messages: ["New passwords do not match"] });
      }

      // Find the user by email
      const use = await User.findOne({  _id: req.session.user });

      // Check if the user exists
      if (!use) {
        return res.render("user/account", { data: userData, order: orderData, address: user.address, messages: ["User not found"] });
      }

      // Check if the current password provided matches the user's actual password
      if (currentPassword !== use.password) {
        return res.render("user/account", { data: userData, order: orderData, address: user.address, messages: ["Incorrect current password"] });
      }

      // Save the new password (as plain text)
      use.password = newPassword;
      await use.save();

      return res.render("user/account", { data: userData, order: orderData, address: user.address, messages: ["Password changed successfully"] });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/account", { messages: ["An error occurred. Please try again later."] });
  }
};

const getViewOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate('items.product')
    

    if (!order) {
      return res.json({ success: false });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Error fetching order details" });
  }
};

const getCancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate('items.product');
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "cancelled" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Add the order total to the user's wallet
    const userId = req.session.user; // Assuming you have the user object in the request (e.g., after authentication)
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.wallet += updatedOrder.total;
    user.walletHistory.push({
      peramount: updatedOrder.total,
      date: new Date().toISOString(),
    });

    await user.save();

    // Increment the product quantities in stock
    for (const item of order.items) {
      await productcollection.findByIdAndUpdate(
        item.product._id,
        { $inc: { quantity: item.quantity } }
      );
    }

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Error cancelling order" });
  }
};



// Assuming you have the necessary imports and setup for your Express app
// ...

const getReturnOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate('items.product');
    
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Update the order status to "returned"
    order.status = "returned";
    const updatedOrder = await order.save();

    // Add the order total to the user's wallet
    const userId = req.session.user; // Assuming you have the user object in the request (e.g., after authentication)
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.wallet += updatedOrder.total;
    user.walletHistory.push({
      peramount: updatedOrder.total,
      date: new Date().toISOString(),
    });

    await user.save();

    res.json({ success: true, message: "Order returned successfully", updatedOrder });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Error returning order" });
  }
};






const userwallet = async (req, res) => {try {
    const userId =  req.session.user // Replace with the user ID of the currently logged-in user
    // You can obtain the user ID from the authentication or session data

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    // Get the wallet balance from the user document
  const walletBalance = user.wallet;
   const walletHistory = user.walletHistory;

    res.json({ success: true, walletBalance,walletHistory });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Error fetching wallet balance' });
  }

  

}





module.exports = {
  getHome,
  getLogin,
  getSingup,
  postsignup,
  LoadOtp,
  resendotp,
  verifyOtp,
  signupSubmit,
  sMail,
  postlogin,
  getLogout,
  unblockuser,
  blockuser,
  getsingleproduct,
  getUserProfile,
  updateData,
  updateUserAddress,
  getProducts,
  filtercategory,
  getUsername,
  getUserCredentials,
  changePassword,
  getViewOrder,
  getCancelOrder,
  userwallet,
  getReturnOrder
};
