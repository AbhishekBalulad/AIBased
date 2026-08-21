const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'mr'],
      default: 'en'
    },
    state: {
      type: String,
      trim: true,
      default: 'All India'
    },
    occupation: {
      type: String,
      trim: true,
      default: 'General Citizen'
    },
    incomeBracket: {
      type: String,
      enum: ['Below 1 Lakh', '1-3 Lakhs', '3-5 Lakhs', 'Above 5 Lakhs', 'Unspecified'],
      default: 'Unspecified'
    },
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'],
      default: 'General'
    }
  },
  {
    timestamps: true
  }
);

// Index for quick lookup on email
UserSchema.index({ email: 1 });

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
