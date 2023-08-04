
const User = require("../models/usermodel");
const categoryCollection = require("../models/categoryModel");
const productModel = require("../models/productModel");
const Order = require("../models/orderModel")
const couponCollection=require("../models/couponModel");
const { render } = require("ejs");
const pdfkit = require('pdfkit')
require('dotenv').config()
//admin login


const getLogin=(req,res)=>{
    res.render("admin/adminlogin",{message:req.flash("error")})
}

// admin email & password
const postLogin = (req, res) => {
    try {
      const { email, password } = req.body;

     
      if (email ===  process.env.adminUserName && password === process.env.adminPassword) {
        req.session.login = true;
        res.redirect("/admin/home");
        console.log(req.body);
      } else {
        req.flash("error", "Invalid email or password"); 
        res.redirect("/admin");
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  

// admin home


const gethome = async (req, res) => {
  try {
    const totalUser = await User.find().count();
    const totalProducts = await productModel.find().count();
    const overallSales = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$total" } } },
    ]);
    const totalOrder = await Order.find().count();
    const date = new Date();
    const year = date.getFullYear();
    const currentYear = new Date(year, 0, 1);
    let sales = [];
    for (let i = 1; i < 13; i++) {
      sales.push({ _id: i, total: 0, count: 0 });
    }

    // Fetch sales data for the current year from the database
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: currentYear }, // Filter orders for the current year
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group orders by month
          totalSales: { $sum: "$total" }, // Calculate total sales for each month
        },
      },
    ]);

    // Update the sales array with the sales data for each month
    salesData.forEach((data) => {
      const monthIndex = data._id - 1;
      sales[monthIndex].total = data.totalSales;
    });

    let yearChart = [];
    for (let i = 0; i < sales.length; i++) {
      yearChart.push(sales[i].total);
    }

    res.render("admin/home", {
      totalUser,
      totalProducts,
      yearChart,
      totalOrder,
      totalSales: overallSales[0].totalSales,
    });
  } catch (error) {
    console.log(error.message);
  }
};


//  sales report 

