from django.shortcuts import render
from django.http import JsonResponse, HttpRequest
import json


#Create your views here.
def hello(request):
    data = {'message': "Hello world! This message is from the Django backend api"}
    # create the response to be sent back
    response = JsonResponse(data)
    # add CORS header to enable response transmission
    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    return response
