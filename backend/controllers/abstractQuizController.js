const asyncHandler = require('express-async-handler');
const AbstractQuiz = require('../models/abstractModel');

// Add Questionaire
const addQuiz = asyncHandler(async (req, res) => {
  const { set, question, options, correctOption, points } = req.body;

  //   Create new user
  const quiz = await AbstractQuiz.create({
    set,
    question,
    options,
    correctOption,
  });

  if (quiz) {
    const { _id, set, question, options, correctOption } = quiz;

    res.status(201).json({
      _id,
      set,
      question,
      options,
      correctOption,
    });
  } else {
    res.status(400);
    throw new Error('Invalid Quiz data');
  }
});

// Get All Questionaires
const getQuestionaires = asyncHandler(async (req, res) => {
  //const quizzes = await Quiz.find().sort('-createdAt');
  const quizzes = await AbstractQuiz.find({ set: 'a' }).sort('-createdAt');
  if (!quizzes) {
    res.status(500);
    throw new Error('Something went wrong');
  }
  res.status(200).json(quizzes);
});

// Get All Questions
const getQuestions = asyncHandler(async (req, res) => {
  //const quizzes = await Quiz.find().sort('-createdAt');
  const set = req.params.set.toLowerCase();

  //const slug = req.params.slug.toLowerCase();
  const quizzes = await AbstractQuiz.find({ set: set }).sort('-createdAt');
  if (!quizzes) {
    res.status(500);
    throw new Error('Something went wrong');
  }

  const shuffledQuestions = quizzes.sort(() => Math.random() - 0.5);
  res.status(200).json(shuffledQuestions);
});

// Delete Questionaire
const deleteQuestionaire = asyncHandler(async (req, res) => {
  const question = AbstractQuiz.findById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error('Questionaire not found');
  }

  await question.deleteOne();
  res.status(200).json({
    message: 'Questionaire deleted successfully',
  });
});

// Get slected Questionaires
const updateQuestionaire = asyncHandler(async (req, res) => {
  const { quiz } = req.body;
  //const quizzes = await Quiz.find().sort('-createdAt');
  const updatedquizzes = await AbstractQuiz.find({ set: quiz }).sort(
    '-createdAt'
  );
  if (!updatedquizzes) {
    res.status(500);
    throw new Error('Something went wrong');
  }
  res.status(200).json(updatedquizzes);
  //res.send(quiz);
});

module.exports = {
  addQuiz,
  getQuestionaires,
  deleteQuestionaire,
  updateQuestionaire,
  getQuestions,
};
