require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const routes = require('./routes');

const mongoose = require('mongoose');

// MongoDB Atlas connection
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI);

app.use(express.json());
app.use(cors());
app.use('/', routes);

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = { app, server };