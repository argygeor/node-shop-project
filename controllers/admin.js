// Database
// const getDB = require('../util/database').getDB;

// Validator
const { validationResult } = require('express-validator/check');

// Model
const Product = require('../models/product');

// Files
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
   res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: false,
      errorMessage: null,
      validationErrors: []
   });
}

exports.postAddProduct = (req, res, next) => {
   const title = req.body.title;
   const image = req.file;
   const price = req.body.price;
   const description = req.body.description;

   if (!image) {
      return res.status(422).render('admin/edit-product', {
         pageTitle: 'Add Product',
         path: '/admin/add-product',
         editing: false,
         hasError: true,
         product: {
            title: title,
            price: price,
            description: description
         },
         errorMessage: 'Attached file is not an image.',
         validationErrors: []
      });
   }

   const errors = validationResult(req);

   if (!errors.isEmpty()) {
     return res.status(422).render('admin/edit-product', {
         pageTitle: 'Add Product',
         path: '/admin/add-product',
         editing: false,
         hasError: true,
         product: {
            title: title,
            price: price,
            description: description
         },
         errorMessage: errors.array()[0].msg,
         validationErrors: errors.array()
      });
   }

   const imageUrl = image.path;

   const product = new Product({
      title: title,
      price: price,
      description: description,
      imageUrl: imageUrl,
      userId: req.user // mongoose will automatically pick the user id (req.user._id)
   });
   product.save()
      .then(result => {
         res.redirect('/admin/products');
      })
      .catch(err => {
         const error = new Error(err);
         error.httpStatusCode = 500;
         return next(error);
      });
}

exports.getEditProduct = (req, res, next) => {
   const editMode = req.query.edit;
   if (!editMode) {
      return res.redirect('/');
   }
   const prodID = req.params.productID;
   Product.findById(prodID)
      .then(product => {
         if (!product) {
            res.redirect('/');
         }
         res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            hasError: false,
            errorMessage: null,
            validationErrors: []
         });
      })
      .catch(err => {
         const error = new Error(err);
         error.httpStatusCode = 500;
         return next(error);
      });
}

exports.postEditProduct = (req, res, next) => {
   const prodID = req.body.productID;
   const updatedTitle = req.body.title;
   const updatedPrice = req.body.price;
   const image = req.file;
   const updatedDescription = req.body.description;

   const errors = validationResult(req);

   if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
         pageTitle: 'Edit Product',
         path: '/admin/edit-product',
         editing: true,
         hasError: true,
         product: {
            title: updatedTitle,
            price: updatedPrice,
            description: updatedDescription,
            _id: prodID
         },
         errorMessage: errors.array()[0].msg,
         validationErrors: errors.array()
      });
   }

   Product.findById(prodID)
      .then(product => {
         if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
         }
         product.title = updatedTitle;
         product.price = updatedPrice;
         product.description = updatedDescription;
         if (image) {
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = image.path;
         }
         return product.save()
            .then(result => {
            res.redirect('/admin/products');
         });
      })
      .catch(err => {
         const error = new Error(err);
         error.httpStatusCode = 500;
         return next(error);
      });
}

exports.getProducts = (req, res, next) => {
   Product.find({ userId: req.user._id })
      // .select('title price -_id')  // selects only specific fields to get fetched
      // .populate('userId', 'name')  // populates related fields (refs) | call .execPopulate() to get a promise
      .then(products => {
         res.render('admin/products', {
            pageTitle: 'Admin Products',
            prods: products,
            path: '/admin/products'
         });
      })
      .catch(err => {
         const error = new Error(err);
         error.httpStatusCode = 500;
         return next(error);
      });
}

exports.deleteProduct = (req, res, next) => {
   const prodID = req.params.productId;
   Product.findById(prodID)
      .then(product => {
        if (!product) {
           next(new Error('Product not found.'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({ _id: prodID, userId: req.user._id });
      })
      .then(() => {
         res.status(200).json({ message: 'Success!' });
      })
      .catch(err => {
         res.status(500).json({ message: 'Deleting product failed.' });
      });
}