from app import app
from flask_testing import TestCase

class TestPredictions(TestCase):
    def create_app(self):
        app.config['TESTING'] = True
        return app

    def test_predict_no_file(self):
        response = self.client.post('/predict')
        self.assertEqual(response.status_code, 400)
        self.assertIn(b'No file provided', response.data)

    def test_predict_with_file(self):
        with open('tests/test_data.csv', 'rb') as test_file:
            data = {
                'file': (test_file, 'test_data.csv')
            }
            response = self.client.post('/predict', content_type='multipart/form-data', data=data)
            self.assertEqual(response.status_code, 200)