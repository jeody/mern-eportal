const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const verbalQuizSchema = mongoose.Schema(
  {
    information: {
      type: String,
      required: true,
    },
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
    difficulty: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const VerbalQuiz = mongoose.model('VerbalQuiz', verbalQuizSchema);
module.exports = VerbalQuiz;
