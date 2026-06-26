from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'learning-paths', views.LearningPathViewSet, basename='learningpath')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'lessons', views.LessonViewSet, basename='lesson')
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'progress', views.LessonProgressViewSet, basename='lessonprogress')
router.register(r'certificates', views.CertificateViewSet, basename='certificate')

app_name = 'courses'

urlpatterns = [
    # Include all API viewset URLs under the api/ prefix
    path('api/', include(router.urls)),
    
    # HTML placeholder home page
    path('', views.home_stub, name='home'),
]
