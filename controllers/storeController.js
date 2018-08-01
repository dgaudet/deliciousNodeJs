const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({message: 'That filetype isn\'t allowed'}, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store'
  });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async(req, res, next) => {
  if (!req.file){
    next(); // skips to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // resize the Photo
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
}

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfuly Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores});
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id});
  // TODO
  //confirm they are the owner of the store
  res.render('editStore', { title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
  // setting the location data to be a point on update
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({ _id: req.params.id},
    req.body,
    {
      new: true, // this returns the new updated stores
      runValidators: true // you need to ask it to run the validators, because this doesn't happen by default on update
    }).exec();

  req.flash('success', `Successfuly Updated ${store.name}. <a href="/stores/${store.slug}">View Store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug});
  if (!store){
    return next();
  }
  //confirm they are the owner of the store
  res.render('store', { store, title: `${store.name}`});
};

exports.getStoresByTag = async (req, res, next) => {
  const tagsPromise = Store.getTagsList();
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true }
  const storesPromise = Store.find({ tags: tagQuery});
  const [tags, stores] = await Promise.all([
    tagsPromise,
    storesPromise
  ]);

  res.render('tag', { title: 'Tags', tags, tag, stores });
};
