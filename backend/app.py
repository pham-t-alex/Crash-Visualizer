from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'hi from flask'})

if __name__ == '__main__':
    app.run(port=5000)