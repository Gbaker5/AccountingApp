const StatementArrSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
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
  
  

},{timestamps: true});

module.exports = mongoose.model('StatementArr', StatementArrSchema)
