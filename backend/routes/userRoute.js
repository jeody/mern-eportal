const express = require('express');
const router = express.Router();
const {
  protect,
  adminOnly,
  authorOnly,
  psychometricianOnly,
} = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUser,
  deleteUser,
  getUsers,
  loginStatus,
  upgradeUser,
  sendAutomatedEmail,
  sendVerificationEmail,
  verifyUser,
  forgotPassword,
  resetPassword,
  changePassword,
  sendLoginCode,
  loginWithCode,
  loginWithGoogle,
  photoUpload,
  getApplicants,
  permitUpload,
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/getUser', protect, getUser);
router.patch('/updateUser', protect, updateUser);
router.post('/upload', protect, photoUpload);
router.post('/permitUpload', protect, permitUpload);

router.delete('/:id', protect, adminOnly, deleteUser);
router.get('/getUsers', protect, adminOnly, getUsers);
router.get('/getApplicants', protect, psychometricianOnly, getApplicants);
router.get('/loginStatus', loginStatus);
router.post('/upgradeUser', protect, adminOnly, upgradeUser);
router.post('/sendAutomatedEmail', protect, sendAutomatedEmail);

router.post('/sendVerificationEmail', protect, sendVerificationEmail);
router.patch('/verifyUser/:verificationToken', verifyUser);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:resetToken', resetPassword);
router.patch('/changePassword', protect, changePassword);

router.post('/sendLoginCode/:email', sendLoginCode);
router.post('/loginWithCode/:email', loginWithCode);

router.post('/google/callback', loginWithGoogle);

module.exports = router;
