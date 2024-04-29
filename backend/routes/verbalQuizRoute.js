const express = require('express');
const router = express.Router();
const {
  addVerbalQuiz,
  getQuestionaires,
  deleteQuestionaire,
  updateQuestionaire,
  getQuestions,
} = require('../controllers/verbalQuizController');
const {
  protect,
  adminOnly,
  psychologistOnly,
  authorOnly,
} = require('../middleware/authMiddleware');

router.post('/addVerbalQuiz', protect, psychologistOnly, addVerbalQuiz);
router.get('/getQuestionaires', protect, getQuestionaires);
router.get('/getQuestions/:set', getQuestions);
router.post('/updateQuestionaire', protect, updateQuestionaire);
router.delete(
  '/deleteQuestionaire/:id',
  protect,
  psychologistOnly,
  deleteQuestionaire
);

module.exports = router;
