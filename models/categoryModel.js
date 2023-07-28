const mongoose=require("mongoose")
const categorySchema = mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String, // Assuming you will store the file path or URL of the icon image
    required: true,
  },
  offer: {
    percentage: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
  },
});

module.exports = mongoose.model("Category", categorySchema);
