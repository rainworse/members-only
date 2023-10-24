const User = require('./models/user');
const Post = require('./models/post');

require('dotenv').config();

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const populateDB = async () => {
  console.log('Populating DB');

  const user1 = new User({
    username: 'admin1',
    password: 'password1',
    member: true,
    admin: true,
  });

  const user2 = new User({
    username: 'user1',
    password: '123',
    member: true,
    admin: false,
  });

  const user3 = new User({
    username: 'bigga',
    password: '1234',
    member: false,
    admin: false,
    posts: [],
  });

  const post1 = new Post({
    author: user1._id,
    title: 'wowee',
    text: 'fuck the life',
    dateCreated: Date.now(),
  });

  const post2 = new Post({
    author: user2._id,
    title: 'ball',
    text: 'ball hard',
    dateCreated: Date.now(),
  });

  user1.posts = [post1._id];
  user2.posts = [post2._id];

  await user1.save();
  await user2.save();
  await user3.save();
  await post1.save();
  await post2.save();

  console.log('Finished');
};

main().catch((err) => console.log(err));
async function main() {
  console.log('Connecting to DB');
  await mongoose.connect(process.env.MONGODB);
  await populateDB();
  mongoose.connection.close();
}
