const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  address: [
    {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      housenumber: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
     
      state: {
        type: String,
        required: true,
      },
     
      postcode: {
        type: String,
        required: true,
      },
    },
  ],
 
  cart:[{
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"products",
    },
    quantity:{
        type:Number,
        default:1
    },
  }],
  wallet: {
    type: Number,
    default: 0,
  },
  walletHistory: [
    {
      peramount: {
        type: Number,
      },
      date: {
        type: String,
      },
    },
  ],
});

// User collection and export
module.exports = mongoose.model("User", userSchema);
