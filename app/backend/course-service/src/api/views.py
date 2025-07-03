from rest_framework import generics
from .models import AcademicTerm
from .serializers import AcademicTermSerializer, AcademicTermCreateSerializer

# Create your views here.

# Academic terms view sets

class AcademicTermCreateView(generics.CreateAPIView):
    queryset = AcademicTerm.objects.all()
    serializer_class = AcademicTermCreateSerializer

class AcademicTermListView(generics.ListAPIView):
    queryset = AcademicTerm.objects.all()
    serializer_class = AcademicTermSerializer

class AcademicTermDetailView(generics.RetrieveAPIView):
    queryset = AcademicTerm.objects.all()
    serializer_class = AcademicTermSerializer
    lookup_field = 'term_id'
    

