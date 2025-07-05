const User = require('./User');
const Post = require('./Post');
const College = require('./College');
const Comment = require('./Comment');
const Like = require('./Like');

// Define associations
User.belongsTo(College, { foreignKey: 'collegeId' });
College.hasMany(User, { foreignKey: 'collegeId' });

Post.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Post, { foreignKey: 'userId' });

Post.belongsTo(College, { foreignKey: 'collegeId' });
College.hasMany(Post, { foreignKey: 'collegeId' });

Post.hasMany(Comment, { foreignKey: 'postId' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

Post.hasMany(Like, { foreignKey: 'postId' });
Like.belongsTo(Post, { foreignKey: 'postId' });

User.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Post,
  College,
  Comment,
  Like
}; 