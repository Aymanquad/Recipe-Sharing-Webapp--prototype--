const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');


router.get('/signup',authController.getSignUp);

router.post('/signup',authController.postSignUp);

router.get('/login',authController.getLogin);

router.post('/login',authController.postLogin);

router.post('/logout',authController.postLogout);

router.get('/reset',authController.getresetPasswordPage);

router.get('/reset/:token',authController.getNewPasswordPage);

router.post('/reset',authController.postresetPasswordPage);

router.post('/new-password',authController.postNewPasswordPage);


module.exports = router; 