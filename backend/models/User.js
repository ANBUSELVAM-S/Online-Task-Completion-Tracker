const mongoose = require("mongoose");

// Counter schema for auto-incrementing userId
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  google_id: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
}, { timestamps: true });

// Auto-generate userId before saving (e.g., 1, 2, 3...)
userSchema.pre("save", async function () {
  if (!this.userId) {
    const counter = await Counter.findByIdAndUpdate(
      "userId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
