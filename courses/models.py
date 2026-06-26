import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class User(AbstractUser):
    """
    Custom user model representing learners, instructors, and admins.
    """
    ROLE_CHOICES = [
        ('learner', 'Learner'),
        ('instructor', 'Instructor'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='learner',
        help_text="The role of the user on the platform."
    )

    class Meta:
        ordering = ['username']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class LearningPath(models.Model):
    """
    Represents a structured path of learning comprising multiple courses.
    """
    DIFFICULTY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]
    title = models.CharField(
        max_length=255,
        help_text="Title of the learning path."
    )
    description = models.TextField(
        help_text="Detailed description of what this learning path covers."
    )
    difficulty_level = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        help_text="Target difficulty level of the learning path."
    )

    class Meta:
        ordering = ['title']
        verbose_name = "Learning Path"
        verbose_name_plural = "Learning Paths"

    def __str__(self):
        return self.title


class Course(models.Model):
    """
    Represents an individual course belonging to a learning path and taught by an instructor.
    """
    learning_path = models.ForeignKey(
        LearningPath,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
        help_text="The learning path this course belongs to."
    )
    instructor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'instructor'},
        related_name='courses_taught',
        help_text="The instructor teaching this course (limited to users with role='instructor')."
    )
    title = models.CharField(
        max_length=255,
        help_text="Title of the course."
    )
    description = models.TextField(
        help_text="Detailed course description."
    )
    thumbnail = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL pointing to the course thumbnail image."
    )
    is_premium = models.BooleanField(
        default=False,
        help_text="Designates whether this course requires a premium subscription."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the course was created."
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Lesson(models.Model):
    """
    A single, bite-sized lesson (3-10 minutes) belonging to a course.
    """
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='lessons',
        help_text="The course this lesson belongs to."
    )
    title = models.CharField(
        max_length=255,
        help_text="Title of the lesson."
    )
    content_text = models.TextField(
        blank=True,
        null=True,
        help_text="Written course material for this lesson (optional)."
    )
    video_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL to the video content for this lesson (optional)."
    )
    duration_seconds = models.PositiveIntegerField(
        validators=[
            MinValueValidator(180, message="Bite-sized lesson duration must be at least 3 minutes (180 seconds)."),
            MaxValueValidator(600, message="Bite-sized lesson duration must not exceed 10 minutes (600 seconds).")
        ],
        help_text="Lesson duration in seconds (must be between 3 to 10 minutes: 180s - 600s)."
    )
    sort_order = models.PositiveIntegerField(
        help_text="Order in which this lesson appears in the course."
    )

    class Meta:
        unique_together = ('course', 'sort_order')
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.course.title} - Lesson {self.sort_order}: {self.title}"


class Quiz(models.Model):
    """
    A single quiz associated with a lesson to test learners' understanding.
    """
    lesson = models.OneToOneField(
        Lesson,
        on_delete=models.CASCADE,
        related_name='quiz',
        help_text="The lesson associated with this quiz."
    )
    title = models.CharField(
        max_length=255,
        help_text="Title of the quiz."
    )

    class Meta:
        verbose_name_plural = "Quizzes"

    def __str__(self):
        return f"Quiz: {self.title} ({self.lesson.title})"


class QuizQuestion(models.Model):
    """
    A single question within a quiz.
    """
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
        help_text="The quiz this question belongs to."
    )
    question_text = models.TextField(
        help_text="The text of the question."
    )
    explanation = models.TextField(
        help_text="Explanation of the correct answer to provide instant learner feedback."
    )

    class Meta:
        verbose_name = "Quiz Question"
        verbose_name_plural = "Quiz Questions"

    def __str__(self):
        return f"Question: {self.question_text[:50]}..."


class QuizOption(models.Model):
    """
    An answer option for a quiz question.
    """
    question = models.ForeignKey(
        QuizQuestion,
        on_delete=models.CASCADE,
        related_name='options',
        help_text="The quiz question this option belongs to."
    )
    option_text = models.CharField(
        max_length=255,
        help_text="The text content of the answer option."
    )
    is_correct = models.BooleanField(
        default=False,
        help_text="Check if this option is the correct answer."
    )

    class Meta:
        verbose_name = "Quiz Option"
        verbose_name_plural = "Quiz Options"

    def __str__(self):
        return f"{self.option_text} ({'Correct' if self.is_correct else 'Incorrect'})"


class LessonProgress(models.Model):
    """
    Tracks a user's progress through a specific lesson.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lesson_progress',
        help_text="The user studying the lesson."
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='progress_records',
        help_text="The lesson being tracked."
    )
    is_completed = models.BooleanField(
        default=False,
        help_text="True if the user has completed this lesson."
    )
    watched_seconds = models.PositiveIntegerField(
        default=0,
        help_text="Number of seconds the user has watched of the lesson video."
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="The timestamp when this lesson was completed by the user."
    )

    class Meta:
        unique_together = ('user', 'lesson')
        verbose_name = "Lesson Progress"
        verbose_name_plural = "Lesson Progresses"

    def save(self, *args, **kwargs):
        # Automatically set completed_at timestamp if marked completed and not already set
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.user.username} - {self.lesson.title}: {status}"


class Certificate(models.Model):
    """
    Automated certificate issued to a user upon completing a learning path.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='certificates',
        help_text="The user receiving the certificate."
    )
    learning_path = models.ForeignKey(
        LearningPath,
        on_delete=models.CASCADE,
        related_name='certificates',
        help_text="The completed learning path."
    )
    certificate_uuid = models.UUIDField(
        unique=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique, immutable identifier for the certificate verification."
    )
    issued_at = models.DateTimeField(
        default=timezone.now,
        help_text="Timestamp when the certificate was issued."
    )

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return f"Certificate {self.certificate_uuid} for {self.user.username} ({self.learning_path.title})"
