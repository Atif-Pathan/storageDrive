// app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const isProduction = process.env.NODE_ENV === 'production';

// passport rleated stuff
require('./config/passport');
const passport = require("passport");

// Import middlewares -- if needed here
const { attachUser } = require('./middleware/authRelated');

// Import all the auth/session related stuff
const session = require("express-session");
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prismaClient = require("./config/prismaClient")

// Import all the routers for the routes
const { Router } = require('express');
const authRouter = require('./routes/authRoutes');
const driveRouter = require('./routes/driveRoutes');
const indexRouter = Router(); // use router here, no need to have a router or controller for the base url /

// GET homepage/landing page
indexRouter.get('/', async (req, res, next) => {
  try {
    res.render('index');
  } catch (err) {
    next(err);
  }
});

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
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long');
}
app.use(
  session({
    cookie: {
     maxAge: 24 * 60 * 60 * 1000, // 24 hours
     httpOnly: true,
     secure: isProduction,
     sameSite: 'lax',
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
app.use(passport.initialize());
app.use(passport.session());

// attach any custom middlewares (imported above)
app.use(attachUser)

// Routes
app.use('/', indexRouter)
app.use('/auth', authRouter);
app.use('/mydrive', driveRouter)

// Global error handler
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.redirect('/mydrive?error=File too large. Maximum size is 8MB');
  }

  // Multer file type error
  if (err.message && err.message.includes('Invalid file type')) {
    return res.redirect('/mydrive?error=' + encodeURIComponent(err.message));
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return res.redirect('/mydrive?error=A folder with that name already exists');
  }

  // Default 500 error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(PORT, () => {
  console.log(
    `Storage Drive -  Server is running on http://localhost:${PORT}`,
  );
});