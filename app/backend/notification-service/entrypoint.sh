#!/bin/sh
set -e

# Add src directory to Python path
export PYTHONPATH=$PYTHONPATH:/app/src

echo "Waiting for database to be ready..."
# This is a simple wait, you might need a more robust solution if it fails
sleep 10

# Create database migrations
echo "Making migrations for notification service..."
python manage.py makemigrations notification_api

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Start server
echo "Starting server..."
exec python manage.py runserver 0.0.0.0:8006