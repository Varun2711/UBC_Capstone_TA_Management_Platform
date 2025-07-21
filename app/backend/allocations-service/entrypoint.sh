#!/bin/sh
set -e

# Add src directory to Python path
export PYTHONPATH=$PYTHONPATH:/app/src

echo "Removing existing migration files" 
find /app/src/api/migrations -name "*.py" -not -name "__init__.py" -delete

echo "Making migrations for the allocations service..."
python manage.py makemigrations allocations_api --noinput

echo "Running migrations..."
python manage.py migrate allocations_api --noinput

echo "Creating superuser (if not exists)..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='user1').exists():
    User.objects.create_superuser('user1', 'user1@capstone.com', 'adminpass')
END

echo "Starting Allocations Service..."
exec python manage.py runserver 0.0.0.0:8005