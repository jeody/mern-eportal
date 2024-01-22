const mongoose = require('mongoose');

const PdfDetailsSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    pdf: {
      type: String,
      trim: true,
      unique: true,
    },
    title: {
      type: String,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const PdfDetail = mongoose.model('PdfDetail', PdfDetailsSchema);
module.exports = PdfDetail;
