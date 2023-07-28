const express=require("express")
const adminRouter=express.Router();
const flash = require("connect-flash");

const adminController=require("../controllers/adminController")
const categorycontroller = require("../controllers/categoryController");
const productControllers=require("../controllers/productControllers")
const session = require("../middleware/adminSession")
const multer = require("multer");
const upload = require("../middleware/multer");
const userController = require("../controllers/userController")
const bannerController=require("../controllers/bannerController")



const storageCategory = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/CategoryIcons/");
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}.${file.originalname}`);
    },
  });
  const uploadSingle = multer({
    storage: storageCategory,
  }).single("icon");


  const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/BannerImage/'); // Store the uploaded images in the 'uploads' directory
  },
   filename: function (req, file, cb) {
      cb(null, `${Date.now()}.${file.originalname}`);
    },
  });

// Initialize Multer upload with the defined storage settings
const uploadBanner = multer({ storage: storage });





//  get
adminRouter.get("/",session.notLogged,adminController.getLogin);
adminRouter.get("/home",session.logged,adminController.gethome)
adminRouter.get("/logout",session.logged,adminController.getLogout)
adminRouter.get("/category",session.logged,adminController.getcategory)
adminRouter.get("/products",session.logged,adminController.getproducts)
adminRouter.get("/addproducts",session.logged,productControllers.getAddproduct)
adminRouter.post("/addproducts", upload,productControllers.postProduct)
adminRouter.get("/editproducts",session.logged,productControllers.editProducts)
adminRouter.post("/removeimage",session.logged,productControllers.removeImage)
adminRouter.get("/usermanage",session.logged,adminController.getusermanage)
adminRouter.get("/ordermanage", session.logged, adminController.getOrder)
adminRouter.get("/coupon", session.logged, adminController.getCoupon)
adminRouter.get("/order-details-admin/:orderId", userController.getViewOrder)
adminRouter.get("/product/unlist/:id",session.logged,productControllers.unlistporduct)
adminRouter.get("/category/unlist/:id", session.logged, categorycontroller.unlistcategory)
adminRouter.get("/addBanner", session.logged, bannerController.getBanner)
adminRouter.get("/salesReport", session.logged, adminController.getSalesReport)
adminRouter.get("/generate_sales_report_pdf",session.logged, adminController.getPdfSales)
adminRouter.get('/sales_report_pdf',session.logged, adminController.getPdfTotal_Sales)






// post



adminRouter.post("/",adminController.postLogin)
adminRouter.post("/addcategory",uploadSingle,categorycontroller.postAddCategory)
adminRouter.post("/deleteCategory/:id",session.logged,categorycontroller.deleteCategory)
adminRouter.post("/editCategory/:id", uploadSingle, session.logged, categorycontroller.editCategory)
adminRouter.post("/editcoupon/:id",session.logged,adminController.editCoupon)

adminRouter.post("/editproducts/:id",session.logged,upload,productControllers.editPostProduct)
adminRouter.post('/updateOrderStatus/:id',session.logged,adminController.updateOrderStatus)
adminRouter.post("/sort_sales_data", session.logged, adminController.sortSales)
adminRouter.post("/addcoupon", session.logged, adminController.postAddCoupon)
adminRouter.post("/addBanner", session.logged, uploadBanner.single('banner'), bannerController.postBanner)
adminRouter.post('/editbanner/:id', session.logged, uploadBanner.single('banner'), bannerController.postEdit)
adminRouter.delete("/deletebanner/:id",session.logged,bannerController.deleteBanner)









module.exports=adminRouter;