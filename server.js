const express = require('express')
const app = express()
const session = require("express-session");
const connectDB = require('./config/database')
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

const homeRoutes = require('./routes/home')
const todoRoutes = require('./routes/todos')

require('dotenv').config({path: './config/.env'})

connectDB()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Setup Sessions - stored in MongoDB
app.use(
    session({
      secret: "keyboard cat",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.DB_STRING,  // or your connection string
        mongooseConnection: mongoose.connection, // optional in v4+
      }),
    })
  );

app.use('/', homeRoutes)
//app.use('/todos', todoRoutes)
 
app.listen(process.env.PORT, ()=>{
    console.log('Server is running, you better catch it!')
})    