const sortSales = async (req, res) => {
  try {
    const { interval } = req.body;
    let sortCriteria = {};

    if (interval === "daily") {
      sortCriteria = { createdAt: { $gte: calculateStartDate("daily") } };
    } else if (interval === "weekly") {
      sortCriteria = { createdAt: { $gte: calculateStartDate("weekly") } };
    } else if (interval === "monthly") {
      sortCriteria = { createdAt: { $gte: calculateStartDate("monthly") } };
    }




    // Aggregate orders based on the sort criteria
    const sales = await Order.aggregate([
      { $match: sortCriteria }, // Match orders based on the selected interval
      {
        $group: {
          _id: null, // Group all orders into a single document
          totalSales: { $sum: "$total" }, // Sum the 'total' field for all orders in the group
          totalOrder: { $sum: 1 }, // Count the number of orders in the group
        },
      },
    ]);
 

    const paymentData = await Order.aggregate([
      { $match: { createdAt: { $gte: calculateStartDate(interval) } } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    // Check if any data is found for the selected interval
    if (sales.length === 0) {
      return res.status(404).json({ error: "No data found for the selected interval." });
    }

    // Send the aggregated data as the response
    res.json({
      totalSales: sales[0].totalSales,
      totalOrder: sales[0].totalOrder,
       paymentData: {
        COD: paymentData.find((data) => data._id === "COD")?.count || 0,
        online: paymentData.find((data) => data._id === "online")?.count || 0,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

const calculateStartDate = (interval) => {
  const currentDate = new Date();
  if (interval === "daily") {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  } else if (interval === "weekly") {
    const firstDayOfWeek = currentDate.getDate() - currentDate.getDay();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDayOfWeek);
  } else if (interval === "monthly") {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }
};







//  admin logout

const getLogout=async(req,res)=>{

    req.session.login=false;
    res.redirect("/admin")
}


  //  getcategory

const getcategory= async(req,res)=>{
try{
  const data1=await  categoryCollection.find()
  res.render("admin/category",{data:data1,
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  })
}
catch(error)
{
  console.log(error.message)
}
}

const getproducts=async (req,res)=>{

  try{

    const data=await productModel.find().populate("category")
    res.render("admin/products",{products:data})
   
  }
  catch(error)
  {
    console.log(error.message)
  }
}

//  usermange
const getusermanage = async (req, res) => {
  try {
    const data = await User.find({});
    res.render("admin/usermanage", { user: data });
  } catch (error) {
    console.log(error.message);
  }
};

const getOrder = async (req, res) => {
  try {

    const orderData=await Order.find().populate('items.product').populate("user")
    console.log(orderData)
    res.render("admin/ordermanage", { order:orderData})
    
  } catch (error) {
    console.log(error.message);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;

    // Get the order data
    const order = await Order.findById(orderId).populate('items.product');

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // If the new status is "cancelled" and the current status is not "cancelled"
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      // Iterate through order items and update the product quantities
      for (const item of order.items) {
        // Increment the product quantity by the order quantity
        await productModel.findByIdAndUpdate(
          item.product._id,
          { $inc: { quantity: item.quantity } }
        );
      }
      order.orderStatusTime=Date.now
    }

    // Update the order status in the database
    await Order.updateOne({ _id: orderId }, { $set: { status: newStatus } });
     await order.save();


    res.status(200).send("Order status updated successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Order status update failed");
  }
};



const getCoupon = async (req, res) => {
  try {
    // Fetch all coupons from the database
    const couponData = await couponCollection.find({});

    res.render("admin/coupon", { couponData,errorMessage: req.flash("error") });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  getCoupon,
};

// Create Coupon
const postAddCoupon = async (req, res) => {
  try {
    const { name, expiry, discount } = req.body;

    const existingCoupon = await couponCollection.findOne({
      name: { $regex: name, $options: "i" },
    });

    if (existingCoupon) {
      req.flash("error", "Coupon already exists");
      res.redirect("/admin/coupon");
    } else {
      const result = await couponCollection.create({
        name,
        expiry,
        discount,
      });

      if (result) {
        // Coupon created successfully
        req.flash("success", "Coupon created successfully");
        res.redirect("/admin/coupon");
      } else {
        // Failed to create coupon
        req.flash("error", "Failed to create coupon");
        res.redirect("/admin/coupon");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};



 // Import the Coupon model

const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const { name, expiry, discount } = req.body;

    // Validate the required fields
    if (!name || !expiry || !discount) {
      return res.status(400).send("Name, expiry, and discount are required fields.");
    }

    // Convert the expiry date string to a Date object
    const expiryDate = new Date(expiry);

    // Validate the expiry date to ensure it is a valid date
    if (isNaN(expiryDate)) {
      return res.status(400).send("Invalid expiry date format.");
    }

    const coupon = await couponCollection.findById(couponId);

    // Check if the coupon with the provided ID exists
    if (!coupon) {
      return res.status(404).send("Coupon not found.");
    }

    coupon.name = name;
    coupon.expiry = expiryDate; // Save the Date object
    coupon.discount = discount;

    await coupon.save();
    console.log("hhhhhhhhh")

    res.json({ success: true }); // Send success response
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "An error occurred" }); // Send error response
  }
};


// DELETE COUPON 
const postDeleteCoupon= async (req, res) => {
  const couponId = req.params.couponId;

  try {
    // Find the coupon by ID and delete it
    await couponCollection.findByIdAndDelete(couponId);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting coupon' });
  }
};





const getSalesReport = async (req, res) => {
  
  try {
    res.render("admin/salesReport")
  

  }
  catch (error)
  {
    console.log(error.message)
  }

}


// sales report



const getPdfSales = async (req, res) => {
  try {
    // Fetch sales data from the database
    const salesData = await Order.find().populate('user').populate('items.product');

    // Create a new PDF document
    const doc = new pdfkit();

    // Set appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');

    // Write the PDF content
    doc.pipe(res);

    // Add the sales report data to the PDF
    doc.fontSize(20).text('User Wise Sales Report', { align: 'center' });
    doc.moveDown(1);

    // Check if there are orders to display
    if (salesData.length === 0) {
      doc.fontSize(12).text('No orders found.', { align: 'center' });
    } else {
      // Define table properties
      const startX = 50;
      const startY = doc.y;
      const tableHeaders = ['Order #', 'Order ID', 'User', 'Product', 'Quantity', 'Status', 'Total'];
      const colWidth = 70;
      const tableWidth = colWidth * tableHeaders.length;
      const tableHeight = 70;

      // Draw the table headers with borders
      doc.font('Helvetica-Bold').fontSize(12);
      for (let i = 0; i < tableHeaders.length; i++) {
        doc.rect(startX + i * colWidth, startY, colWidth, tableHeight).stroke();
        doc.text(tableHeaders[i], startX + i * colWidth + 5, startY + 10, { align: 'left', width: colWidth - 10 });
      }

      // Draw the column borders
      for (let i = 0; i <= tableHeaders.length; i++) {
        doc.moveTo(startX + i * colWidth, startY).lineTo(startX + i * colWidth, startY + tableHeight).stroke();
      }

      // Draw the data rows with borders
      doc.font('Helvetica').fontSize(10);
      for (const [index, order] of salesData.entries()) {
        const currentY = startY + tableHeight * (index + 1);
        doc.rect(startX, currentY, tableWidth, tableHeight).stroke();
        doc.text(index + 1, startX + 5, currentY + 10, { align: 'left', width: colWidth - 10 });
        doc.text(order._id.toString(), startX + colWidth + 5, currentY + 10, { align: 'left', width: colWidth - 10 });
        doc.text(order.user.name, startX + colWidth * 2 + 5, currentY + 10, { align: 'left', width: colWidth - 10 });

        // Add the product information
        let productNames = '';
        let quantities = '';
        order.items.forEach((item, i) => {
          productNames += `${item.product.productname}\n`; // Display product name separately
          quantities += `${item.quantity}\n`; // Display quantity separately
        });
        doc.text(productNames, startX + colWidth * 3 + 5, currentY + 10, { align: 'left', width: colWidth - 10 });
        doc.text(quantities, startX + colWidth * 4 + 5, currentY + 10, { align: 'left', width: colWidth - 10 });

        doc.text(order.status, startX + colWidth * 5 + 5, currentY + 10, { align: 'left', width: colWidth - 10 });
        doc.text(`$${order.total}`, startX + colWidth * 6 + 5, currentY + 10, { align: 'left', width: colWidth - 10 });
      }
    }

    doc.end();
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Failed to generate sales report.');
  }
};


// report
const getPdfTotal_Sales = async (req, res) => {
  try {
    // Get the selected period from the query parameters
    const period = req.query.period;

    // Fetch sales data from the database
    const salesData = await Order.find().populate('user').populate('items.product');

    // Filter the sales data based on the selected period
    const filteredSalesData = filterSalesDataByPeriod(salesData, period);

    // Perform additional processing on filtered sales data
    const totalSales = calculateTotal(filteredSalesData);
    const totalSalesCOD = calculateTotalSales(filteredSalesData, 'cod');
    const totalSalesCard = calculateTotalSales(filteredSalesData, 'card');
    const highestSoldProduct = findHighestSoldProduct(filteredSalesData);

    // Create a new PDF document
    const doc = new pdfkit();

    // Set appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${period.toLowerCase()}_sales_report.pdf`);

    // Write the PDF content
    doc.pipe(res);

    // Add the sales report data to the PDF
    doc.fontSize(20).text(`${period} Sales Report`, { align: 'center' });
    doc.moveDown(1);

    // Display Total Sales
    doc.fontSize(14).text('Total Sales: Rs.' + totalSales.toFixed(2), { align: 'left' });
    doc.moveDown(1);

    // Display Total Sales for COD and Card payments
    doc.fontSize(14).text(`Total Sales (COD): Rs.${totalSalesCOD.toFixed(2)}`, { align: 'left' });
    doc.fontSize(14).text(`Total Sales (Card): Rs.${totalSalesCard.toFixed(2)}`, { align: 'left' });
    doc.moveDown(1);

    // Display Highest Sold Product
    doc.fontSize(14).text('Highest Sold Product: ' + highestSoldProduct.productname, { align: 'left' });

    doc.end();
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Failed to generate sales report.');
  }
};

const calculateTotal = (salesData) => {
  let totalSales = 0;
  salesData.forEach(order => {
    totalSales += order.total;
  });
  return totalSales;
};

// Helper function to calculate total sales for a specific payment method
const calculateTotalSales = (salesData, paymentMethod) => {
  let totalSales = 0;
  salesData.forEach(order => {
    if (order.paymentMethod === paymentMethod) {
      totalSales += order.total;
    }
  });
  return totalSales;
};

// Helper function to find the highest sold product
const findHighestSoldProduct = (salesData) => {
  let productMap = new Map();
  salesData.forEach(order => {
    order.items.forEach(item => {
      const { productname, quantity } = item.product;
      if (productMap.has(productname)) {
        productMap.set(productname, productMap.get(productname) + quantity);
      } else {
        productMap.set(productname, quantity);
      }
    });
  });

  let highestSoldProduct = { productname: '', quantity: 0 };
  for (const [productname, quantity] of productMap.entries()) {
    if (quantity > highestSoldProduct.quantity) {
      highestSoldProduct.productname = productname;
      highestSoldProduct.quantity = quantity;
    }
  }

  return highestSoldProduct;
};



const filterSalesDataByPeriod = (salesData, period) => {
  const currentDate = new Date();
  const filteredSalesData = salesData.filter(order => {
    const orderDate = new Date(order.createdAt);
    if (period === 'daily') {
      return orderDate.toDateString() === currentDate.toDateString();
    } else if (period === 'weekly') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      return orderDate >= weekStart;
    } else if (period === 'monthly') {
      return orderDate.getMonth() === currentDate.getMonth() && orderDate.getFullYear() === currentDate.getFullYear();
    }
    return true; // Return all data if period is not specified or invalid
  });
  return filteredSalesData;
};











module.exports={
    getLogin,
    postLogin,
    gethome,
    getLogout,
    getcategory,
    getproducts,
    getusermanage,
    getOrder,
    updateOrderStatus,
  sortSales,
  getCoupon,
  postAddCoupon,
  editCoupon,
  getSalesReport,
  getPdfSales,
  getPdfTotal_Sales,
  postDeleteCoupon
    
}