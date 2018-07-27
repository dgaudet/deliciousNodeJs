const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store'
  });
};

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
