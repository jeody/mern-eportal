const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    role: {
      type: String,
      required: [true],
      default: 'applicant',
      enum: [
        'applicant',
        'psychometrician',
        'psychologist',
        'admin',
        'suspended',
      ],
    },
    photo: {
      type: String,
      required: [true, 'Please add a photo'],
      default: '/images/profile.jpg',
    },
    phone: {
      type: String,
      default: '+234',
    },
    address: {
      type: Object,
      // address, state, country
    },
    wishlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    balance: {
      type: Number,
      default: 0,
    },
    cartItems: {
      type: [Object],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
      // required: true,
    },
    bio: {
      type: String,
      default: 'bio',
    },
    userAgent: {
      type: Array,
      required: true,
      default: [],
    },
    permit: {
      type: String,
      default: '',
    },
    permitUploaded: {
      type: Boolean,
      default: false,
    },
    permitApproved: {
      type: Boolean,
      default: false,
    },
    approveAbstract: {
      type: Boolean,
      default: false,
    },
    approvedVerbal: {
      type: Boolean,
      default: false,
    },
    approvedNumerical: {
      type: Boolean,
      default: false,
    },
    pyschometId: {
      type: String,
    },
    formSet: {
      type: String,
      default: 'a',
    },
    itemsNumber: {
      type: Number,
      default: 0,
    },
    scoreNumber: {
      type: Number,
      default: 0,
    },
    percentNumber: {
      type: Number,
      default: 0,
    },
    examResults: {
      type: [Object],
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

// Encrypt password before saving to DB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
