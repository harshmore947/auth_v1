const express = require('express');
const { signupUser, loginUser } = require('./controller/user-controller');
const { profilePost } = require('./controller/profile-controller');
const router = express.Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/profile', profilePost);

module.exports = {
    router
}