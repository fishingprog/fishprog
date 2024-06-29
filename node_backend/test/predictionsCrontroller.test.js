const axios = require('axios');
const { fetchPredictions } = require('../src/controllers/predictionsController');

jest.mock('axios');

describe('fetchPredictions', () => {
    // Test case for successfully fetching predictions
    it('should fetch predictions successfully', async () => {
        // Mock axios.get to resolve with mock data
        const mockPredictions = [{ id: 1, prediction: 'A' }, { id: 2, prediction: 'B' }];
        axios.get.mockResolvedValue({ data: mockPredictions });

        const result = await fetchPredictions();

        expect(result).toEqual(mockPredictions);
        expect(axios.get).toHaveBeenCalledWith(`${process.env.FLASK_SERVICE_URL}/predictions`);
    });

    // Test case for handling errors while fetching predictions
    it('should throw an error when the request fails', async () => {
        const errorMessage = 'Network Error';
        axios.get.mockRejectedValue(new Error(errorMessage));

        // Use an asynchronous function to catch the thrown error
        await expect(fetchPredictions()).rejects.toThrow(errorMessage);
    });
});
