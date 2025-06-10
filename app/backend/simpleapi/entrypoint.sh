#!/bin/sh

set -e

echo "Making migrations migrations..."
python manage.py makemigrations  --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating superuser (if not exists)..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='user1').exists():
    User.objects.create_superuser('user1', 'user1@capstone.com', 'adminpass')
END

echo "Loading sample data from fixture..."
python manage.py loaddata simpleapi/fixtures/sample_data.json

echo "Starting the server..."
exec python manage.py runserver 0.0.0.0:8000