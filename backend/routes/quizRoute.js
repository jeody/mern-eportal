const express = require('express');
const router = express.Router();
const {
  addQuiz,
  getQuestionaires,
  deleteQuestionaire,
  updateQuestionaire,
} = require('../controllers/quizController');
const {
  protect,
  adminOnly,
  psychologistOnly,
  authorOnly,
} = require('../middleware/authMiddleware');

router.post('/addQuiz', protect, psychologistOnly, addQuiz);
router.get('/getQuestionaires', protect, getQuestionaires);
router.post('/updateQuestionaire', protect, updateQuestionaire);
router.delete(
  '/deleteQuestionaire/:id',
  protect,
  psychologistOnly,
  deleteQuestionaire
);

module.exports = router;
