const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const productschema = new mongoose.Schema({
    productname:{
        type:String,
       
    },
    brand:{
        type:String,
       
    },
    price:{
        type:Number,
        
    }
    ,offer_price:{
        type:Number,
        
    },
    description:{
        type:String,
        
    },
    quantity:{
        type:Number,
       
    },
    category:{
        type:ObjectId,
        ref:"Category",
  
        
    },
    image:{
        type:Array,
        required: true
       
    },
    deleted:{
        type:Boolean,
        default:false
    },
     reviews: [
    {
      user: {
        type: ObjectId,
        ref: "User",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

});

module.exports = mongoose.model('products',productschema)




