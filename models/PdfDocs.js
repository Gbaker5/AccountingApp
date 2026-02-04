const mongoose = require('mongoose')

const PdfDocsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    require: true,
  },
  cloudinaryId: {
    type: String,
    require: true,
  },
  client: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", //user id created from user.js 
  },
  rawText: {
    type: String,
  },
  transactions: [
    {
      date: String,
      merchant: String,
      amount: Number,
      category: String,
    },
  ],

  analyzed: {
    type: Boolean,
    default: false,
  },
  
  
  
  

},{timestamps: true});

module.exports = mongoose.model('PdfDocs', PdfDocsSchema)
