const mongoose = require('mongoose')

const ClientProfileSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },

  contact: {
    address: String,
    phoneNumber: String,
    email: String,
  },

  financialSnapshot: {
    monthlyIncome: Number,
    monthlyExpenses: Number,
    riskTolerance: {
      type: String,
      enum: ["low", "medium", "high"],
    },
  },

  goals: [
    {
      goalType: {
        type: String,
        enum: ["savings", "debt", "tax", "emergency", "custom"],
        required: true,
      },
      targetAmount: Number,
      targetDate: Date,
      priority: Number,
      notes: String,
    }
  ],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }

}, {
  timestamps: true,
});

module.exports = mongoose.model("ClientProfile", ClientProfileSchema);
