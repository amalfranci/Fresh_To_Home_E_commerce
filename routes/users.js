const express = require('express');
const userRouter = express.Router();
const userController=require("../controllers/userController")
const session = require("../middleware/userSession")
const blockuser=require("../middleware/blockfind")
const cartController=require("../controllers/cartController")
const checkoutController = require("../controllers/checkoutController")
const productControllers=require("../controllers/productControllers")


userRouter.get("/",session.userloggedoff,userController.getHome)
userRouter.get("/login",session.userloggedin,userController.getLogin)
userRouter.get("/signup",userController.getSingup)
userRouter.get("/otp",userController.LoadOtp)
userRouter.get("/resendotp",userController.resendotp)
userRouter.get("/home",userController.getHome)
userRouter.get("/Logout",userController.getLogout)
userRouter.get("/forgotpassword",userController.getUsername)
userRouter.post("/forgot",userController.getUserCredentials)
userRouter.post("/change-password", userController.changePassword)
userRouter.get('/ordered-products/:orderId', productControllers.getOrderedProducts);
userRouter.post('/submit-product-review',productControllers.postRating)


userRouter.get("/unblock", userController.unblockuser);
userRouter.get("/block",userController.blockuser)
userRouter.get("/singleproduct",userController.getsingleproduct)
userRouter.post("/update-cart-item",cartController.updateCartItemQuantity)
userRouter.post("/add-to-cart/:productId", cartController.getADD);


userRouter.get("/cart", cartController.getCart);
userRouter.get("/deletecart/:id",cartController.removeCartItem)

userRouter.get("/checkout", checkoutController.getcartdata);
userRouter.get("/success",checkoutController.orderplaced)
userRouter.get("/account",userController.getUserProfile)

userRouter.get("/products", userController.getProducts);
userRouter.get("/filter", userController.filtercategory)


userRouter.post("/cart/:id", cartController.addtocart)
userRouter.post("/coupon/apply",checkoutController.couponRoute)




// Route to update cart item quantity

userRouter.post("/signup",userController.signupSubmit)
userRouter.post("/checkotp",userController.verifyOtp)
userRouter.post("/login",blockuser,userController.postlogin)
userRouter.post("/store-address",checkoutController.storeUserAddress)

userRouter.post('/submit-order',checkoutController.submitOrder)
userRouter.post('/update-profile',userController.updateData)
userRouter.post("/profile/editaddress/:id",userController.updateUserAddress)
userRouter.get("/order-details/:orderId", userController.getViewOrder)
userRouter.get("/get-wallet-balance", userController.userwallet)
userRouter.get("/get-wallet-history", userController.userwallet)
    userRouter.get("/download-order/:orderId",cartController.downloadOrder)



userRouter.put("/cancel-order/:orderId", userController.getCancelOrder)

userRouter.put('/return-order/:orderId',userController.getReturnOrder);




module.exports=userRouter
