const mongoose = require('mongoose');

const CustomerProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  full_name: { type: String, required: true },
  id_card_number: { type: String, default: '' },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
  date_of_birth: { type: Date },
  reward_points: { type: Number, default: 0, min: 0 },
  preferred_currency: { type: String, enum: ['VND', 'USD'], default: 'VND' }
});

module.exports = mongoose.model('CustomerProfile', CustomerProfileSchema);
