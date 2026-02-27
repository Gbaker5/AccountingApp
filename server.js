const express = require('express')
const app = express()
const flash = require("express-flash");
const session = require("express-session");
const passport = require("passport");
const connectDB = require('./config/database')
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const morgan = require('morgan'); 
const methodOverride = require("method-override");


const homeRoutes = require('./routes/home')
//const todoRoutes = require('./routes/todos')

require('dotenv').config({path: './config/.env'})

// Passport config
require("./config/passport")(passport);


connectDB()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Setup Sessions - stored in MongoDB
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.DB_STRING,  // or your connection string
        mongooseConnection: mongoose.connection, // optional in v4+
      }),
    })
  );

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, ect...
app.use(flash());

// Use morgan middleware with a predefined format (e.g., 'dev', 'tiny', 'combined')
app.use(morgan('dev')); 

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

//METHOD OVERRIDE
app.use(methodOverride("_method"));




app.use('/', homeRoutes)
//app.use('/todos', todoRoutes)


 
const PORT = process.env.PORT || 1010;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});