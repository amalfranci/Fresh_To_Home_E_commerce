const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status:{
    type:String,
    default:"pending"
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
       
      }
    }
  ],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  shippingAddress: {
    name: String,
    houseNumber: String,
    city: String,
    state: String,
    pin: Number,
    phone: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  orderStatusTime: {
    type: Date,
    default: Date.now
  },
  razorpayOrderId:{
    type: String,
 
    
    
  },
  
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;