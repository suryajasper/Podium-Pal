const mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username: String,
    hash: String,
    salt: String,
    email: String,
    createdAt: Date,
});

const User = mongoose.model('User', userSchema);
module.exports = User;