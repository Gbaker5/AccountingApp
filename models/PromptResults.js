const mongoose = require('mongoose')

const PromptResultSchema = new mongoose.Schema({

  prompt: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  result: {
    type: String,
    required: true,
  }
},{timestamps:true})

module.exports = mongoose.model('PromptResult', PromptResultSchema)