from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import requests
from datetime import datetime, time, timedelta

# intialize app
app = Flask(__name__)
CORS(app)

# # first, download data in a csv
# csv_url_new = 'https://data.sanjoseca.gov/dataset/918fb7f0-60c0-484e-b31c-334d1ec74e92/resource/15408d78-9734-4ea1-b3e5-a0f99568dd9b/download/crashdata2022-present.csv'
# response = requests.get(csv_url_new)

# with open('crashes_new.csv', 'wb') as f:
#     f.write(response.content)

# csv_url_old = 'https://data.sanjoseca.gov/dataset/918fb7f0-60c0-484e-b31c-334d1ec74e92/resource/c19a01f2-33e1-4c66-9498-85d489f90da4/download/crashdata2011-2021.csv'
# response = requests.get(csv_url_old)

# with open('crashes_old.csv', 'wb') as f:
#     f.write(response.content)

# df1 = pd.read_csv('crashes_old.csv')
# df2 = pd.read_csv('crashes_new.csv')

# combined = pd.concat([df1, df2])
# combined.to_csv('combined.csv', index=False)

# create df
df = pd.read_csv('combined.csv')
print(df.head())
print(df.dtypes)
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

def compute_intersection_df(df):
    at_intersection = df[df['DirectionFromIntersection'].str.strip().str.lower() == 'at']
    at_intersection = at_intersection.dropna(subset=['IntersectionNumber', 'Latitude', 'Longitude'])
    intersection_df = at_intersection.groupby('IntersectionNumber').size().to_frame('Crashes')
    intersection_df[['Latitude', 'Longitude', 'AStreetName', 'BStreetName']] = at_intersection.groupby('IntersectionNumber')[['Latitude', 'Longitude', 'AStreetName', 'BStreetName']].first()
    injury_cols = ['MinorInjuries', 'ModerateInjuries', 'SevereInjuries', 'FatalInjuries']
    at_intersection[injury_cols] = at_intersection[injury_cols].astype(int)
    intersection_df[injury_cols] = at_intersection[['IntersectionNumber', 'MinorInjuries', 'ModerateInjuries', 'SevereInjuries', 'FatalInjuries']].groupby('IntersectionNumber')[injury_cols].sum()
    return intersection_df

def filter_df(df, year_start, year_end, time_start, time_end, vehicle, lighting, weather):
    filtered_df = df

    if (year_start is not None) and (year_end is not None):
        filtered_df = filtered_df[filtered_df['CrashDateTime'].apply(lambda x: filter_year(x, year_start, year_end))]
    
    if (time_start is not None) and (time_end is not None):
        filtered_df = filtered_df[filtered_df['CrashDateTime'].apply(lambda x: filter_time(x, time_start, time_end))]
    
    if (vehicle is not None):
        filtered_df = filtered_df[filtered_df['VehicleInvolvedWith'] == vehicle]
    
    if (lighting is not None):
        filtered_df = filtered_df[filtered_df['Lighting'] == lighting]
    
    if (weather is not None):
        filtered_df = filtered_df[filtered_df['Weather'] == weather]

    return filtered_df

def filter_year(str, year_start, year_end):
    dateTimeObject = process_datetime(str)
    return (int(year_start) <= dateTimeObject.year) and (dateTimeObject.year <= int(year_end))

def process_datetime(dateTimeObject):
    parts = dateTimeObject.split(' ')
    yearParts = parts[0].split('/')
    timeParts = parts[1].split(':')
    return datetime(int(yearParts[2]), int(yearParts[0]), int(yearParts[1]), hour_to_24h(int(timeParts[0]), parts[2]), int(timeParts[1]), int(timeParts[2]))

def hour_to_24h(hour, am_pm):
    if (am_pm == "PM" and hour != 12):
        return hour + 12
    if (am_pm == "AM" and hour == 12):
        return 0
    return hour

