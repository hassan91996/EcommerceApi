const Product = require('../Models/product')
const Category = require('../Models/category')
const Review = require('../Models/reviews')
const User = require('../Models/user')
const Order = require('../Models/order')
const path = require('path')
const ObjectId = require('mongodb').ObjectId;
const cloudinary = require('../utils/cloudinary')




const getProducts = async (req, res) => {
    try {
        const category = req.query.category && ObjectId(req.query.category);
        const name = req.query.productname && req.query.productname
        const page = req.query.page && Number(req.query.page)
        const pagesize = req.query.pagesize && Number(req.query.pagesize)
        const categories = []
        if (category) {
            categories.push(category)
            const children = await Category.aggregate([
                { $match: { _id: category } },
                {
                    $graphLookup: {
                        from: "categories",
                        startWith: "$_id",
                        connectFromField: "_id",
                        connectToField: "parent",
                        as: "children"
                    }
                }
            ])
            children.length > 0 && children[0].children.map(child => {
                categories.push(child._id)
            })
        }


        const categoryFilter = categories.length > 0 ? { category: { $in: categories } } : {}
        const nameFilter = name ? { name: { $regex: name, $options: 'si' } } : {}

        const products = await Product.find({
            ...categoryFilter,
            ...nameFilter
        }).skip(pagesize * (page - 1))
            .limit(pagesize);
        const count = await Product.find({
            ...categoryFilter,
            ...nameFilter
        }).count()
        res.status(200).json({ products, count })

    } catch (error) {
        res.status(400).send(error)
    }
}

const getProductAdmin = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate({ path: "category", select: " name" })
        res.status(200).json({ product })
    } catch (error) {
        res.send(error).status(400)
    }
}


const addProduct = async (req, res) => {
    const Imges = []
    try {
        for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path)
            Imges.push({
                url: result.secure_url,
                id: result.public_id
            })
        }
        if (Imges.length === 0) {
            throw new Error("images are required")
        }

        const { name, price, brand, sizes, quantity, category, color } = req.body;
        const Prodname = await Product.findOne({ name: name })
        if (Prodname) {
            throw new Error('اسم المنتج موجود بالفعل')
        }
        if (!sizes && !quantity) {
            throw new Error('الكمية مطلوبة')
        }

        let productSizes = sizes && JSON.parse(sizes)
        const product = new Product({
            name,
            price,
            brand,
            sizes: productSizes,
            quantity,
            category,
            owner: req.user._id,
            images: Imges,
            color
        });
        await product.save()
        res.status(201).send(product)
    }
    catch (error) {
        for (const img of Imges) {
            await cloudinary.uploader.destroy(img.id)
        }
        res.status(400).json(error.message)
    }
}

const updateProduct = async (req, res) => {
    try {

        const Prodname = await Product.findOne({ name: req.body.name, _id: { $ne: req.params.id } })
        if (Prodname) throw new Error(`اسم المنتج موجود بالفعل`)
        if (req.body.sizes && req.body.sizes.length === 0 && !req.body.quantity) throw new Error('الكمية مطلوبة')
        const product = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true })
        await product.save()
        res.status(201).json({})
    }
    catch (error) {
        res.status(400).json(error.message)
    }
}
const updateProductImages = async (req, res) => {
    const Imges = []
    try {
        if (!req.files) {
            throw new Error()
        }
        const product = await Product.findById(req.params.id)
        for (const img of product.images) {
            await cloudinary.uploader.destroy(img.id)
        }
        for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path)
            Imges.push({
                url: result.secure_url,
                id: result.public_id
            })
        }
        product.images = Imges
        await product.save()
        res.status(200).send({})
    }
    catch (error) {
        for (const img of product.images) {
            await cloudinary.uploader.destroy(img.id)
        }
        res.status(400).send(error)
    }
}

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        for (const img of product.images) {
            await cloudinary.uploader.destroy(img.id)
        }
        await Product.findByIdAndDelete(req.params.id)
        res.status(200).send('تم الحذف بنجاح')
    } catch (error) {
        res.status(400).send(error)
    }
}
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate({ path: "category", select: " name" })
        const Rating = await Review.aggregate([
            { $match: { productId: ObjectId(req.params.id) } },
            {
                $group: {
                    _id: "$rating",
                    users: { $count: {} }
                }
            }
        ])

        const comments = await Review.find({ productId: req.params.id, comment: { $exists: true } })
            .populate('userId', 'username')
            .select("comment  createdAt rating")


        const patern = product.name.substring(0, product.name.lastIndexOf("-"))
        let  Products = []
        if (patern) {
            Products = await Product.find({
                name: { $regex: patern },
                brand: product.brand,
                _id: { $ne: product._id }
            })
                .select('images name')
        }

        const similarProducts = []
        Products && Products.map(prod => {
            similarProducts.push({
                _id: prod._id,
                img: prod.images[0],
                name: prod.name,
                category: prod.category
            })
        })

        res.status(200).json({ product, Rating, comments, similarProducts })
    } catch (error) {
        res.status(400).send(error)
    }
}





