const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  member: Boolean,
  admin: Boolean,
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
});

userSchema.virtual('url').get(function () {
  return `/user/${this._id}`;
});

module.exports = mongoose.model('User', userSchema);
