from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
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


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Extends Django's native UserAdmin to support the custom 'role' field.
    """
    list_display = BaseUserAdmin.list_display + ('role',)
    list_filter = BaseUserAdmin.list_filter + ('role',)
    
    # Add field to both standard display form and creation form
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Role Configuration', {'fields': ('role',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Role Configuration', {
            'classes': ('wide',),
            'fields': ('role',),
        }),
    )


class CourseInline(admin.TabularInline):
    """
    Allows viewing and adding Courses directly inside a Learning Path's detail page.
    """
    model = Course
    extra = 1
    show_change_link = True
    fields = ('title', 'instructor', 'is_premium')


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    """
    Admin configuration for LearningPath.
    """
    list_display = ('title', 'difficulty_level', 'course_count')
    list_filter = ('difficulty_level',)
    search_fields = ('title', 'description')
    inlines = [CourseInline]

    def course_count(self, obj):
        return obj.courses.count()
    course_count.short_description = 'Number of Courses'


class LessonInline(admin.TabularInline):
    """
    Allows managing Lessons inline directly inside the Course layout.
    """
    model = Lesson
    extra = 2
    fields = ('title', 'duration_seconds', 'sort_order')
    ordering = ('sort_order',)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """
    Admin configuration for Course, showing lessons inline.
    """
    list_display = ('title', 'learning_path', 'instructor', 'is_premium', 'created_at')
    list_filter = ('learning_path', 'is_premium', 'instructor', 'created_at')
    search_fields = ('title', 'description', 'instructor__username')
    inlines = [LessonInline]
    raw_id_fields = ('instructor', 'learning_path')


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    """
    Admin configuration for Lesson.
    """
    list_display = ('title', 'course', 'duration_seconds', 'sort_order')
    list_filter = ('course__learning_path', 'course')
    search_fields = ('title', 'content_text', 'course__title')
    ordering = ('course', 'sort_order')


class QuizQuestionInline(admin.StackedInline):
    """
    Allows managing questions directly inside a Quiz's detail page.
    """
    model = QuizQuestion
    extra = 1
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    """
    Admin configuration for Quiz.
    """
    list_display = ('title', 'lesson')
    search_fields = ('title', 'lesson__title')
    inlines = [QuizQuestionInline]


class QuizOptionInline(admin.TabularInline):
    """
    Allows managing Quiz Options inline directly inside the Quiz Question layout.
    """
    model = QuizOption
    extra = 4  # Standard choice questions have ~4 options
    fields = ('option_text', 'is_correct')


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    """
    Admin configuration for QuizQuestion, showing answer options inline.
    """
    list_display = ('question_text_truncated', 'quiz')
    search_fields = ('question_text', 'quiz__title')
    list_filter = ('quiz',)
    inlines = [QuizOptionInline]

    def question_text_truncated(self, obj):
        return obj.question_text[:75] + '...' if len(obj.question_text) > 75 else obj.question_text
    question_text_truncated.short_description = 'Question Text'


@admin.register(QuizOption)
class QuizOptionAdmin(admin.ModelAdmin):
    """
    Admin configuration for QuizOption.
    """
    list_display = ('option_text', 'question', 'is_correct')
    list_filter = ('is_correct', 'question__quiz')
    search_fields = ('option_text', 'question__question_text')


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    """
    Admin configuration to track and manage user progress on lessons.
    """
    list_display = ('user', 'lesson', 'is_completed', 'watched_seconds', 'completed_at')
    list_filter = ('is_completed', 'completed_at', 'lesson__course')
    search_fields = ('user__username', 'user__email', 'lesson__title')
    raw_id_fields = ('user', 'lesson')
    readonly_fields = ('completed_at',)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    """
    Admin configuration for Certificate management and verification.
    """
    list_display = ('certificate_uuid', 'user', 'learning_path', 'issued_at')
    list_filter = ('learning_path', 'issued_at')
    search_fields = ('certificate_uuid', 'user__username', 'user__email', 'learning_path__title')
    raw_id_fields = ('user', 'learning_path')
    readonly_fields = ('certificate_uuid', 'issued_at')
