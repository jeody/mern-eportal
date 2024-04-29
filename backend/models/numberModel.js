const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const numberQuizSchema = mongoose.Schema(
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
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const NumberQuiz = mongoose.model('NumberQuiz', numberQuizSchema);
module.exports = NumberQuiz;
