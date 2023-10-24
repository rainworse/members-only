const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const Post = require('../models/post');
const User = require('../models/user');

const passport = require('passport');

/* GET home page. */
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const posts = await Post.find()
      .sort({ dateCreated: -1 })
      .populate('author')
      .exec();
    if (!req.user || !req.user.member) {
      for (const post in posts) {
        posts[post].author.username = 'XXXXXXXXXX';
      }
    }
    res.render('index', { title: 'Members only', posts });
  })
);

router.get('/login', (req, res, next) => {
  res.render('login', { title: 'Login' });
});

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    res.redirect('/');
  });
});

router.get('/sign-up', (req, res, next) => {
  res.render('sign-up', { title: 'Sign Up' });
});

router.post('/sign-up', [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Username must be at least 3 characters long.'),
  body('password')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Password must be at least 3 characters long.'),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('sign-up', {
        title: 'Sign Up',
        username: req.body.username,
        errors: errors.array(),
      });
      return;
    }

    let nameInUse = await User.exists({ username: req.body.username });

    if (nameInUse) {
      res.render('sign-up', {
        title: 'Sign Up',
        username: req.body.username,
        errors: [{ msg: 'Username already in use.' }],
      });
    } else {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          next(err);
          return;
        } else {
          const user = new User({
            username: req.body.username,
            password: hashedPassword,
            member: false,
            admin: false,
            posts: [],
          });

          await user.save();

          req.login(user, function (err) {
            if (err) {
              return next(err);
            }
            return res.redirect('/');
          });
        }
      });
    }
  }),
]);

router.get('/new-post', (req, res, next) => {
  res.render('new-post', { title: 'Create new post' });
});

router.post('/new-post', [
  body('title')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Title must be at least 3 characters long.'),
  body('text')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Text must be at least 3 characters long.'),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('sign-up', {
        title: 'Create new post',
        post: { title: req.body.title, text: req.title.text },
      });
      return;
    }

    const user = req.user;

    const post = new Post({
      author: user._id,
      title: req.body.title,
      text: req.body.text,
      dateCreated: Date.now(),
    });

    await post.save();
    user.posts.push(post._id);
    await User.findByIdAndUpdate(user._id, { posts: user.posts });

    res.redirect('/');
  }),
]);

router.get('/member-form', (req, res, error) => {
  if (!req.user) {
    res.redirect('/');
  }
  res.render('member-form', { title: 'Become a Member' });
});

router.post(
  '/member-form',
  asyncHandler(async (req, res, error) => {
    const user = req.user;

    if (user && !user.member && req.body.password === process.env.MEMBERPASS) {
      await User.findByIdAndUpdate(user._id, { member: true });
      res.redirect('/');
      return;
    }

    res.render('member-form', { title: 'Become a Member' });
  })
);

router.get('/admin-form', (req, res, error) => {
  if (!req.user) {
    res.redirect('/');
  }
  res.render('admin-form', { title: 'Become an Admin' });
});

router.post(
  '/admin-form',
  asyncHandler(async (req, res, error) => {
    const user = req.user;

    if (user && !user.admin && req.body.password === process.env.ADMINPASS) {
      await User.findByIdAndUpdate(user._id, { admin: true });
      res.redirect('/');
      return;
    }

    res.render('admin-form', { title: 'Become an Admin' });
  })
);

router.get(
  '/manage-posts',
  asyncHandler(async (req, res, next) => {
    const user = req.user;
    if (!user || !user.admin) {
      res.redirect('/');
      return;
    }

    const posts = await Post.find()
      .sort({ dateCreated: -1 })
      .populate('author')
      .exec();

    res.render('manage-posts', { title: 'Manage Posts', posts });
  })
);

router.post(
  '/delete-posts',
  asyncHandler(async (req, res, next) => {
    const user = req.user;
    if (!user || !user.admin) {
      res.redirect('/');
      return;
    }

    const postsToDeleteIDs = [];
    Object.keys(req.body).forEach((key, index) => {
      if (req.body[key] == 'on') {
        postsToDeleteIDs.push(key);
      }
    });

    const postsToDelete = await Post.find({
      _id: { $in: postsToDeleteIDs },
    }).exec();

    for (const i in postsToDelete) {
      const post = postsToDelete[i];
      await User.updateOne(
        { _id: post.author._id },
        {
          $pull: {
            posts: post._id,
          },
        }
      );
      await Post.findOneAndDelete(post._id);
    }

    res.redirect('/manage-posts');
  })
);

module.exports = router;
