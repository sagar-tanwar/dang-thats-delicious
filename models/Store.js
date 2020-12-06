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
});

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

module.exports = mongoose.model('Store', storeSchema);