from django.shortcuts import render
from django.http import JsonResponse, HttpRequest
import json
from rest_framework.decorators import api_view, action
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import *
from .serializers import *


#Create your views here.
def hello(request):
    data = {'message': "Hello world! This message is from the Django backend api"}
    # create the response to be sent back
    response = JsonResponse(data)

    # add CORS header to enable response transmission
    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    return response



#refactored function based views to class based views and using viewsets to be consistent with new services
class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'post_date']
    search_fields = ['title', 'description']
    ordering_fields = ['post_date', 'title']

    # Optional: custom action to list only "open" postings
    @action(detail=False, methods=['get'])
    def open(self, request):
        jobs = JobPosting.objects.filter(status='open')
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)
    
    #Prevent deletion of job postings. They can be marked as archived or closed.
    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Deletion of job postings is not allowed."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    

#refactored from function based views to class based views and using viewsets to be consistent with new services
#not sure in which service this will be used, so commented out for now. 
# may pick up in a future task
# class CourseViewSet(viewsets.ModelViewSet):
#     queryset = Course.objects.all()
#     serializer_class = CourseSerializer

#     filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
#     filterset_fields = ['department']
#     search_fields = ['course_number', 'title', 'description']
#     ordering_fields = ['course_number']
   
#     def destroy(self, request, *args, **kwargs):
#         return Response(
#             {"detail": "Deletion of courses is not allowed. Deactivate the course instead via PUT request."},
#             status=status.HTTP_405_METHOD_NOT_ALLOWED
#         )
    
#     @action(detail=True, methods=['put'], url_path='deactivate')
#     def deactivate(self, request, pk=None):
#         try:
#             course = self.get_object()
#             if not course.is_active:
#                 return Response({"detail": "Course is already inactive."}, status=400)

#             course.is_active = False
#             course.save()
#             return Response({"detail": "Course successfully deactivated."}, status=200)
#         except Course.DoesNotExist:
#             return Response({"detail": "Course not found."}, status=404)
    

