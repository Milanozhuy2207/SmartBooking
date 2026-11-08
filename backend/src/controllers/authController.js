const bcrypt = require('bcrypt');
const User = require('../models/User');
const CustomerProfile = require('../models/CustomerProfile');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey123';

exports.registerCustomer = async (req, res) => {
    try {
        const { email, password, phone_number, full_name } = req.body;

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const emailExists = await User.findOne({ email });

        if (emailExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const newUser = await User.create({
            email,
            phone_number,
            password_hash,
            role: 'CUSTOMER',
            status: 'ACTIVE'
        });

        await CustomerProfile.create({
            user_id: newUser._id,
            full_name
        });

        res.status(201).json({ message: 'User registered successfully', user: newUser });
    }
    catch (error) {
        res.status(500).json({ message: 'Error register ' + error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Invalid credential' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });

        const profile = await CustomerProfile.findOne({ user_id: user._id });
        const userObj = user.toObject();
        delete userObj.password_hash;

        res.status(200).json({
            message: 'Login successful',
            user: {
                ...userObj,
                full_name: profile ? profile.full_name : (user.role === 'ADMIN' ? 'Administrator' : 'Partner Vendor'),
                reward_points: profile ? profile.reward_points : 0
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error login ' + error.message });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password_hash').sort({ createdAt: -1 }).lean();
        const profiles = await CustomerProfile.find().lean();
        const usersWithProfile = users.map(u => {
            const p = profiles.find(prof => prof.user_id?.toString() === u._id.toString());
            return {
                ...u,
                full_name: p?.full_name || (u.role === 'ADMIN' ? 'System Admin' : u.role === 'VENDOR' ? 'Hotel Partner' : 'Khách hàng'),
                reward_points: p?.reward_points || 0
            };
        });
        return res.status(200).json({ success: true, data: usersWithProfile });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUserRoleStatus = async (req, res) => {
    try {
        const { role, status } = req.body;
        const updateData = {};
        if (role) updateData.role = role;
        if (status) updateData.status = status;

        const updated = await User.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' }).select('-password_hash');
        if (!updated) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
