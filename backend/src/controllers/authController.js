const bcrypt = require('bcrypt');
const User = require('../models/User');
const CustomerProfile = require('../models/CustomerProfile')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey123'

exports.registerCustomer = async (req, res) => {
    try {
        const { email, password, phone_number, full_name } = req.body

        const salt = await bcrypt.genSalt(10)
        const password_hash = await bcrypt.hash(password, salt)

        const emailExists = await User.findOne({ email })

        if (emailExists) {
            return res.status(400).json({ message: "Email already exists" })
        }

        const newUser = await User.create({
            email,
            phone_number,
            password_hash,
            role: 'CUSTOMER',
            status: 'ACTIVE'
        })

        await CustomerProfile.create({
            user_id: newUser._id,
            full_name
        })


        res.status(201).json({ message: 'User registered successfully', user: newUser })
    }
    catch (error) {
        res.status(500).json({ message: 'Error register ' + error.message })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Invalid credential' })
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' })
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 })

        res.status(200).json({ message: 'Login successful', user })
    }
    catch (error) {
        res.status(500).json({ message: 'Error login ' + error.message })
    }
}