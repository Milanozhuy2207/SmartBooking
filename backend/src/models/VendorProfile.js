const mongoose = require('mongoose');

const VendorProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  company_name: { type: String, required: true },
  business_license: { type: String, default: '' },
  bank_info: {
    bank_name: { type: String, required: true },
    account_number: { type: String, required: true },
    account_name: { type: String, required: true }
  },
  commission_rate: { type: Number, default: 10.0, min: 0, max: 100 },
  is_verified: { type: Boolean, default: false }
});

module.exports = mongoose.model('VendorProfile', VendorProfileSchema);
