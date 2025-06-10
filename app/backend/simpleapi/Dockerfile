# use official python baseline image
FROM python:3.12-slim

# create the app directory
RUN mkdir /app

# set /app as the working directory
WORKDIR /app

# Set python env variables
# prevent python from writing pyc files to disk
ENV PYTHONDONTWRITEBYTECODE=1
# prevent python for buffering stdout and stderr
ENV PYTHONUNBUFFERED=1

# update pip
RUN pip install --upgrade pip

# copy the requirements file
COPY requirements.txt /app/

#COPY entrypoint.sh /usr/local/bin/
#RUN chmod +x /usr/local/bin/entrypoint.sh
#COPY entrypoint.sh /app/
# Make entrypoint executable

# install all dependecies
RUN pip install --no-cache-dir -r requirements.txt

# copy all files in to the container
COPY . /app/

#RUN chmod +x /app/entrypoint.sh
# Expose Django dev server port
EXPOSE 8000
WORKDIR /app
RUN chmod +x ./entrypoint.sh
# Run the entrypoint script
#ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
#ENTRYPOINT ["./entrypoint.sh"]
#CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
CMD ["./entrypoint.sh"]