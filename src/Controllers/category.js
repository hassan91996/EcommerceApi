const Category = require('../Models/category')
const Product = require("../Models/product")





function CategoryTree(categories, parent) {
    const catlist = []
    let category

    if (!parent) {
        category = categories.filter(cat => cat.parent == undefined)
    } else {
        category = categories.filter(cat => String(cat.parent) === String(parent._id))
    }
    for (let cat of category) {
        catlist.push({
            _id: cat._id,
            name: cat.name,
            parent: parent,
            children: CategoryTree(categories,cat)
        })
    }

    return catlist

}
 
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        let categoryList = CategoryTree(categories)
        res.status(200).json({ categoryList })

    } catch (error) {
        res.send(error).status(400)
    }
}
// const getCategories = async (req, res) => {
//     try {
//         const categories = await Category.find();
//         let categoryList = CategoryTree(categories)
//         res.status(200).json({ categoryList })

//     } catch (error) {
//         res.send(error).status(400)
//     }
// }


const creatCategory = async (req, res) => {

    const { name, parent } = req.body
    const category = new Category({
        name,
        parent: parent ? parent : null
    })
    try {
        await category.save()
        res.status(201).send({})
    }
    catch (error) {
        res.status(400).send(error)
    }
}


const updateCategory = async (req, res) => {
    const { name, parent } = req.body
    try {
        let category = await Category.findById(req.params.id)
        category.parent = parent ? parent : null
        category.name = name
        await category.save()
        res.status(201).send({})
    }
    catch (error) {
        res.status(400).send(error)
    }
}

const deleteCategory = async (req, res) => {
    try {
        const children = await Category.findOne({ parent: req.params.id })
        if (children) {
            throw new Error('لا يمكن حذف العنصر')
        }
        const products = await Product.findOne({ category: req.params.id })
        if (products) {
            throw new Error('لا يمكن حذف العنصر')
        }
        await Category.findByIdAndDelete(req.params.id)
        res.status(200).send({})
    }
    catch (error) {
        res.status(400).json(error.message)
    }
}
module.exports = {
    creatCategory,
    getCategories,
    updateCategory,
    deleteCategory
}