const getCategoryProducts = async (req, res) => {
    try {
        const qCategory = ObjectId(req.query.category);
        const size = req.query.size && req.query.size
        const page = req.query.page && Number(req.query.page)
        const pagesize = req.query.pagesize && Number(req.query.pagesize)
        const min = req.query.min && Number(req.query.min)
        const max = req.query.max && Number(req.query.max)
        const brands = req.query.brands && req.query.brands
        const colors = req.query.colors && req.query.colors
        const sort = req.query.sort || '';
        const rating = req.query.rate && Number(req.query.rate) !== 0 ? Number(req.query.rate) : 0;
        const offer = req.query.offer && Number(req.query.offer) !== 0 ? Number(req.query.offer) : 0;
        const priceFilter = min && max ? { price: { $gte: min, $lte: max } } : {};
        const colorFilter = colors ? { color: { $in: colors } } : {};
        const brandFilter = brands ? { brand: { $in: brands } } : {};
        const sizeFilter = size ? { "sizes.size": { $in: size } } : {};
        const ratingFilter = rating ? { rating: { $gte: rating } } : {};
        const offerFilter = offer ? { offer: { $gte: offer } } : {};
        const sortOrder =
            sort === 'priceAsc'
                ? { price: 1 }
                : sort === 'priceDesc'
                    ? { price: -1 }
                    : sort === 'toprated'
                        ? { rating: -1 }
                        : { createdAt: -1 };

        const categories = [qCategory]
        const children = await Category.aggregate([
            { $match: { _id: qCategory } },
            {
                $graphLookup: {
                    from: "categories",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parent",
                    as: "children"
                }
            }
        ])
        children.length > 0 && children[0].children.map(child => {
            categories.push(child._id)
        })
        const products = await Product.find({
            category: { $in: categories },
            ...priceFilter,
            ...colorFilter,
            ...brandFilter,
            ...sizeFilter,
            ...ratingFilter,
            ...offerFilter
        }).sort(sortOrder)
            .skip(pagesize * (page - 1))
            .limit(pagesize);
        const count = await Product.count({
            category: { $in: categories },
            ...priceFilter,
            ...colorFilter,
            ...brandFilter,
            ...sizeFilter,
            ...ratingFilter,
            ...offerFilter
        })
        const minmax = await Product.aggregate([
            {
                $match: {
                    category: { $in: categories },
                    ...colorFilter,
                    ...brandFilter,
                    ...sizeFilter,
                    ...ratingFilter,
                    ...offerFilter

                }
            },
            {
                $group:
                {
                    "_id": null,
                    min: { $min: "$price" },
                    max: { $max: "$price" }
                }
            }
        ])

        const minmaxprice = minmax.length > 0 ? {
            min: minmax[0].min,
            max: minmax[0].max
        } : {}
        const maxRate = await Product.aggregate([
            {
                $match: {
                    category: { $in: categories },
                    ...colorFilter,
                    ...brandFilter,
                    ...sizeFilter,
                    ...offerFilter,
                    ...priceFilter

                }
            },
            {
                $group:
                {
                    "_id": null,
                    max: { $max: "$rating" },
                }
            }
        ])
        const maxrate = maxRate.length > 0 ? {
            max: maxRate[0].max
        } : {}
        const maxOffer = await Product.aggregate([
            {
                $match: {
                    category: { $in: categories },
                    ...colorFilter,
                    ...brandFilter,
                    ...sizeFilter,
                    ...ratingFilter,
                    ...priceFilter

                }
            },
            {
                $group:
                {
                    "_id": null,
                    max: { $max: "$offer" }
                }
            }
        ])

        const maxoffer = maxOffer.length > 0 ? {
            max: maxOffer[0].max
        } : {}

        const colorsArray = await Product.distinct("color", {
            category: { $in: categories },
            ...priceFilter,
            ...brandFilter,
            ...sizeFilter,
            ...ratingFilter,
            ...offerFilter

        })
        const BrandsArray = await Product.distinct("brand", {
            category: { $in: categories },
            ...priceFilter,
            ...colorFilter,
            ...sizeFilter,
            ...ratingFilter,
            ...offerFilter

        })
        const sizesArray = await Product.distinct("sizes.size", {
            category: { $in: categories },
            ...priceFilter,
            ...colorFilter,
            ...brandFilter,
            ...ratingFilter,
            ...offerFilter
        })

        res.status(200).json({ products, count, colors: colorsArray, Brands: BrandsArray, minmaxprice, sizes: sizesArray, maxrate, maxoffer })

    } catch (error) {
        res.status(400).json({ error })

    }
}




