const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { generateToken, hashToken } = require('../utils');
var parser = require('ua-parser-js');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const imageValidate = require('../utils/imageValidate');
const Token = require('../models/tokenModel');
const crypto = require('crypto');
const Cryptr = require('cryptr');
const permitValidate = require('../utils/permitValidate');
const { OAuth2Client } = require('google-auth-library');
const { log } = require('console');

const cryptr = new Cryptr(process.env.CRYPTR_KEY);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please fill in all the required fields.');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be up to 6 characters.');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Email already in use.');
  }

  // Get UserAgent
  const ua = parser(req.headers['user-agent']);
  const userAgent = [ua.ua];

  //   Create new user
  const user = await User.create({
    name,
    email,
    password,
    userAgent,
  });

  // Generate Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  res.cookie('token', token, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: 'none',
    secure: true,
  });

  if (user) {
    const {
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      role,
      isVerified,
      permitUploaded,
      formSet,
    } = user;

    res.status(201).json({
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      role,
      isVerified,
      token,
      permitUploaded,
      formSet,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //   Validation
  if (!email || !password) {
    res.status(400);
    throw new Error('Please add email and password');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found, please signup');
  }

  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  if (!passwordIsCorrect) {
    res.status(400);
    throw new Error('Invalid email or password');
  }

  // Trgger 2FA for unknow UserAgent
  const ua = parser(req.headers['user-agent']);
  const thisUserAgent = ua.ua;
  console.log(thisUserAgent);
  const allowedAgent = user.userAgent.includes(thisUserAgent);

  if (!allowedAgent) {
    // Genrate 6 digit code
    const loginCode = Math.floor(100000 + Math.random() * 900000);
    console.log(loginCode);

    // Encrypt login code before saving to DB
    const encryptedLoginCode = cryptr.encrypt(loginCode.toString());

    // Delete Token if it exists in DB
    let userToken = await Token.findOne({ userId: user._id });
    if (userToken) {
      await userToken.deleteOne();
    }

    // Save Tokrn to DB
    await new Token({
      userId: user._id,
      loginToken: encryptedLoginCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * (60 * 1000), // 60mins
    }).save();

    res.status(400);
    throw new Error('New browser or device detected');
  }

  // Generate Token
  const token = generateToken(user._id);

  if (user && passwordIsCorrect) {
    // Send HTTP-only cookie
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: 'none',
      secure: true,
    });

    const {
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      permitUploaded,
      role,
      isVerified,
      formSet,
    } = user;

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      permitUploaded,
      role,
      isVerified,
      token,
      formSet,
    });
  } else {
    res.status(500);
    throw new Error('Something went wrong, please try again');
  }
});

// Send Login Code
const sendLoginCode = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Find Login Code in DB
  let userToken = await Token.findOne({
    userId: user._id,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error('Invalid or Expired token, please login again');
  }

  const loginCode = userToken.loginToken;
  const decryptedLoginCode = cryptr.decrypt(loginCode);

  // Send Login Code
  const subject = 'Login Access Code - AUTH:AFPSAT';
  const send_to = email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = 'noreply@afpsat.com';
  const template = 'loginCode';
  const name = user.name;
  const link = decryptedLoginCode;

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link
    );
    res.status(200).json({ message: `Access code sent to ${email}` });
  } catch (error) {
    res.status(500);
    throw new Error('Email not sent, please try again');
  }
});

// Login With Code
const loginWithCode = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { loginCode } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Find user Login Token
  const userToken = await Token.findOne({
    userId: user.id,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error('Invalid or Expired Token, please login again');
  }

  const decryptedLoginCode = cryptr.decrypt(userToken.loginToken);

  if (loginCode !== decryptedLoginCode) {
    res.status(400);
    throw new Error('Incorrect login code, please try again');
  } else {
    // Register userAgent
    const ua = parser(req.headers['user-agent']);
    const thisUserAgent = ua.ua;
    user.userAgent.push(thisUserAgent);
    await user.save();

    // Generate Token
    const token = generateToken(user._id);

    // Send HTTP-only cookie
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: 'none',
      secure: true,
    });

    const {
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      permitUploaded,
      role,
      isVerified,
      formSet,
    } = user;

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      permitUploaded,
      role,
      isVerified,
      token,
      formSet,
    });
  }
});

