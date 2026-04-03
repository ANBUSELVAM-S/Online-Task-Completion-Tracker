const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String, // Keep "HH:mm" format or similar
    required: true,
  },
  description: {
    type: String,
    trim: true,
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  reminder_sent: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
