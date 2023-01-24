const express=require('express');
const cors=require('cors');
const bodyParser = require("body-parser");
const dotenv =require('dotenv')
const path=require('path')

dotenv.config();
const app=express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
    extended:true
}));

app.use('/uploads/Images',express.static(path.join('uploads','Images')))



const ProductRoutes=require('./Routes/product')
const UsersRoutes=require('./Routes/user')
const CategoryRoutes=require('./Routes/category')
const CartRoutes=require('./Routes/cart')
const OrdersRoutes=require('./Routes/order')

app.use('/users',UsersRoutes)
app.use('/products',ProductRoutes)
app.use('/categories',CategoryRoutes)
app.use('/cart',CartRoutes)
app.use('/orders',OrdersRoutes)


const PORT=process.env.PORT|| 5000;
app.listen(PORT,()=>{
    console.log('server is running on port ' ,PORT )
})
