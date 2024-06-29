const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');


exports.processFileByName = async (req, res) => {
    const { fileName } = req.body; // Expecting the filename to be sent in the request body

    if (!fileName) {
        return res.status(400).send('No file name provided.');
    }

    const filePath = path.join(__dirname, '../../inputs', fileName);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found.');
    }

    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream, fileName);

    try {
        const response = await axios.post(`${process.env.FLASK_SERVICE_URL}/predict`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing file");
    }
};


// Retrieve predictions from the Flask service
exports.fetchPredictions = async function() {
    try {
        const response = await axios.get(`${process.env.FLASK_SERVICE_URL}/predictions`);
        console.log('Predictions fetched from flask');
        return response.data; // The predictions
    } catch (error) {
        console.error('Error fetching predictions from flask:', error);
        throw error; // Or handle error as needed
    }
};
