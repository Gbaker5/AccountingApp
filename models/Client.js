const mongoose = require('mongoose')

const ClientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }

},{
       timestamps: true,
     })

module.exports = mongoose.model('Client', ClientSchema)