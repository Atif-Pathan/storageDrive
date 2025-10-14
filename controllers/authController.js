// controllers/authController.js
const bcrypt = require('bcryptjs');
const prismaClient = require('../config/prismaClient');
const { body, validationResult } = require('express-validator');

const validateUser = [
  body('username', 'Username must be 1–50 characters.').trim().notEmpty().isLength({ min: 1, max: 50 }),
  // Add password validation
  body('password').notEmpty().isLength({ min: 8 }),
  body('confirmPassword', 'Passwords must match.').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

// GET signup form
exports.getSignUp = (req, res) => {
  res.render('auth/signup');
};


// POST signup form, so user can sign up and redirect to login page
exports.postSignUp = [
    ...validateUser,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            const { username, password } = req.body;
            if (!errors.isEmpty) {
                return res.status(400).render('auth/signup', {
                    user: { username, password }, // Pass back submitted data
                    errors: errors.array(),
                });
            }

            // check if username already exists
            const existingUser = await prismaClient.user.findFirst({
                where: { username }
            })
            if (existingUser) {
                return res.status(400).render('auth/signup', {
                    user: { username },
                    error: 'Username is already registered/taken, try a different user name.',
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const newUser = await prismaClient.user.create({
                data: {
                    username: username,
                    password: hashedPassword
                }
            });

            console.log(`User created: ${newUser.username}`);

            // Redirect to login page with success message
            res.render('auth/login', {
                title: 'Log In to your Storage Drive!',
                success: 'Account created successfully! Please log in.',
            });
        } catch (error) {
            next(error);
        }
    }
]
   