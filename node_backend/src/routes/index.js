const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const predictionsController = require('../controllers/predictionsController');
const Record = require('../models/record');
const User = require('../models/user'); 


router.post('/process-file', predictionsController.processFileByName);


router.get('/list-input-files', async (req, res) => {
    const inputDirPath = path.join(__dirname, '../../inputs');
    fs.readdir(inputDirPath, (err, files) => {
        if (err) {
            console.error("Could not list the directory.", err);
            return res.status(500).send("Failed to list files");
        }
        const csvFiles = files.filter(file => file.endsWith('.csv'));
        res.json({ files: csvFiles });
    });
});


// --- Test ---
// This endpoint reads the predictions.json file and returns its JSON content to the frontend
// router.get('/pfz', (req, res) => {
//     const predictionsPath = path.join(__dirname, '../../../model_service/outputs/predictions.json');
//     fs.readFile(predictionsPath, (err, data) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).send('Error reading predictions file');
//         }
//         res.json(JSON.parse(data));
//     });
// });


// Endpoint to get (serve) predictions to flutter frontend
router.get('/api/predictions', async (req, res) => {
    try {
        const predictions = await predictionsController.fetchPredictions();
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch predictions' });
    }
});


// MongoDB record routes
router.post('/add-catch', async (req, res) => {
    const { email, selectedDate, latitude, longitude, weight, species } = req.body;
    const formattedLongitude = `${longitude[0]}_${longitude[1]}'${longitude[2]}"${longitude[3]}`;
    const formattedLatitude = `${latitude[0]}_${latitude[1]}'${latitude[2]}"${latitude[3]}`;
    const dateOnly = selectedDate.split(' ')[0];
    const newCatch = {
        date: dateOnly,
        lon: formattedLongitude,
        lat: formattedLatitude,
        weight: weight,
        species: species
    };

    try {
        const record = await Record.findById(email);
        if (!record) {
            const newRecord = new Record({
                _id: email,
                catches: [newCatch]
            });
            await newRecord.save();
        } else {
            record.catches.push(newCatch);
            await record.save();
        }
        res.status(201).json(newCatch);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


router.get('/recent-catches/:email', async (req, res) => {
    const { email } = req.params;
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    try {
        const record = await Record.findById(email);
        if (!record) {
            return res.status(404).json({ message: 'No records found' });
        }
        const recentCatches = record.catches.filter(catchRecord => {
            const catchDate = new Date(catchRecord.date);
            return catchDate >= sixtyDaysAgo;
        });
        res.json(recentCatches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// MongoDB User routes
router.post('/add-userinfo', async (req, res) => {
    try {
      const newUser = new User({
        _id: req.body.email,
        name: req.body.name,
        occupation: req.body.occupation,
        email: req.body.email
    });

        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


router.get('/get-userinfo/:email', async (req, res) => {
  try {
      const user = await User.findById(req.params.email);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


module.exports = router;
