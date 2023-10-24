const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const { Schema } = mongoose;

const postSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  text: String,
  dateCreated: { type: Date, default: Date.now },
});

postSchema.virtual('url').get(function () {
  return `/post/${this._id}`;
});

postSchema.virtual('dateCreatedFormatted').get(function () {
  return this.dateCreated != null
    ? DateTime.fromJSDate(this.dateCreated).toLocaleString(
        DateTime.DATETIME_MED
      )
    : '';
});

module.exports = mongoose.model('Post', postSchema);
