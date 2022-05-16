const router = require('express').Router();
const { auth } = require('../middleware/auth')
const { CreateOrder,
    getUserOrders,
    getAllorder
    , setDeliverd,
    setPaid,
    getDashbordData } = require('../Controllers/order')

router.get('/me', auth, getUserOrders)
router.get('/', auth, getAllorder)
router.get('/bestseller', auth, getDashbordData)
router.post('/addorder', auth, CreateOrder)
router.post('/orderdeliverd/:id', auth, setDeliverd)
router.post('/orderpaid/:id', auth, setPaid)


module.exports = router;