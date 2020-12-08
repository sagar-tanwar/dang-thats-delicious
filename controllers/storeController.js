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
  if(!req.file) return next();
	const extension = req.file.mimetype.split('/')[1];
	// put the photo name on req.body for storing in db
  req.body.photo = `${uuid.v4()}.${extension}`;
  console.log(req.body.photo);
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
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
	const stores = await Store.find();
	res.render('stores', { title: 'Stores', stores });
};

const confirmOwner = (store, user) => {
  if(!store.author.equals(user._id)) {
    throw Error('You must own this store to edit it');
  }
}

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  // A valid store owner
  confirmOwner(store, req.user);
	res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point'
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store -></a>`);
	res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author');
  if(!store) return next();
  res.render('store', { store, title: store.name });
}

exports.getStoresByTag = async (req, res) => {
	const tag	= req.params.tag;
	const tagQuery = tag || { $exists: true }
  const tagsPromise = Store.getTagsList();
	const storesPromise = Store.find({ tags: tagQuery });
	const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', { tags, title: 'Tags', tag, stores });
}

exports.searchStores = async (req, res) => {
  const stores = await Store.find({
    $text: { $search: req.query.q }
  }, {
    score: { $meta: 'textScore' }
  })
  .sort({ score: { $meta: 'textScore' }});
  res.json(stores);
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
           type: "Point" ,
           coordinates
        },
        $maxDistance: 10000, // 10km
      }
    }
  }

  const stores = await Store.find(q).select('slug name location photo');
  res.json(stores);
}

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
}