from flask import Flask, request, jsonify
import pandas as pd
import geopandas as gpd
import numpy as np
import joblib
import os

app = Flask(__name__)

# Load the ml model
MODEL_PATH = os.getenv('MODEL_PATH', './model/voting_clf_sknew.joblib')
model = joblib.load(MODEL_PATH)

latest_predictions = None

@app.route('/predict', methods=['POST'])
def predict():

     global latest_predictions

     if 'file' not in request.files or request.files['file'].filename == '':
          return "No file provided", 400
     if request.method == 'POST':
          try:
               # Validate the file is sent with the request
               file = request.files['file']

               if not file:
                    return "No file provided", 400
               
               df = pd.read_csv(file)
               
               # --- Preprocess the data as needed and make predictions ---

               # # Convert 'date' column to 'dayofyear'
               # df['dayofyear'] = pd.to_datetime(df['date']).dt.dayofyear
               # # Drop the original 'date' column
               # df.drop(columns=['date'], inplace=True)

               # Select the input features
               input_features = df[['lat', 'lon', 'sst', 'chl']]

               # After the data is ready for prediction
               predictions = model.predict(input_features)
               # predictions = model.predict(df)

               # Checking the count of 0s and 1s in the predictions
               unique, counts = np.unique(predictions, return_counts=True)
               prediction_counts = dict(zip(unique, counts))
               print("Count of 0s:", prediction_counts.get(0, 0))
               print("Count of 1s:", prediction_counts.get(1, 0))

               # Extract the latitude and longitude of these rows
               # lat_lon_predictions = filtered_data[['lat', 'lon']]

               # Filter the rows where the prediction is 1
               filtered_data = df[predictions == 1]

               # Round latitude and longitude to two decimal points
               filtered_data['lat'] = filtered_data['lat'].round(1)
               filtered_data['lon'] = filtered_data['lon'].round(1)

               # Remove duplicates
               filtered_data = filtered_data.drop_duplicates(subset=['lat', 'lon'])

               # Create a GeoDataFrame from the filtered data
               gdf = gpd.GeoDataFrame(filtered_data, geometry=gpd.points_from_xy(filtered_data['lon'], filtered_data['lat']), crs="EPSG:4326")

               # Load the Sri Lankan EEZ GeoJSON as a GeoDataFrame
               eez_gdf = gpd.read_file('./assets/sri_lanka_eez.geojson')

               # Load the coastal line polygon GeoJSON as a GeoDataFrame
               coastline_gdf = gpd.read_file('./assets/sri_lanka.json')

               # Check if each point is within the EEZ polygon
               gdf['in_eez'] = gdf.geometry.within(eez_gdf.geometry.unary_union)

               # Create a 1 km buffer around the new coastline
               new_coastline_buffer = coastline_gdf.geometry.unary_union.buffer(0.01)  # Approximately 1 km in decimal degrees

               # Check if each point is within the 1 km buffer
               gdf['in_buffer'] = gdf.geometry.within(new_coastline_buffer)

               # Filter the data to include only points within the EEZ and outside the 1 km buffer
               gdf_filtered = gdf[gdf['in_eez'] & ~gdf['in_buffer']]

               # Save the filtered data to a JSON file
               output_file_path = './outputs/predictions.json'
               gdf_filtered[['lon', 'lat']].to_json(output_file_path, orient='records')

               latest_predictions = gdf_filtered[['lon', 'lat']].to_dict(orient='records')
               
               return jsonify({"message": "Predictions saved and provided"})

               # Return the filtered data as JSON
               # return jsonify(gdf_filtered[['lon', 'lat']].to_dict(orient='records'))
          
          except Exception as e:
               return jsonify({"error": str(e)})


@app.route('/predictions', methods=['GET'])
def get_predictions():
    global latest_predictions

    # Check if there are any predictions available
    if latest_predictions is not None:
        print("Returning latest predictions")
        return jsonify(latest_predictions)
    else:
        return jsonify({"message": "No predictions available"})


if __name__ == '__main__':
     app.run(debug=True)