const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }],
    businessName: {
      type: String,
      unique: true,
    },
    businessPhone: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Menu", MenuSchema);
