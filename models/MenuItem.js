const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  menu: {
    type: String,
  },
  count: {
    type: Number,
    default: 0,
    required: true
  }
});

module.exports = mongoose.model("MenuItem", MenuItemSchema);
