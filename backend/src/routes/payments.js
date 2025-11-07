const express = require('express');
const multer = require('multer');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/', paymentController.listPayments);
router.post('/', paymentController.createPayment);
router.post('/parse', upload.single('invoice'), paymentController.parseAndCreatePayment);
router.get('/:paymentId', paymentController.getPaymentStatus);
router.post('/:paymentId/execute', paymentController.executePayment);
router.post('/:paymentId/cancel', paymentController.cancelPayment);

module.exports = router;