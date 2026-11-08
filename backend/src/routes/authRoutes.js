const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.post('/register', authController.registerCustomer);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/users', verifyToken, verifyAdmin, authController.getAllUsers);
router.put('/users/:id', verifyToken, verifyAdmin, authController.updateUserRoleStatus);

module.exports = router;
