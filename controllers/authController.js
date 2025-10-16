// controllers/authController.js
const bcrypt = require('bcryptjs');
const prismaClient = require('../config/prismaClient');
const { body, validationResult } = require('express-validator');

const validateUser = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be 1–50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

// GET signup form
exports.getSignUp = (req, res) => {
  res.render('auth/signup', {
    errors: null,
    username: ''
  });
};


// POST signup form, so user can sign up and redirect to login page
exports.postSignUp = [
    ...validateUser,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            const { username, password } = req.body;

            if (!errors.isEmpty()) {
                return res.render('auth/signup', {
                errors: errors.array(),
                username
                });
            }

            // check if username already exists
            const existingUser = await prismaClient.user.findUnique({
                where: { username }
            })

            if (existingUser) {
                return res.render('auth/signup', {
                errors: [{ msg: 'Username is already taken. Please choose another.' }],
                username
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            // create new user with username and password
            await prismaClient.user.create({
                data: {
                    username,
                    password: hashedPassword
                }
            });

            // Redirect with success message
            res.redirect('/auth/login?success=Account created! Please log in.');
        } catch (error) {
            next(error);
        }
    }
]

// GET login form
exports.getLogin = (req, res) => {
  const error = req.query.error;
  const success = req.query.success;
  
  res.render('auth/login', {
    error: error || null,
    success: success || null
  });
};
   