const RatingProduct = async (req, res) => {
    try {
        const review = await Review.findOne({ userId: req.user._id, productId: req.params.id });
        if (review) {
            return res.send("you are already rate this product")
        }
        let comment
        if (req.body.comment && req.body.comment.trim().length > 0) {
            comment = req.body.comment
        }
        const newreview = new Review({
            userId: req.user._id,
            productId: req.params.id,
            rating: Number(req.body.rate),
            comment,
        });

        await newreview.save()

        const ratingdata = await Review.aggregate([
            { $match: { productId: ObjectId(req.params.id) } },
            {
                $group:
                {
                    _id: "",
                    totalcount: { $count: {} },
                    totalrate: { $sum: "$rating" }
                },
            }]
        )
        res.status(200).json({ newreview })
        await Product.findByIdAndUpdate(req.params.id, {
            $set: {
                numReviews: ratingdata[0].totalcount,
                rating: (ratingdata[0].totalrate / ratingdata[0].totalcount).toFixed(1)
            },
        })
    } catch (error) {
        res.status(404).json(error.message)

    }
}
const searchsuggestions = async (req, res) => {
    try {
        const suggestData = await Product.find({ name: { $regex: req.query.search, $options: 'si' } }).select('name').limit(5)
        res.status(200).json(suggestData)
    } catch (error) {
        res.status(404).send({ message: 'Product Not Found' });

    }
}
const getsearchProducts = async (req, res) => {
    try {
        const products = await Product.find({ name: { $regex: req.query.search, $options: 'si' } })
        res.status(200).json({ products })
    } catch (error) {
        res.status(404).send({ message: 'Product Not Found' });

    }
}

const getRecommended = async (req, res) => {
    try {
        const bestoffers = await Product.find({
            offer: { $gt: 0 }
        }).sort({ offer: - 1 }).limit(10)
        const bestsellers = []
        const productsSelles = await Order.aggregate([
            {
                $match: {
                    isDelivered: true,
                    isPaid: true
                }
            },
            {
                $unwind: "$orderItems"
            },
            {
                $group:
                {
                    _id: "$orderItems.product",
                    sellerCount: { $sum: '$orderItems.quantity' },
                }
            }
        ]
        ).sort({ sellerCount: -1 })
            .limit(10)

        for (let prod of productsSelles) {
            const product = await Product.findById(prod._id)
                .populate({ path: "category", select: " name" })

            bestsellers.push({
                ...product._doc,
            })
        }

        res.status(200).json({ bestoffers, bestsellers })
    } catch (error) {
        res.status(404).send({ message: 'Product Not Found' });
    }
}

const addoffer = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { offer: req.body.value })
        res.status(201).json({ offer: req.body.value })
    }
    catch (error) {
        res.send(error).status(400)
    }
}




module.exports = {
    addProduct,
    getProduct,
    getProducts,
    getRecommended,
    updateProduct,
    deleteProduct,
    updateProductImages,
    RatingProduct,
    searchsuggestions,
    getCategoryProducts,
    getsearchProducts,
    addoffer,
    getProductAdmin
}

