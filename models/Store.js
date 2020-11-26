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
  tags: [String]
});

storeSchema.pre('save', function(next) {
  if(!this.isModified('name')) return next();
  this.slug = slug(this.name);
  next();

  // TODO: Make it more resilient to make unique slug values
});

module.exports = mongoose.model('Store', storeSchema);