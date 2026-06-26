from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def home_stub(request):
    """A placeholder home view for the Skill Micro-Courses Hub."""
    return HttpResponse("Welcome to the Skill Micro-Courses Hub MVP!")
