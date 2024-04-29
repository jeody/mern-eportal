const asyncHandler = require('express-async-handler');
const VerbalQuiz = require('../models/verbalModel');

// Add Verbal Questionaire
const addVerbalQuiz = asyncHandler(async (req, res) => {
  const { set, question, options, correctOption, points, difficultyLevel } =
    req.body;

  const verbal = await VerbalQuiz.find().sort('-createdAt');
  let quizlength;
  if (!verbal) {
    quizlength = 0;
  } else {
    quizlength = verbal.length;
  }
  let level = parseInt(difficultyLevel, 10);
  const difficulty = quizlength + level;

  //   Create new verbal quiz
  const quiz = await VerbalQuiz.create({
    set,
    question,
    options,
    correctOption,
    points,
    difficulty,
  });

  if (quiz) {
    const { _id, set, question, options, correctOption, points, difficulty } =
      quiz;

    res.status(201).json({
      _id,
      set,
      question,
      options,
      correctOption,
      points,
      difficulty,
    });
  } else {
    res.status(400);
    throw new Error('Invalid Quiz data');
  }
  //res.send(question);
});

// Get All Questionaires
const getQuestionaires = asyncHandler(async (req, res) => {
  //const quizzes = await Quiz.find().sort('-createdAt');
  const quizzes = await VerbalQuiz.find({ set: 'a' }).sort('difficulty');
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
  const quizzes = await VerbalQuiz.find({ set: set }).sort('difficulty');
  if (!quizzes) {
    res.status(500);
    throw new Error('Something went wrong');
  }
  res.status(200).json(quizzes);
});

// Delete Questionaire
const deleteQuestionaire = asyncHandler(async (req, res) => {
  const question = VerbalQuiz.findById(req.params.id);

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
  const updatedquizzes = await VerbalQuiz.find({ set: quiz }).sort(
    'difficulty'
  );
  if (!updatedquizzes) {
    res.status(500);
    throw new Error('Something went wrong');
  }
  res.status(200).json(updatedquizzes);
  //res.send(quiz);
});

module.exports = {
  addVerbalQuiz,
  getQuestionaires,
  deleteQuestionaire,
  updateQuestionaire,
  getQuestions,
};
