const asyncHandler = require('express-async-handler');
const Quiz = require('../models/quizModel');

// Add Questionaire
const addQuiz = asyncHandler(async (req, res) => {
  const { set, question, answers } = req.body;

  //   Create new user
  const quiz = await Quiz.create({
    set,
    question,
    answers,
  });

  if (quiz) {
    const { _id, set, question, answers } = quiz;

    res.status(201).json({
      _id,
      set,
      question,
      answers,
    });
  } else {
    res.status(400);
    throw new Error('Invalid Quiz data');
  }
});

// Get All Questionaires
const getQuestionaires = asyncHandler(async (req, res) => {
  //const quizzes = await Quiz.find().sort('-createdAt');
  const quizzes = await Quiz.find({ set: 'a' }).sort('-createdAt');
  if (!quizzes) {
    res.status(500);
    throw new Error('Something went wrong');
  }
  res.status(200).json(quizzes);
});

// Delete Questionaire
const deleteQuestionaire = asyncHandler(async (req, res) => {
  const question = Quiz.findById(req.params.id);

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
  const updatedquizzes = await Quiz.find({ set: quiz }).sort('-createdAt');
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
};
