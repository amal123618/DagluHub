from django.urls import path
from . import views

app_name = 'courses'

urlpatterns = [
    path('', views.home_stub, name='home'),
]
