import numpy as np

class KMeans:
    def __init__(self, k, init_method="random", max_iter=50):
        self.k = k
        self.init_method = init_method
        self.max_iter = max_iter
        self.centroids = None
        self.labels = None
        self.iteration = 0  # Keep track of the current iteration
        self.converged = False  # Flag to indicate if the algorithm has converged

    def fit(self, X, user_centroids=None):
        # Step 1: Initialize centroids based on the chosen method
        if self.init_method == "random":
            self.centroids = self._init_random(X)
        elif self.init_method == "kmeans++":
            self.centroids = self._init_kmeans_plus(X)
        elif self.init_method == "farthest":
            self.centroids = self._init_farthest(X)
        elif self.init_method == "manual" and user_centroids is not None:
            self.centroids = self._init_manual(user_centroids)

        
        for i in range(self.max_iter):
            # Step 2: Assign clusters
            self.labels = self._assign_clusters(X)
            
            # Step 3: Update centroids
            new_centroids = self._calculate_centroids(X)
            
            # Check for convergence (if centroids do not change significantly)
            if np.allclose(self.centroids, new_centroids):
                break
            self.centroids = new_centroids
    
    def _init_random(self, X):
        return X[np.random.choice(X.shape[0], self.k, replace=False)]

    def _init_kmeans_plus(self, X):
        """ Initializes centroids using the KMeans++ method. """
        centroids = []
        
        # Step 1: Randomly choose the first centroid
        first_centroid_idx = np.random.choice(X.shape[0])
        centroids.append(X[first_centroid_idx])
        
        # Step 2: Choose the remaining k-1 centroids
        for _ in range(1, self.k):
            distances = np.array([min(np.linalg.norm(x - c) ** 2 for c in centroids) for x in X])
            probabilities = distances / distances.sum()  # Normalize to get a probability distribution
            next_centroid_idx = np.random.choice(X.shape[0], p=probabilities)
            centroids.append(X[next_centroid_idx])
        
        return np.array(centroids)

    def step(self, X):
        """ Executes a single step (iteration) of the KMeans algorithm. """
        if self.converged or self.iteration >= self.max_iter:
            return  # Do nothing if already converged or max iterations reached

        # Step 1: Assign points to the nearest centroids
        self.labels = self._assign_clusters(X)
        
        # Step 2: Calculate new centroids
        new_centroids = self._calculate_centroids(X)
        
        # Check if centroids have converged
        if np.allclose(self.centroids, new_centroids):
            self.converged = True  # Algorithm has converged
        else:
            self.centroids = new_centroids
        
        # Increment iteration count
        self.iteration += 1

    def run_to_convergence(self, X):
        """ Runs the KMeans algorithm to convergence. """
        while not self.converged and self.iteration < self.max_iter:
            self.step(X)

    def _init_farthest(self, X):
        #Initializes centroids by selecting the farthest points first.
        centroids = []
        
        # Step 1: Randomly choose the first centroid
        first_centroid_idx = np.random.choice(X.shape[0])
        centroids.append(X[first_centroid_idx])
        
        # Step 2: Iteratively select the farthest points from the chosen centroids
        for _ in range(1, self.k):
            distances = np.array([min(np.linalg.norm(x - c) for c in centroids) for x in X])
            farthest_point_idx = np.argmax(distances)  # Get the index of the farthest point
            centroids.append(X[farthest_point_idx])
        
        return np.array(centroids)
    
    def _init_manual(self, user_centroids):
        """ Initializes centroids based on user input. """
        return np.array(user_centroids)


    def _assign_clusters(self, X):
        distances = np.linalg.norm(X[:, np.newaxis] - self.centroids, axis=2)
        return np.argmin(distances, axis=1)

    def _calculate_centroids(self, X):
        return np.array([X[self.labels == i].mean(axis=0) for i in range(self.k)])

    def predict(self, X):
        return self._assign_clusters(X)
