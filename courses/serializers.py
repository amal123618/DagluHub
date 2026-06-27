from rest_framework import serializers
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


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer representing the user profile data.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
        read_only_fields = ['id', 'role']


class LessonListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for displaying lessons in a list (e.g. inside course outlines).
    """
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'duration_seconds', 'sort_order']


class LessonDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer revealing full lesson content, video URL, and whether it has an associated quiz.
    """
    has_quiz = serializers.SerializerMethodField()
    quiz_id = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 
            'course', 
            'title', 
            'content_text', 
            'video_url', 
            'duration_seconds', 
            'sort_order', 
            'has_quiz',
            'quiz_id'
        ]

    def get_has_quiz(self, obj):
        return hasattr(obj, 'quiz')

    def get_quiz_id(self, obj):
        return obj.quiz.id if hasattr(obj, 'quiz') else None



class CourseSerializer(serializers.ModelSerializer):
    """
    Detailed serializer including the full outline of lesson listings nested inside the course.
    """
    lessons = LessonListSerializer(many=True, read_only=True)
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 
            'learning_path', 
            'instructor', 
            'instructor_name', 
            'title', 
            'description', 
            'thumbnail', 
            'is_premium', 
            'created_at', 
            'lessons'
        ]


class LearningPathSerializer(serializers.ModelSerializer):
    """
    Serializer representing learning paths with nested lists of corresponding courses.
    """
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = LearningPath
        fields = ['id', 'title', 'description', 'difficulty_level', 'courses']


class QuizOptionSerializer(serializers.ModelSerializer):
    """
    Serializer representing answer options. Crucially, is_correct is excluded to prevent frontend leaks.
    """
    class Meta:
        model = QuizOption
        fields = ['id', 'option_text']


class QuizQuestionSerializer(serializers.ModelSerializer):
    """
    Serializer representing quiz questions. Excludes explanation and is_correct to prevent leaks.
    """
    options = QuizOptionSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'options']


class QuizSerializer(serializers.ModelSerializer):
    """
    Serializer representing a quiz with nested questions and options.
    """
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'lesson', 'questions']


class QuizAnswerInputSerializer(serializers.Serializer):
    """
    Input serializer representing a single quiz question response submission.
    """
    question_id = serializers.IntegerField(required=True)
    selected_option_id = serializers.IntegerField(required=True)


class QuizSubmissionSerializer(serializers.Serializer):
    """
    Write-only serializer validating a payload of question answers.
    """
    answers = QuizAnswerInputSerializer(many=True, required=True)


class LessonProgressSerializer(serializers.ModelSerializer):
    """
    Serializer for tracking user progress through specific lessons.
    """
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id', 
            'user', 
            'lesson', 
            'lesson_title', 
            'is_completed', 
            'watched_seconds', 
            'completed_at'
        ]
        read_only_fields = ['id', 'user', 'completed_at']


class CertificateSerializer(serializers.ModelSerializer):
    """
    Serializer representing issued learning path completion certificates.
    """
    learning_path_title = serializers.CharField(source='learning_path.title', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 
            'certificate_uuid', 
            'user', 
            'username', 
            'learning_path', 
            'learning_path_title', 
            'issued_at'
        ]
        read_only_fields = ['id', 'certificate_uuid', 'issued_at']
