// app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const isProduction = process.env.NODE_ENV === 'production';

// passport rleated stuff
require('./config/passport');
const passport = require("passport");

// Import middlewares -- if needed here
// const { requestLogger } = require('./middleware/logging');

// Import all the auth/session related stuff
const session = require("express-session");
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prismaClient = require("./config/prismaClient")

// Import all the routers for the routes
const authRouter = require('./routes/authRoutes');

// setup the app + port
const app = express();
const PORT = process.env.PORT || 3000;

// mount the styles which will be in the public folder
const assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));

// This middleware is crucial for parsing form data from POST requests
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views')); // Set the view engine to EJS
app.set('view engine', 'ejs');

// session config using the Prisma Session Store & Prisma Client
app.use(
  session({
    cookie: {
     maxAge: 24 * 60 * 60 * 1000, // 24 hours
     httpOnly: true,
     secure: isProduction,
     sameSite: isProduction ? 'lax' : 'none',
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(
          prismaClient,
          {
            checkPeriod: 2 * 60 * 1000,  //ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
          }
    ),
  })
);

// Passport config
app.use(passport.session());

// attach any custom middlewares (imported above)

// Routes
app.use('/auth', authRouter);

// Global error handler
app.use((err, req, res, next) => {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error'); // Renders views/error.ejs
});

app.listen(PORT, () => {
  console.log(
    `Storage Drive -  Server is running on http://localhost:${PORT}`,
  );
});