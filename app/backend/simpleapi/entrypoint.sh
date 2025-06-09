#!/bin/sh

echo "Making migrations migrations..."
python manage.py makemigrations 

echo "Running migrations..."
python manage.py migrate 

echo "Starting the server..."
python manage.py runserver 0.0.0.0:8000