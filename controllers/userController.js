const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // 4. Response
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check user exists
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user
    });
};

// @desc    Reset Password
// @route   PUT /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // 1. Check if email exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: 'Email not registered'
            });
        }

        // 2. Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Update password
        user.password = hashedPassword;
        await user.save();

        // 4. Response
        res.json({
            message: 'Password updated successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, resetPassword };