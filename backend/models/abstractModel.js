const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const abstractQuizSchema = mongoose.Schema(
  {
    set: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    options: {
      type: Object,
      // text, correct
    },
    correctOption: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const AbstractQuiz = mongoose.model('AbstractQuiz', abstractQuizSchema);
module.exports = AbstractQuiz;
