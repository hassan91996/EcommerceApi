const router = require('express').Router();
const { check } = require("express-validator")
const { auth } = require('../middleware/auth')
const { singup,
    login,
    adminlogin,
    updateUser, deleteuser,
    fetchUsers,
    userstats, 
    fetchUser,
    likedproduct,
    getlikedProducts,
    allowToRate,updatePassword } = require('../Controllers/user')

router.post('/singup',
    [check('username')
        .notEmpty().
        isLength({ min: 2 }),
    check('email')
        .normalizeEmail()
        .isEmail(),
    check('password')
        .isLength({ min: 8 })
    ]
    , singup)
router.post('/login',
    [check('email')
        .normalizeEmail()
        .isEmail(),
    check('password')
        .isLength({ min: 8 })], login)
router.post('/adminlogin',
    [check('email')
        .normalizeEmail()
        .isEmail(),
    check('password')
        .isLength({ min: 8 })], adminlogin)

router.get('/me', auth, fetchUser)
router.get('/me/liked', auth, getlikedProducts)
router.get('/me/allowtorate', auth, allowToRate)
router.post('/likeproduct/:id', auth, likedproduct)

router.put('/updateuser/:id', auth, updateUser)
router.put('/changepassword', auth, updatePassword)






module.exports = router;