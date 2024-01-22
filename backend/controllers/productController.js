const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const imageValidate = require('../utils/imageValidate');
// const { fileSizeFormatter } = require("../utils/fileUpload");
// const cloudinary = require("cloudinary").v2;

// Create Prouct
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    category,
    brand,
    quantity,
    price,
    description,
    image,
    regularPrice,
    color,
  } = req.body;

  //   Validation
  if (!name || !category || !brand || !quantity || !price || !description) {
    res.status(400);
    throw new Error('Please fill in all fields');
  }

  // Create Product
  const product = await Product.create({
    // user: req.user.id,
    name,
    sku,
    category,
    quantity,
    brand,
    price,
    description,
    image,
    regularPrice,
    color,
  });

  res.status(201).json(product);
});

// Get all Products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort('-createdAt');
  res.status(200).json(products);
});

// Get single product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json(product);
});

// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // await product.remove();
  await Product.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Product deleted.' });
});

// Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    brand,
    quantity,
    price,
    description,
    image,
    regularPrice,
    color,
  } = req.body;

  const { id } = req.params;
  const product = await Product.findById(id);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Update Product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      brand,
      quantity,
      price,
      description,
      image,
      regularPrice,
      color,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);
});

// Review Product
const reviewProduct = asyncHandler(async (req, res) => {
  // star, review
  const { star, review, reviewDate } = req.body;
  const { id } = req.params;

  // validation
  if (star < 1 || !review) {
    res.status(400);
    throw new Error('Please add star and review');
  }

  const product = await Product.findById(id);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Update Product
  product.ratings.push({
    star,
    review,
    reviewDate,
    name: req.user.name,
    userID: req.user._id,
  });
  product.save();

  res.status(200).json({ message: 'Product review added.' });
});

// Delete Product Review
const deleteReview = asyncHandler(async (req, res) => {
  const { userID } = req.body;

  const product = await Product.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const newRatings = product.ratings.filter((rating) => {
    return rating.userID.toString() !== userID.toString();
  });
  console.log(newRatings);
  product.ratings = newRatings;
  product.save();
  res.status(200).json({ message: 'Product review deleted!' });
});

// Update/Edit product Review
const updateReview = asyncHandler(async (req, res) => {
  const { star, review, reviewDate, userID } = req.body;
  const { id } = req.params;

  // validation
  if (star < 1 || !review) {
    res.status(400);
    throw new Error('Please add star and review');
  }

  const product = await Product.findById(id);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  // Match user to review
  if (req.user._id.toString() !== userID) {
    res.status(401);
    throw new Error('User not authorized');
  }

  // Update Product review
  const updatedReview = await Product.findOneAndUpdate(
    {
      _id: product._id,
      'ratings.userID': new mongoose.Types.ObjectId(userID),
    },
    {
      $set: {
        'ratings.$.star': Number(star),
        'ratings.$.review': review,
        'ratings.$.reviewDate': reviewDate,
      },
    }
  );

  if (updatedReview) {
    res.status(200).json({ message: 'Product review updated.' });
  } else {
    res.status(400).json({ message: 'Product review NOT updated.' });
  }
});

const adminUpload = async (req, res, next) => {
  try {
    if (!req.files || !!req.files.images === false) {
      return res.status(400).send('No files were uploaded.');
    }

    const validateResult = imageValidate(req.files.images);
    if (validateResult.error) {
      return res.status(400).send(validateResult.error);
    }

    const path = require('path');
    const { v4: uuidv4 } = require('uuid');
    const uploadDirectory = path.resolve(
      __dirname,
      '../../frontend',
      'public',
      'images',
      'products'
    );

    //console.log(req.query.productId);
    let product = await Product.findById(req.query.productId).orFail();

    let imagesTable = [];
    if (Array.isArray(req.files.images)) {
      imagesTable = req.files.images;
    } else {
      imagesTable.push(req.files.images);
    }

    for (let image of imagesTable) {
      // console.log(path.extname(image.name));
      // console.log(uuidv4());
      var fileName = uuidv4() + path.extname(image.name);
      var uploadPath = uploadDirectory + '/' + fileName;
      //product.images.push({ path: '/images/products/' + fileName });
      product.image.push('/images/products/' + fileName);
      image.mv(uploadPath, function (err) {
        if (err) {
          return res.status(500).send(err);
        }
      });
    }
    await product.save();
    return res.send('Files uploaded!');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  reviewProduct,
  deleteReview,
  updateReview,
  adminUpload,
};
