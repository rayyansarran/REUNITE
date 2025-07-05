const express = require('express');
const router = express.Router();
const { Post, User, College, Like, Comment } = require('../models/associations');
const authenticateToken = require('../middleware/auth');
const checkActiveUser = require('../middleware/checkUserStatus');
const multer = require('multer');
const path = require('path');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get general posts (non-college specific)
router.get('/general', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: {
        isCollegeSpecific: false
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture', 'collegeName', 'currentCareerStatus', 'yearOfGraduation', 'bio']
        },
        {
          model: College,
          attributes: ['id', 'name']
        },
        {
          model: Like,
          include: [{
            model: User,
            attributes: ['id', 'username']
          }]
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['id', 'username', 'profilePicture']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Ensure Likes and Comments are always arrays
    const postsWithDefaults = posts.map(post => ({
      ...post.toJSON(),
      Likes: Array.isArray(post.Likes) ? post.Likes : [],
      Comments: Array.isArray(post.Comments) ? post.Comments : []
    }));

    res.json(postsWithDefaults);
  } catch (error) {
    console.error('Error fetching general posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get college-specific posts for user's college
router.get('/college-specific', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: {
        isCollegeSpecific: true,
        collegeId: req.user.collegeId
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture', 'collegeName', 'currentCareerStatus', 'yearOfGraduation', 'bio']
        },
        {
          model: College,
          attributes: ['id', 'name']
        },
        {
          model: Like,
          include: [{
            model: User,
            attributes: ['id', 'username']
          }]
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['id', 'username', 'profilePicture']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Ensure Likes and Comments are always arrays
    const postsWithDefaults = posts.map(post => ({
      ...post.toJSON(),
      Likes: Array.isArray(post.Likes) ? post.Likes : [],
      Comments: Array.isArray(post.Comments) ? post.Comments : []
    }));

    res.json(postsWithDefaults);
  } catch (error) {
    console.error('Error fetching college-specific posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post
router.post('/', authenticateToken, checkActiveUser, upload.single('image'), async (req, res) => {
  try {
    const { content, isCollegeSpecific, telegramLink } = req.body;
    const userId = req.user.id;
    const collegeId = req.user.collegeId;
    const post = await Post.create({
      content,
      userId,
      collegeId,
      isCollegeSpecific: isCollegeSpecific === 'true',
      telegramLink: telegramLink || null,
      image: req.file ? req.file.path : null
    });
    const postWithUser = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture', 'collegeName', 'currentCareerStatus', 'yearOfGraduation', 'bio']
        },
        {
          model: College,
          attributes: ['id', 'name']
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['id', 'username', 'profilePicture']
          }]
        }
      ]
    });
    res.status(201).json(postWithUser);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update post
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    const { content, isCollegeSpecific, telegramLink } = req.body;
    await post.update({
      content,
      isCollegeSpecific: isCollegeSpecific === 'true',
      telegramLink: telegramLink || null
    });
    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: College,
          attributes: ['id', 'name']
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['id', 'username', 'profilePicture']
          }]
        }
      ]
    });
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await post.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/Unlike post
router.post('/like/:id', authenticateToken, checkActiveUser, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = await Like.findOne({
      where: {
        userId: req.user.id,
        postId: post.id
      }
    });

    if (existingLike) {
      await existingLike.destroy();
    } else {
      await Like.create({
        userId: req.user.id,
        postId: post.id
      });
    }

    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: College,
          attributes: ['id', 'name']
        },
        {
          model: Like,
          include: [{
            model: User,
            attributes: ['id', 'username']
          }]
        }
      ]
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to post
router.post('/:id/comments', authenticateToken, checkActiveUser, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.create({
      text: text.trim(),
      userId: req.user.id,
      postId: post.id
    });

    // Fetch the updated post with all comments
    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: College,
          attributes: ['id', 'name']
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['id', 'username', 'profilePicture']
          }]
        }
      ]
    });

    if (!updatedPost) {
      return res.status(500).json({ error: 'Error updating post' });
    }

    res.status(201).json(updatedPost);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 