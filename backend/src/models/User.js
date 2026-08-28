const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone_number: { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['CUSTOMER', 'VENDOR', 'ADMIN'], required: true },
  status: { type: String, enum: ['PENDING', 'ACTIVE', 'BANNED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
