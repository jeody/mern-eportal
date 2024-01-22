const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
// const Category = require('../models/categoryModel');
// const Brand = require('../models/brandModel');
// const slugify = require('slugify');

// Create Order
const createOrder = asyncHandler(async (req, res) => {
  const {
    orderDate,
    orderTime,
    orderAmount,
    orderStatus,
    cartItems,
    shippingAddress,
    paymentMethod,
    coupon,
  } = req.body;

  // Validation
  if (!cartItems || !orderStatus || !shippingAddress || !paymentMethod) {
    res.status(400);
    throw new Error('Order data missing!!!');
  }

  // Create Order
  await Order.create({
    user: req.user._id,
    orderDate,
    orderTime,
    orderAmount,
    orderStatus,
    cartItems,
    shippingAddress,
    paymentMethod,
    coupon,
  });

  res.status(201).json({ message: 'Order Created' });
});

// Get Orders
const getOrders = asyncHandler(async (req, res) => {
  let orders;

  if (req.user.role === 'admin') {
    orders = await Order.find().sort('-createdAt');
    res.status(200).json(orders);
  }
  orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json(orders);
});

// Get Single Order
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (req.user.role === 'admin') {
    return res.status(200).json(order);
  }

  // match the order with user id
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('User not authorized to view orders.');
  }

  res.status(200).json(order);
});

// Update Order Status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update the order status
  await Order.findByIdAndUpdate(
    { _id: id },
    {
      orderStatus,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({ message: 'Order Status was updated' });
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
};
