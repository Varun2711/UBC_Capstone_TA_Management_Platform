#!/bin/sh
set -e

# Add src directory to Python path
export PYTHONPATH=$PYTHONPATH:/app/src

# Remove existing migration files to ensure fresh migrations are created
echo "Removing existing migration files..."
find /app/src/api/migrations -name "*.py" -not -name "__init__.py" -delete
find /app/src/api/migrations -name "*.pyc" -delete

echo "Making migrations for allocations service..."
python manage.py makemigrations --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting Allocations Service..."
exec python manage.py runserver 0.0.0.0:8005