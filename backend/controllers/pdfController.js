const asyncHandler = require('express-async-handler');
const PdfDetails = require('../models/pdfModel');
//const imageValidate = require('../utils/imageValidate');

// Get all PDFs
const getPdf = asyncHandler(async (req, res) => {
  // const pdfs = await PdfDetails.find().sort('-createdAt');
  // res.status(200).json(pdfs);
  res.send('get my new pdf');
});

const uploadFiles = asyncHandler(async (req, res) => {
  res.send('upload new pdf');
});

module.exports = {
  getPdf,
  uploadFiles,
};
