const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  occupation: { type: String, required: true },
  email: { type: String, required: true }
  
});


userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