// Send Verification Email
const sendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('User already verified');
  }

  // Delete Token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  //   Create Verification Token and Save
  const verificationToken = crypto.randomBytes(32).toString('hex') + user._id;
  console.log(verificationToken);

  // Hash token and save
  const hashedToken = hashToken(verificationToken);
  await new Token({
    userId: user._id,
    verifyToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * (60 * 1000), // 60mins
  }).save();

  // Construct Verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

  // Send Email
  const subject = 'Verify Your Account - AUTH:AFPSAT';
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = 'noreply@afpsat.com';
  const template = 'verifyEmail';
  const name = user.name;
  const link = verificationUrl;

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link
    );
    res.status(200).json({ message: 'Verification Email Sent' });
  } catch (error) {
    res.status(500);
    throw new Error('Email not sent, please try again');
  }
});

// Verify User
const verifyUser = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  const hashedToken = hashToken(verificationToken);

  const userToken = await Token.findOne({
    verifyToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error('Invalid or Expired Token');
  }

  // Find User
  const user = await User.findOne({ _id: userToken.userId });

  if (user.isVerified) {
    res.status(400);
    throw new Error('User is already verified');
  }

  // Now verify user
  user.isVerified = true;
  await user.save();

  res.status(200).json({ message: 'Account Verification Successful' });
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0), // 1 day
    sameSite: 'none',
    secure: true,
  });
  return res.status(200).json({ message: 'Logout successful' });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const {
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      role,
      isVerified,
      address,
      permit,
      permitUploaded,
      permitApproved,
      approveAbstract,
      approvedVerbal,
      approvedNumerical,
      formSet,
    } = user;

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      role,
      isVerified,
      address,
      permit,
      permitUploaded,
      permitApproved,
      approveAbstract,
      approvedVerbal,
      approvedNumerical,
      formSet,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email, phone, photo, role, isVerified, address } = user;

    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.address = req.body.address || address;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      photo: updatedUser.photo,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Delete User
const deleteUser = asyncHandler(async (req, res) => {
  const user = User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.deleteOne();
  res.status(200).json({
    message: 'User deleted successfully',
  });
});

// Get Users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt').select('-password');
  if (!users) {
    res.status(500);
    throw new Error('Something went wrong');
  }
  res.status(200).json(users);
});

// Get Login Status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }

  // Verify token
  const verified = jwt.verify(token, process.env.JWT_SECRET);

  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

const upgradeUser = asyncHandler(async (req, res) => {
  const { role, id } = req.body;

  const user = await User.findById(id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    message: `User role updated to ${role}`,
  });
});

// Send Automated emails
const sendAutomatedEmail = asyncHandler(async (req, res) => {
  const { subject, send_to, reply_to, template, url } = req.body;

  if (!subject || !send_to || !reply_to || !template) {
    res.status(500);
    throw new Error('Missing email parameter');
  }

  // Get user
  const user = await User.findOne({ email: send_to });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const sent_from = process.env.EMAIL_USER;
  const name = user.name;
  const link = `${process.env.FRONTEND_URL}${url}`;

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link
    );
    res.status(200).json({ message: 'Email Sent' });
  } catch (error) {
    res.status(500);
    throw new Error('Email not sent, please try again');
  }
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('No user with this email');
  }

  // Delete Token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  //   Create Verification Token and Save
  const resetToken = crypto.randomBytes(32).toString('hex') + user._id;
  console.log(resetToken);

  // Hash token and save
  const hashedToken = hashToken(resetToken);
  await new Token({
    userId: user._id,
    resetToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * (60 * 1000), // 60mins
  }).save();

  // Construct Reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;

  // Send Email
  const subject = 'Password Reset Request - AUTH:AFPSAT';
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = 'noreply@afpsat.com';
  const template = 'forgotPassword';
  const name = user.name;
  const link = resetUrl;

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link
    );
    res.status(200).json({ message: 'Password Reset Email Sent' });
  } catch (error) {
    res.status(500);
    throw new Error('Email not sent, please try again');
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;
  console.log(resetToken);
  console.log(password);

  const hashedToken = hashToken(resetToken);

  const userToken = await Token.findOne({
    resetToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error('Invalid or Expired Token');
  }

  // Find User
  const user = await User.findOne({ _id: userToken.userId });

  // Now Reset password
  user.password = password;
  await user.save();

  res.status(200).json({ message: 'Password Reset Successful, please login' });
});

// Change Password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, password } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!oldPassword || !password) {
    res.status(400);
    throw new Error('Please enter old and new password');
  }

  // Check if old password is correct
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();

    res
      .status(200)
      .json({ message: 'Password change successful, please re-login' });
  } else {
    res.status(400);
    throw new Error('Old password is incorrect');
  }
});

