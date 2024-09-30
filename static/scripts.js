// Global variables
let dataset = [];
let selectedCentroids = [];  // Array to store manually selected centroids
let kmeansInitialized = false;
let stepInterval;  // Interval ID to handle stopping the step-through loop
// let currentStep = 0;
// let k = 3;  // Number of clusters (adjustable if needed)


// Function to run KMeans clustering based on selected initialization method
// function runKMeans() {
//     let initMethod = document.getElementById('initMethod').value;

//     // If manual initialization is selected, ensure the user has selected enough centroids
//     if (initMethod === 'manual' && selectedCentroids.length < k) {
//         alert(`Please select ${k} centroids manually by clicking on the plot.`);
//         return;
//     }

//     // Send dataset, selected initialization method, and manual centroids to the backend
//     fetch('/run_kmeans', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             data: dataset,
//             initMethod: initMethod,
//             k: k,
//             manualCentroids: selectedCentroids  // Pass selected centroids for manual initialization
//         })
//     })
//     .then(response => response.json())
//     .then(result => {
//         // Plot the final clustering result
//         plotClusters(result.data, result.centroids, result.labels);
//     })
//     .catch(error => console.error('Error:', error));
// }

// Function to initialize KMeans
function initializeKMeans() {
    let initMethod = document.getElementById('initMethod').value;
    let k = document.getElementById('numClusters').value;

    // If the user selects "manual", ensure they have selected enough centroids
    // Handle manual initialization (set k to the number of centroids selected)
    if (initMethod === 'manual') {
        if (selectedCentroids.length === 0) {
            alert('Please select at least one centroid manually by clicking on the plot.');
            return;
        }
        k = selectedCentroids.length;  // Set k to the number of manually selected centroids
    }

    fetch('/initialize_kmeans', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            data: dataset,
            initMethod: initMethod,
            k: k,
            manualCentroids: initMethod === 'manual' ? selectedCentroids : null  // Only send manual centroids if applicable
        })
    })

    .then(response => response.json())
    .then(result => {
        kmeansInitialized = true;
        plotClusters(dataset, result.centroids, []);  // Initial plot without cluster labels
        // If the user wants to run the algorithm to convergence immediately
        if (typeof runToConvergence !== 'undefined' && runToConvergence) {
            runToConvergence();
        }
        
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle centroid selection on the plot (for manual initialization)
function selectCentroid(x, y) {
    let initMethod = document.getElementById('initMethod').value;
    
    // Only allow manual centroid selection if "manual" is selected
    if (initMethod === 'manual') {
        selectedCentroids.push([x, y]);  // Add the selected centroid
        plotClusters(dataset, selectedCentroids, []);  // Update plot with selected centroids
    }
}

// Function to run step-by-step automatically until convergence
function autoStepThrough() {
    if (!kmeansInitialized) {
        alert('KMeans is not initialized.');
        return;
    }

    // Clear any previous interval (if there was one)
    clearInterval(stepInterval);

    // Set up an interval to request a step every 1 second (or another suitable time)
    stepInterval = setInterval(() => {
        fetch('/step_kmeans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: dataset })
        })
        .then(response => response.json())
        .then(result => {
            plotClusters(dataset, result.centroids, result.labels);  // Update plot

            if (result.converged) {
                clearInterval(stepInterval);  // Stop the loop if KMeans has converged
                alert('KMeans has converged!');
            }
        })
        .catch(error => {
            console.error('Error in step_kmeans:', error);
            clearInterval(stepInterval);  // Stop the loop in case of error
        });
    }, 1000);  // Change the interval duration if you want faster or slower updates
}

// Function to run KMeans to convergence in one go
function runToConvergence() {
    if (!kmeansInitialized) {
        alert('KMeans is not initialized.');
        return;
    }

    fetch('/run_to_convergence', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: dataset })
    })
    .then(response => response.json())
    .then(result => {
        plotClusters(dataset, result.centroids, result.labels);  // Update plot
        alert(`KMeans converged in ${result.iteration} iterations!`);
    })
    .catch(error => console.error('Error:', error));
}

function enableButtons() {
    
    document.getElementById('stepKMeans').classList.remove('disabled');
    document.getElementById('runConvergence').classList.remove('disabled');
}

function disableButtons() {
    document.getElementById('stepKMeans').classList.add('disabled');
    document.getElementById('runConvergence').classList.add('disabled');
}

// Example use: After generating a new dataset, enable the step and convergence buttons
function generateNewDataset() {
    // Function to generate a new random dataset
    selectedCentroids = [];  // Reset selected centroids for manual initialization
    dataset = [];

    // Generate random 2D data points
    for (let i = 0; i < 100; i++) {
        let x = Math.random() * 10;
        let y = Math.random() * 10;
        dataset.push([x, y]);
    }

    // Plot the dataset without any clusters or centroids
    plotClusters(dataset, [], []);
    enableButtons();
}

// Example: Reset the algorithm and disable the buttons
function reset() {
    selectedCentroids = [];
    dataset = [];
    currentStep = 0;
    plotClusters([], [], []);  // Clear the plot
    disableButtons();
}

// Function to capture manual centroid selection
document.getElementById('plot').addEventListener('plotly_click', function(data) {
    let initMethod = document.getElementById('initMethod').value;

    // Only allow manual selection if manual initialization is selected
    if (initMethod === 'manual') {
        let x = data.points[0].x;
        let y = data.points[0].y;
        
        // If user has already selected the required number of centroids, prevent further selection
        if (selectedCentroids.length >= k) {
            alert(`You have already selected ${k} centroids.`);
            return;
        }

        selectedCentroids.push([x, y]);

        // Plot the newly selected centroid
        Plotly.addTraces('plot', {
            x: [x],
            y: [y],
            mode: 'markers',
            marker: { color: 'red', size: 12 },
            name: 'Selected Centroid'
        });
    }
});

// Function to plot clusters using Plotly
function plotClusters(data, centroids, labels) {
    console.log('Plotting data...', data, centroids);
    // Function to plot clusters and centroids
    let traces = [];
    let uniqueLabels = [...new Set(labels)];

    // Plot data points
    traces.push({
        x: data.map(point => point[0]),
        y: data.map(point => point[1]),
        mode: 'markers',
        marker: { size: 5 },
        name: 'Data Points'
    });

    // Plot centroids if they exist
    if (centroids.length > 0) {
        traces.push({
            x: centroids.map(c => c[0]),
            y: centroids.map(c => c[1]),
            mode: 'markers',
            marker: { color: 'red', size: 12, symbol: 'x' },
            name: 'Centroids'
        });
    }

    let layout = {
        title: 'KMeans Clustering Data',
        xaxis: { title: 'X Axis' },
        yaxis: { title: 'Y Axis' },
        showlegend: true
    };

    Plotly.newPlot('plot', traces, layout);
}


// Initially generate a dataset when the page loads
generateNewDataset();
