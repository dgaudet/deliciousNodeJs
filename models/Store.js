const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
      type: String,
      trim: true,
      required: 'Please enter a store name.'
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
        required: 'You must supply coordinates'
    }],
    address: {
      type: String,
      required: 'You must supply an address'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
},
{
  toJSON: { virtuals: true},
  toObject: { virtuals: true }
}
);

// Indexes
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function(next){
  if (!this.isModified('name')) {
    next();
    return;
  }
  this.slug = slug(this.name);
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({
    slug: slugRegEx
  });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  next();
  // TODO make slugs unique for duplicate names
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags'},
    { $group: { _id: '$tags', count: { $sum: 1 }}},
    { $sort: { count: -1 }}
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // the reviews in the statement below comes from the Review object,
    // mongodb will lowercase the model name and add an 's' to the end to make it plural
    { $lookup:
      {
        from: 'reviews',
        localField: '_id',
        foreignField: 'store',
        as: 'reviews'
      }
    },
    { // this section filters out any reivews that have more than one review
      $match: {
        'reviews.1': { $exists: true}
      }
    },
    { // add the average reviews field, and keep the fields we want
      $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: {
          $avg: '$reviews.rating'
        }
      }
    },
    { // sort by the new averageRating field
      $sort: { averageRating: -1 }
    },
    { // limit results to 10
      $limit: 10
    }
  ]);
};

// this virutal schema addition is mongoose specific
storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id', // this is the field on this model
  foreignField: 'store' // this is the field on the Review model
});

function autopopulate(next) {
  this.populate('reviews');
  next();
};

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
