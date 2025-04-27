from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import requests

# intialize app
app = Flask(__name__)
CORS(app)

# first, download data in a csv
csv_url = 'https://data.sanjoseca.gov/dataset/918fb7f0-60c0-484e-b31c-334d1ec74e92/resource/15408d78-9734-4ea1-b3e5-a0f99568dd9b/download/crashdata2022-present.csv'
response = requests.get(csv_url)

with open('crashes.csv', 'wb') as f:
    f.write(response.content)

# create df
df = pd.read_csv('crashes.csv')
print(df.head())
crashes = df.to_dict(orient='records')

# defining intersection accident counting function
def count_by_intersection(a_street, b_street):
    street_match = (df['AStreetName'].str.strip().str.upper() == a_street.strip().upper()) & \
                   (df['BStreetName'].str.strip().str.upper() == b_street.strip().upper())
    
    # filter out accidents that were not at the intersection
    at_intersection = (df['DirectionFromIntersection'].str.strip().str.lower() == 'at')
    
    # apply filters
    filtered_df = df[street_match & at_intersection]
    
    # return number of rows
    return filtered_df.shape[0]

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'hi from flask'})

@app.route('/api/all_crashes', methods=['GET'])
def get_all_crashes():
    return jsonify(crashes)

# input: the two streets that create the intersection
# returns: the number of crashes at the intersection
@app.route('/api/get_intersection_crashes', methods=['GET'])
def get_intersection_crashes():
    a_street = request.args.get('a_street')
    b_street = request.args.get('b_street')

    # in case that there are missing parameters
    if not a_street or not b_street:
        return jsonify({"error": "Both 'a_street' and 'b_street' must be provided"}), 400
    
    count = count_by_intersection(a_street, b_street)

    return jsonify({
        "a_street": a_street,
        "b_street": b_street,
        "accidents_at_intersection": count
    })

# input: n/a
# returns: every accident at an intersection
@app.route('/api/get_all_intersection_crashes', methods=['GET'])
def get_all_intersection_crashes():

    # filter accidents that were not at an intersection
    at_intersection = df[df['DirectionFromIntersection'].str.strip().str.lower() == 'at']
    at_intersection = at_intersection.dropna(subset=['IntersectionNumber', 'Latitude', 'Longitude'])

    grouped = at_intersection.groupby(['IntersectionNumber', 'Latitude', 'Longitude']).size().reset_index(name='count')

    intersection_crashes = []
    for _, row in grouped.iterrows():
        intersection_crashes.append({
            "id": row['IntersectionNumber'],
            "lat": float(row['Latitude']),
            'lng': float(row['Longitude']),
            "count": int(row['count'])
        })


    return jsonify(intersection_crashes)

if __name__ == '__main__':
    app.run(port=5000)