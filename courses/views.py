from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from .models import (
    User,
    LearningPath,
    Course,
    Lesson,
    Quiz,
    QuizQuestion,
    QuizOption,
    LessonProgress,
    Certificate
)
from .serializers import (
    UserSerializer,
    LearningPathSerializer,
    CourseSerializer,
    LessonListSerializer,
    LessonDetailSerializer,
    QuizSerializer,
    QuizSubmissionSerializer,
    LessonProgressSerializer,
    CertificateSerializer
)


# --- REST API ViewSets ---


# --- REST API ViewSets ---

class LearningPathViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows learning paths to be viewed.
    Optimized with prefetch_related for nested course and lesson listings.
    """
    queryset = LearningPath.objects.prefetch_related(
        'courses__instructor',
        'courses__lessons'
    ).all()
    serializer_class = LearningPathSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'], url_path='claim-certificate', permission_classes=[IsAuthenticated])
    def claim_certificate(self, request, pk=None):
        """
        Validates progress. If all lessons within the learning path are flagged is_completed,
        it automatically generates a Certificate row and returns the payload.
        """
        learning_path = self.get_object()
        user = request.user

        # Get all lessons associated with courses in this learning path
        lessons = Lesson.objects.filter(course__learning_path=learning_path)
        total_lessons = lessons.count()

        if total_lessons == 0:
            return Response(
                {"error": "This learning path does not have any lessons configured yet."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Count how many of these lessons are marked as completed for this user
        completed_lessons_count = LessonProgress.objects.filter(
            user=user,
            lesson__in=lessons,
            is_completed=True
        ).count()

        if completed_lessons_count < total_lessons:
            return Response(
                {
                    "error": "You have not completed all lessons in this learning path.",
                    "total_lessons_in_path": total_lessons,
                    "completed_lessons_by_user": completed_lessons_count,
                    "remaining_lessons": total_lessons - completed_lessons_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Automatically issue or retrieve the certificate
        certificate, created = Certificate.objects.get_or_create(
            user=user,
            learning_path=learning_path
        )

        serializer = CertificateSerializer(certificate)
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=response_status)


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows courses to be viewed.
    Optimized using select_related and prefetch_related to load lessons and instructors without N+1 queries.
    """
    queryset = Course.objects.select_related(
        'learning_path',
        'instructor'
    ).prefetch_related(
        'lessons'
    ).all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows lessons to be viewed.
    Uses LessonListSerializer for listings and LessonDetailSerializer for retrieve detail requests.
    """
    queryset = Lesson.objects.select_related('course').all()
    serializer_class = LessonListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LessonDetailSerializer
        return super().get_serializer_class()

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieves a lesson. If the user is authenticated, it automatically checks or
        initializes a LessonProgress record for them.
        """
        instance = self.get_object()
        if request.user.is_authenticated:
            # Automatically initialize progress record if it doesn't exist
            LessonProgress.objects.get_or_create(user=request.user, lesson=instance)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='track-progress', permission_classes=[IsAuthenticated])
    def track_progress(self, request, pk=None):
        """
        Updates watched_seconds and automatically marks the lesson as completed
        if the 90% duration milestone has been met.
        """
        lesson = self.get_object()
        user = request.user
        progress, created = LessonProgress.objects.get_or_create(user=user, lesson=lesson)

        watched_seconds = request.data.get('watched_seconds')
        
        if watched_seconds is not None:
            try:
                watched_seconds = int(watched_seconds)
                if watched_seconds < 0:
                    raise ValueError
            except ValueError:
                return Response(
                    {"error": "watched_seconds must be a non-negative integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Bound watched_seconds by total lesson duration
            if watched_seconds > lesson.duration_seconds:
                watched_seconds = lesson.duration_seconds
                
            progress.watched_seconds = watched_seconds

            # Milestone threshold: 90% of total lesson duration
            completion_milestone = int(lesson.duration_seconds * 0.9)
            if watched_seconds >= completion_milestone:
                progress.is_completed = True

        # Allow explicit completed updates if sent by client
        is_completed = request.data.get('is_completed')
        if is_completed is not None:
            progress.is_completed = bool(is_completed)

        progress.save()
        serializer = LessonProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows quizzes and questions to be viewed.
    """
    queryset = Quiz.objects.prefetch_related('questions__options').all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'], url_path='submit', permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        """
        Accepts selected choice IDs, evaluates correctness against the database,
        marks progress, and immediately returns quiz scores and instant explanations.
        """
        quiz = self.get_object()
        serializer = QuizSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        answers = serializer.validated_data.get('answers', [])
        questions = quiz.questions.prefetch_related('options').all()
        total_questions = questions.count()

        if total_questions == 0:
            return Response(
                {"error": "This quiz does not contain any questions to grade."},
                status=status.HTTP_400_BAD_REQUEST
            )

        correct_count = 0
        results = []

        # Convert user choice input payload to lookup dict: {question_id: selected_option_id}
        submitted_map = {ans['question_id']: ans['selected_option_id'] for ans in answers}

        for question in questions:
            # Find the actual correct option ID
            correct_option = question.options.filter(is_correct=True).first()
            correct_option_id = correct_option.id if correct_option else None
            
            selected_option_id = submitted_map.get(question.id)
            is_correct = False

            if selected_option_id is not None:
                # Retrieve the selected option belonging to this question
                selected_option = question.options.filter(id=selected_option_id).first()
                if selected_option and selected_option.is_correct:
                    is_correct = True
                    correct_count += 1

            results.append({
                "question_id": question.id,
                "is_correct": is_correct,
                "correct_option_id": correct_option_id,
                "explanation": question.explanation
            })

        score_percentage = (correct_count / total_questions) * 100
        # Instant feedback logic (80% passing threshold for MVP)
        passed = score_percentage >= 80.0

        return Response({
            "score": f"{int(score_percentage)}%",
            "passed": passed,
            "results": results
        }, status=status.HTTP_200_OK)


class LessonProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for learners to check their progress records.
    """
    serializer_class = LessonProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LessonProgress.objects.filter(user=self.request.user).select_related('lesson', 'user')


class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing certificates issued to the requesting user.
    """
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user).select_related('learning_path', 'user')
