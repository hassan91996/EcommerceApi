const router = require('express').Router();
const { addProduct,
    getProducts,
    deleteProduct,
    getProduct,
    updateProduct,
    getRecommended,
    RatingProduct,
    updateProductImages,
    searchsuggestions,
    getsearchProducts,
    getCategoryProducts,
    getProductAdmin,
    addoffer } = require('../Controllers/product')

const { auth, authadmin } = require('../middleware/auth')

const fileUpload = require('../middleware/productImages');


router.post('/addproduct', authadmin,
    fileUpload.array('images', 6), addProduct)
router.get('/category', getCategoryProducts)
router.get('/search', getsearchProducts)
router.get('/suggest', searchsuggestions)
router.get('/homegroups', getRecommended)
router.get('/:id', getProduct)
router.get('/admin/:id', authadmin, getProductAdmin)
router.get('/', authadmin, getProducts)


router.post('/rateproduct/:id', auth, RatingProduct)
router.post('/addoffer/:id', authadmin, addoffer)


router.put('/updateproduct/:id', authadmin, updateProduct)
router.post('/updateimages/:id', authadmin,
    fileUpload.array('images', 6),
    updateProductImages)
router.delete('/deleteproduct/:id', authadmin, deleteProduct)


module.exports = router