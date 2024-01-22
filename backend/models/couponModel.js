const mongoose = require('mongoose');

const couponSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      uppercase: true,
      required: [true, 'Please add coupon name.'],
      minlength: [6, 'Coupon must be up to 6 characters'],
      maxlength: [12, 'Coupon must not be more than 12 characters'],
    },
    discount: {
      type: Number,
      unique: true,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