def filter_time(str, time_start_str, time_end_str):
    dateTimeObject = process_datetime(str)
    time_start = datetime.combine(datetime.now().date(), time(0, 0, 0)) + timedelta(seconds=int(time_start_str))
    time_end = datetime.combine(datetime.now().date(), time(0, 0, 0)) + timedelta(seconds=int(time_end_str))
    if (time_start <= time_end):
        return (time_start.time() < dateTimeObject.time()) and (dateTimeObject.time() < time_end.time())
    else:
        return (time_start.time() < dateTimeObject.time()) or (dateTimeObject.time() < time_end.time())

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
    #at_intersection = df[df['DirectionFromIntersection'].str.strip().str.lower() == 'at']
    #at_intersection = at_intersection.dropna(subset=['IntersectionNumber', 'Latitude', 'Longitude'])

    #grouped = at_intersection.groupby(['IntersectionNumber', 'Latitude', 'Longitude']).size().reset_index(name='count')

    year_start = request.args.get('year_start')
    year_end = request.args.get('year_end')
    time_start = request.args.get('time_start')
    time_end = request.args.get('time_end')
    vehicle = request.args.get('vehicle')
    lighting = request.args.get('lighting')
    weather = request.args.get('weather')


    intersection_df = compute_intersection_df(filter_df(df, year_start, year_end, time_start, time_end, vehicle, lighting, weather))

    intersection_crashes = []
    #for _, row in grouped.iterrows():
    #    intersection_crashes.append({
    #        "id": row['IntersectionNumber'],
    #        "lat": float(row['Latitude']),
    #        'lng': float(row['Longitude']),
    #        "count": int(row['count'])
    #    })

    for index, row in intersection_df.iterrows():
        intersection_crashes.append({
            "id": int(index),
            "lat": float(row['Latitude']),
            'lng': float(row['Longitude']),
            "count": int(row['Crashes'])
        })

    return jsonify(intersection_crashes)

# input: intersection id
# returns: crash, fatality, minor, major injury count
@app.route('/api/get_intersection_info', methods=['GET'])
def get_intersection_info():
    id_str = request.args.get('id')
    if not id_str:
        return jsonify({"error": "Missing intersection id"}), 400

    try:
        intersection_id = int(id_str)
    except ValueError:
        return jsonify({"error": "Invalid intersection id"}), 400
    
    year_start = request.args.get('year_start')
    year_end = request.args.get('year_end')
    time_start = request.args.get('time_start')
    time_end = request.args.get('time_end')
    vehicle = request.args.get('vehicle')
    lighting = request.args.get('lighting')
    weather = request.args.get('weather')
    

    # filter accidents that were not at an intersection
    #at_intersection = df[df['DirectionFromIntersection'].str.strip().str.lower() == 'at']
    #at_intersection = at_intersection.dropna(subset=['IntersectionNumber'])

    #intersection_crashes = at_intersection[at_intersection['IntersectionNumber'] == intersection_id]

    #if intersection_crashes.empty:
    #    return jsonify({"error": "Intersection not found"}), 404

    # compute total injuries for each row
    #intersection_crashes['TotalInjuries'] = (
    #    intersection_crashes['MinorInjuries'].astype(float) + 
    #    intersection_crashes['ModerateInjuries'].astype(float) + 
    #    intersection_crashes['SevereInjuries'].astype(float) + 
    #    intersection_crashes['FatalInjuries'].astype(float)
    #)

    #a_street = intersection_crashes.iloc[0]['AStreetName']
    #b_street = intersection_crashes.iloc[0]['BStreetName']
    #num_crashes = intersection_crashes.shape[0]
    #total_injuries = intersection_crashes['TotalInjuries'].sum()
    #injury_rate = total_injuries / num_crashes
    #deaths = intersection_crashes['FatalInjuries'].sum()

    intersection_df = compute_intersection_df(filter_df(df, year_start, year_end, time_start, time_end, vehicle, lighting, weather))

    intersection = intersection_df.loc[intersection_id]
    totalInjuries = int(intersection['MinorInjuries'] + intersection['ModerateInjuries'] + intersection['SevereInjuries'] + intersection['FatalInjuries'])

    return jsonify({
        "a_street": intersection['AStreetName'],
        "b_street": intersection['BStreetName'],
        "num_crashes": int(intersection['Crashes']),
        "total_injuries": totalInjuries,
        "injury_rate": totalInjuries / int(intersection['Crashes']),
        "deaths": int(intersection['FatalInjuries'])
    })

if __name__ == '__main__':
    app.run(port=5000)