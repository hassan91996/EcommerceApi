const router=require('express').Router();
const {auth}=require('../middleware/auth')
const {addItemToCart,getCartItems,removeCartItem,reduceQuantity}=require('../Controllers/cart')


router.post('/addtocart/:id',auth,addItemToCart)
router.get('/find',auth,getCartItems)
router.delete('/delete/:id',auth,removeCartItem)
router.delete('/reduce/:id',auth,reduceQuantity)


module.exports=router;