const express = require('express');
const multer = require('multer');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);

router.post('/', paymentController.createPayment);
router.post('/parse', upload.single('invoice'), paymentController.parseAndCreatePayment);
router.get('/:paymentId', paymentController.getPaymentStatus);

module.exports = router;