const asyncHandler = require('express-async-handler');
const Category = require('../models/categoryModel');
const slugify = require('slugify');
// const mongoose = require('mongoose');
// const { ObjectId } = mongoose.Schema;
// const { fileSizeFormatter } = require("../utils/fileUpload");
// const cloudinary = require("cloudinary").v2;

// Create Category
const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please fill in category name');
  }

  const categoryExists = await Category.findOne({ name });

  if (categoryExists) {
    res.status(400);
    throw new Error('Category name already exist.');
  }

  const category = await Category.create({
    name,
    slug: slugify(name),
  });

  res.status(201).json(category);
});

// Get Categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('-createdAt');
  res.status(200).json(categories);
});

// Delete Category
const deleteCategory = asyncHandler(async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const category = await Category.findOneAndDelete({ slug });

  // if category doesnt exist
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.status(200).json({ message: 'Category deleted.' });
});

module.exports = {
  createCategory,
  getCategories,
  deleteCategory,
};
