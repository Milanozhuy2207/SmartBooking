const jwt = require('jsonwebtoken')
const User = require('../models/User')

exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, please login first' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');

        if (!decoded) {
            return res.status(401).json({ message: 'Not authorized, please login first' })
        }

        req.userId = decoded.userId
        req.role = decoded.role

        next()

    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, please login first' })
    }
}

exports.verifyAdmin = async (req, res, next) => {
    if (req.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Not allowed to access this resource' })
    }

    next()
}