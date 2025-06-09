from django.shortcuts import render, HttpResponse
import json
# Create your views here.
def hello(request):
    data = {'message': "Hello world! This message is from the Django backend api"}
    response =  HttpResponse(json.dumps(data), headers={
        "Content-Type": "application/json"
    })

    response["Access-Control-Allow-Origin"] = "http://localhost:5173"

    return response