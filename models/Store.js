const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Name of the store is required'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function(next) {
  if(!this.isModified('name')) return next();
  this.slug = slug(this.name);
  
  // Creates unique slug values
  const slugRegex = new RegExp(`^${this.slug}(?:-[0-9]+)?$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegex });
  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length}`;
  }
  
  next();

});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
}

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // lookup stores and populate their reviews
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews'} },
    // filter out stores with more than one review
    { $match: { 'reviews.1': { $exists: true } } },
    // add a averageRating field to each store
    { $addFields: {
      averageRating: { $avg: '$reviews.rating' } 
    } },
    // sort them by avgRating in descending order
    { $sort: { averageRating: -1 } },
    // limit the number of stores to 10
    { $limit: 10 }
  ]);
}


// find reviews where store._id === review.store
storeSchema.virtual('reviews', {
  ref: 'Review', // What model to link
  localField: '_id', // field of store model for linking
  foreignField: 'store' // field of review model for linking
});

function autoPopulate (next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);