// Login with Google
const loginWithGoogle = asyncHandler(async (req, res) => {
  const { userToken } = req.body;
  // console.log(userToken);

  const ticket = await client.verifyIdToken({
    idToken: userToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  // console.log(payload);
  const { name, email, picture, sub } = payload;
  const password = Date.now() + sub;

  // check if user exist
  const user = await User.findOne({ email });

  // Get UserAgent
  const ua = parser(req.headers['user-agent']);
  const userAgent = [ua.ua];

  if (!user) {
    // register new user
    const newUser = await User.create({
      name,
      email,
      password,
      photo: picture,
      isVerified: true,
      userAgent,
    });

    if (newUser) {
      // Generate Token
      const token = generateToken(newUser._id);

      // Send HTTP-only cookie
      res.cookie('token', token, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: 'none',
        secure: true,
      });

      const {
        _id,
        name,
        email,
        phone,
        bio,
        photo,
        permitUploaded,
        role,
        isVerified,
      } = newUser;

      res.status(201).json({
        _id,
        name,
        email,
        phone,
        bio,
        photo,
        permitUploaded,
        role,
        isVerified,
        token,
      });
    }
  }

  // User exists, login
  if (user) {
    // Generate Token
    const token = generateToken(user._id);

    // Send HTTP-only cookie
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: 'none',
      secure: true,
    });

    const {
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      permitUploaded,
      role,
      isVerified,
    } = user;

    res.status(201).json({
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      permitUploaded,
      role,
      isVerified,
      token,
    });
  }
});

const photoUpload = async (req, res, next) => {
  try {
    if (!req.files || !!req.files.images === false) {
      return res.status(400).send('No files were uploaded.');
    }

    const validateResult = imageValidate(req.files.images);
    if (validateResult.error) {
      return res.status(400).send(validateResult.error);
    }

    const path = require('path');
    const { v4: uuidv4 } = require('uuid');
    const uploadDirectory = path.resolve(
      __dirname,
      '../../frontend',
      'public',
      'images',
      'photos'
    );

    //console.log(req.query.userId);
    let user = await User.findById(req.query.userId).orFail();

    let imagesTable = [];
    // if (Array.isArray(req.files.images)) {
    //   res.send('You sent' + req.files.images.length + ' images');
    // } else {
    //   res.send('You sent only one image.');
    // }

    if (Array.isArray(req.files.images)) {
      imagesTable = req.files.images;
    } else {
      imagesTable.push(req.files.images);
    }

    for (let image of imagesTable) {
      // console.log(path.extname(image.name));
      // console.log(uuidv4());
      var fileName = uuidv4() + path.extname(image.name);
      var uploadPath = uploadDirectory + '/' + fileName;
      user.photo = '/images/photos/' + fileName;
      image.mv(uploadPath, function (err) {
        if (err) {
          return res.status(500).send(err);
        }
      });
    }
    await user.save();
    return res.send({ message: 'Files uploaded!' });
  } catch (err) {
    next(err);
  }
};

// Get Applicants
const getApplicants = asyncHandler(async (req, res) => {
  const applicants = await User.find({ role: 'applicant' })
    .sort('-createdAt')
    .select('-password');
  if (!applicants) {
    res.status(500);
    throw new Error('Something went wrong');
  }
  res.status(200).json(applicants);
});

// Upload Exam Permit
const permitUpload = async (req, res, next) => {
  try {
    if (!req.files || !!req.files.images === false) {
      return res.status(400).send('No files were uploaded.');
    }

    const validateResult = permitValidate(req.files.images);
    if (validateResult.error) {
      return res.status(400).send(validateResult.error);
    }

    const path = require('path');
    const { v4: uuidv4 } = require('uuid');
    // const uploadDirectory = path.resolve(
    //   __dirname,
    //   '../../frontend',
    //   'public',
    //   'images',
    //   'exampermits'
    // );
    const uploadDirectory = path.resolve(__dirname, '../files');

    //console.log(req.query.userId);
    let user = await User.findById(req.query.userId).orFail();

    let imagesTable = [];
    // if (Array.isArray(req.files.images)) {
    //   res.send('You sent' + req.files.images.length + ' images');
    // } else {
    //   res.send('You sent only one image.');
    // }

    if (Array.isArray(req.files.images)) {
      imagesTable = req.files.images;
    } else {
      imagesTable.push(req.files.images);
    }

    for (let image of imagesTable) {
      // console.log(path.extname(image.name));
      // console.log(uuidv4());
      var fileName = uuidv4() + path.extname(image.name);
      var uploadPath = uploadDirectory + '/' + fileName;
      //user.permit = '/images/exampermits/' + fileName;
      user.permit = 'files/' + fileName;
      user.permitUploaded = true;
      image.mv(uploadPath, function (err) {
        if (err) {
          return res.status(500).send(err);
        }
      });
    }
    await user.save();
    return res.send({ message: 'Files uploaded!' });
  } catch (err) {
    next(err);
  }
};

const getPdfUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const {
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      role,
      isVerified,
      address,
      permit,
      permitUploaded,
    } = user;

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      bio,
      photo,
      role,
      isVerified,
      address,
      permit,
      permitUploaded,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Approve Exam Permit
const approveExamPermit = asyncHandler(async (req, res) => {
  const { proctorId, id } = req.body;
  const user = await User.findById(id);

  if (user) {
    const { pyschometId, permitApproved } = user;

    if (permitApproved === false) {
      user.permitApproved = true;
      user.pyschometId = proctorId;
      await user.save();
      res.send('Exam Permit Approved!');
    } else {
      user.permitApproved = false;
      user.pyschometId = '';
      await user.save();
      res.send('Exam Permit Disapproved!');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Approve Abstract Permit
const approveAbstractExam = asyncHandler(async (req, res) => {
  const { proctorId, id } = req.body;
  const user = await User.findById(id);

  if (user) {
    const { pyschometId, approveAbstract } = user;

    if (approveAbstract === false) {
      user.approveAbstract = true;
      user.pyschometId = proctorId;
      await user.save();
      res.send('Abstract Reasoning Started!');
    } else {
      user.approveAbstract = false;
      user.pyschometId = '';
      await user.save();
      res.send('Abstract Reasoning Stopped!');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Approved Verbal Exam
const approveVerbalExam = asyncHandler(async (req, res) => {
  const { proctorId, id } = req.body;
  const user = await User.findById(id);

  if (user) {
    const { pyschometId, approvedVerbal } = user;

    if (approvedVerbal === false) {
      user.approvedVerbal = true;
      user.pyschometId = proctorId;
      await user.save();
      res.send('Verbal Reasoning Started!');
    } else {
      user.approvedVerbal = false;
      user.pyschometId = '';
      await user.save();
      res.send('Verbal Reasoning Stopped!');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Approve Numerical Exam
const approveNumericalExam = asyncHandler(async (req, res) => {
  const { proctorId, id } = req.body;
  const user = await User.findById(id);

  if (user) {
    const { pyschometId, approvedNumerical } = user;

    if (approvedNumerical === false) {
      user.approvedNumerical = true;
      user.pyschometId = proctorId;
      await user.save();
      res.send('Numerical Reasoning Started!');
    } else {
      user.approvedNumerical = false;
      user.pyschometId = '';
      await user.save();
      res.send('Numerical Reasoning Stopped!');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// openApproveAbstract
const openApproveAbstract = asyncHandler(async (req, res) => {
  const proctorId = req.params.id;

  const users = await User.find({ pyschometId: proctorId });

  if (users) {
    const updateObjectInArray = users.map(async () => {
      return {
        approvedAbstract: true,
      };
    });
    //await user.save();
    console.log(updateObjectInArray);
  } else {
    res.status(500);
    throw new Error('Something went wrong');
  }
  res.status(200).json(users);
});

// Change Form Set
const changeFormSet = asyncHandler(async (req, res) => {
  const { proctorId, id, formSet } = req.body;
  const user = await User.findById(id);

  if (user) {
    if (formSet === 'a') {
      user.formSet = 'b';
      user.pyschometId = proctorId;
      await user.save();
      res.send('Exam change to Form B');
    } else {
      if (formSet === 'b') {
        user.formSet = 'c';
        user.pyschometId = proctorId;
        await user.save();
        res.send('Exam change to Form C');
      } else {
        if (formSet === 'c') {
          user.formSet = 'd';
          user.pyschometId = proctorId;
          await user.save();
          res.send('Exam change to Form C');
        } else {
          user.formSet = 'a';
          user.pyschometId = proctorId;
          await user.save();
          res.send('Exam change to Form A');
        }
      }
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// saveUserScore
const saveUserScore = asyncHandler(async (req, res) => {
  const { id, totalQuestionsAnswered, totalCorrectAnswer, numberPercentage } =
    req.body;
  const user = await User.findById(id);

  if (user) {
    user.examResults.push({
      numberItems: totalQuestionsAnswered,
      numberScore: totalCorrectAnswer,
      numberPercent: numberPercentage,
      examId: id,
    });
    user.approvedNumerical = false;
    await user.save();
    res.send('User valid!');
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
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
  getPdfUser,
  approveExamPermit,
  approveAbstractExam,
  approveVerbalExam,
  approveNumericalExam,
  openApproveAbstract,
  changeFormSet,
  saveUserScore,
};
