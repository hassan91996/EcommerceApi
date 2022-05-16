const router=require('express').Router();
const {creatCategory,getCategories,updateCategory,deleteCategory}=require('../Controllers/category')
const {authadmin} =require('../middleware/auth')


router.get('/',getCategories)
router.post('/addcategory',authadmin,creatCategory)
router.put('/updatecategory/:id',authadmin,updateCategory)
router.delete('/deletecategory/:id',authadmin,deleteCategory)


module.exports=router;