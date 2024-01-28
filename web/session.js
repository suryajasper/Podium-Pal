const mongoose = require('mongoose');

var sessionSchema = new mongoose.Schema({
    date: Date,
    response: [Message],
    summary: String,
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;