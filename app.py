from flask import Flask, render_template, jsonify, request
from kmeans import KMeans  # Import your KMeans implementation
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')  # Serve the HTML page

@app.route('/initialize_kmeans', methods=['POST'])
def initialize_kmeans():
    global kmeans_instance
    # Get data and initialization method from the frontend
    data = request.json['data']
    init_method = request.json['initMethod']
    k = request.json['k']
    
    # If the user provided manual centroids, retrieve them
    manual_centroids = request.json.get('manualCentroids', None)

    # Convert the data to a NumPy array (since KMeans uses NumPy arrays)
    data = np.array(data)

    # Create a KMeans instance and fit it to the data
    kmeans_instance = KMeans(k=k, init_method=init_method)
    kmeans_instance.initialize_centroids(data, manual_centroids)

    return jsonify({
        'centroids': kmeans_instance.centroids.tolist(),
        'labels': kmeans_instance.labels.tolist()
    })

    
@app.route('/step_kmeans', methods=['POST'])
def step_kmeans():
    try:
        global kmeans_instance
        
        if kmeans_instance is None:
            return jsonify({'error': 'KMeans is not initialized'}), 400

        # Get the dataset from the request
        data = np.array(request.json['data'])
        
        # Run one step of KMeans
        kmeans_instance.step(data)

        # Return the current centroids and labels
        return jsonify({
            'centroids': kmeans_instance.centroids.tolist(),
            'labels': kmeans_instance.labels.tolist(),
            'iteration': kmeans_instance.iteration,
            'converged': kmeans_instance.converged
        })
    
    except Exception as e:
        print(f"Error in step_kmeans: {e}")  # Log the error on the server
        return jsonify({'error': str(e)}), 500

@app.route('/run_to_convergence', methods=['POST'])
def run_to_convergence():
    global kmeans_instance

    if kmeans_instance is None:
        return jsonify({'error': 'KMeans is not initialized'}), 400

    # Get the dataset from the request
    data = np.array(request.json['data'])

    # Run KMeans to convergence
    kmeans_instance.run_to_convergence(data)

    # Return the final centroids and labels
    return jsonify({
        'centroids': kmeans_instance.centroids.tolist(),
        'labels': kmeans_instance.labels.tolist(),
        'iteration': kmeans_instance.iteration,
        'converged': kmeans_instance.converged
    })

if __name__ == "__main__":
    app.run(debug=True, port=3000)
