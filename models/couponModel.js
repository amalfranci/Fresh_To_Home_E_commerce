const mongoose=require("mongoose")
const couponSchema = new mongoose.Schema({
  name: {
    type: String,
        required: true,
        unique: true,
        uppercase:true
  },
  expiry: {
    type: Date,
    required:true,
  },
discount: {
    type: Number, // Assuming you will store the file path or URL of the icon image
    required: true,
    },
  active:{
        type:Boolean,
        default:true
    },
 

 
});

module.exports = mongoose.model("Coupon", couponSchema);
