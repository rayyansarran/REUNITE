const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Post extends Model {}

Post.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  collegeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'colleges',
      key: 'id'
    }
  },
  isCollegeSpecific: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  telegramLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Post',
  tableName: 'posts',
  timestamps: true
});

// Import models
const User = require('./User');
const College = require('./College');
const Comment = require('./Comment');

// Define relationships
Post.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Post, { foreignKey: 'userId' });

Post.belongsTo(College, { foreignKey: 'collegeId' });
College.hasMany(Post, { foreignKey: 'collegeId' });

Post.hasMany(Comment, { foreignKey: 'postId' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

module.exports = Post; 