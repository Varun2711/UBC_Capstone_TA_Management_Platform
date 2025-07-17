#!/bin/sh
set -e

# Add src directory to Python path
export PYTHONPATH=$PYTHONPATH:/app/src/

echo "Making migrations for user profile service..."
python manage.py makemigrations --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating superuser (if not exists)..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='user1').exists():
    User.objects.create_superuser('user1', 'user1@capstone.com', 'adminpass')
END

echo "Starting User Profile Service..."
exec python manage.py runserver 0.0.0.0:8004