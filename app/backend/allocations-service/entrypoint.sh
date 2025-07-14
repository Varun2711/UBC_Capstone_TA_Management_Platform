#!/bin/sh
set -e

# Add src directory to Python path
export PYTHONPATH=$PYTHONPATH:/app/src

echo "Making migrations for allocations service..."
python manage.py makemigrations --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting Allocations Service..."
exec python manage.py runserver 0.0.0.0:8005