const mongoose = require('mongoose');

const catchSchema = new mongoose.Schema({
  date: String,
  lon: String,
  lat: String,
  weight: Number,
  species: String
});

const recordSchema = new mongoose.Schema({
  _id: String,
  catches: [catchSchema]
});

module.exports = mongoose.model('Record', recordSchema);

