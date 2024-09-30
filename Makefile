install:
	pip install -r requirements.txt

run:
	python app.py &
	sleep 5  # Wait for 5 seconds to allow the server to fully start