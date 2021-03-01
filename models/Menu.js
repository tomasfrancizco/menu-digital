const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }],
});

module.exports = mongoose.model("Menu", MenuSchema);
