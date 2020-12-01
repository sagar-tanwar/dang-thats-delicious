const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/')
    if(isPhoto) {
      next(null, true);
    } else {
      next({message: 'That file type isn\'t allowed'}, false);
    }
  }
}

exports.homePage = (req, res) => {
  res.render('index', { title: 'Home' });
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if(!res.file) return next();
	const extension = req.file.mimetype.split('/')[1];
	// put the photo name on req.body for storing in db
	req.body.photo = `${uuid.v4()}.${extension}`;
	/* 	now we will resize the photo */
	// read the file by passing it the buffer provided by multer
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	/* store it in disk */
	await photo.write(`./public/uploads/${req.body.photo}`);
	// pass the control to the next middleware
	next();
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store'});
}

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
	const stores = await Store.find();
	res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  // TODO: A valid store owner
	res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point'
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store -></a>`);
	res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res) => {
  const store = await Store.findOne({ slug: req.params.slug })
  res.render('store', { store, title: store.name });
}