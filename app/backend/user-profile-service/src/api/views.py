from rest_framework import viewsets
from .models import Student, Instructor, TAScheduler
from .serializers import StudentSerializer, InstructorSerializer, TASchedulerSerializer

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

class InstructorViewSet(viewsets.ModelViewSet):
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer

class TASchedulerViewSet(viewsets.ModelViewSet):
    queryset = TAScheduler.objects.all()
    serializer_class = TASchedulerSerializer