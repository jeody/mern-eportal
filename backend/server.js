//const path = require('path');
require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const categoryRoute = require('./routes/categoryRoute');
const brandRoute = require('./routes/brandRoute');
const couponRoute = require('./routes/couponRoute');
const orderRoute = require('./routes/orderRoute');
const quizRoute = require('./routes/quizRoute');
const pdfRoute = require('./routes/pdfRoute');
//const uploadRoute = require('./routes/uploadRoute');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middlewares
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://authz-app-nu.vercel.app'],
    credentials: true,
  })
);
app.listen(5000, () => {
  console.log(`Server is running on ${PORT}`);
});

//const __dirname = path.resolve(); // Set __dirname to current directory
//app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/files', express.static('files'));

// Routes
app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/category', categoryRoute);
app.use('/api/brand', brandRoute);
app.use('/api/coupon', couponRoute);
app.use('/api/order', orderRoute);
app.use('/api/quiz', quizRoute);
app.use('/api/pdfUpload', pdfRoute);
//app.use('/api/upload', uploadRoute);

app.get('/', (req, res) => {
  res.send('Home Page');
});

app.get('/api/uploadfiles', async (req, res) => {
  res.send('Success!!!');
});

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Server running on ${PORT}`);
//     });
//   })
//   .catch((err) => console.log(err));

//Connect to Local MongoDB
mongoose
  .connect('mongodb://localhost:27017/mern-afpsat')
  .then(() => {
    console.log(`MongoDb Server running on ${PORT}`);
  })
  .catch(() => {
    console.log('mongodb failed');
  });
