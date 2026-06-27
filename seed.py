import os
import django
import uuid
from django.utils import timezone

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'daglu_hub.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import (
    LearningPath, Course, Lesson, LessonProgress, Quiz, QuizQuestion, QuizOption, Certificate
)

User = get_user_model()

def seed_database():
    print("Seeding database with EdTech MVP dummy data...")

    # 1. Create Users
    # Admin User
    admin, created = User.objects.get_or_create(
        username="admin",
        defaults={"email": "admin@dagluhub.edu", "is_staff": True, "is_superuser": True, "role": "admin"}
    )
    admin.set_password("adminpass123")
    admin.save()
    print(f"{'Created' if created else 'Updated'} Admin user: admin / adminpass123")

    # Instructor User
    instructor, created = User.objects.get_or_create(
        username="instructor_alice",
        defaults={"email": "alice@dagluhub.edu", "role": "instructor"}
    )
    instructor.set_password("instructor123")
    instructor.save()
    print(f"{'Created' if created else 'Updated'} Instructor user: instructor_alice / instructor123")

    # Learner User
    learner, created = User.objects.get_or_create(
        username="learner",
        defaults={"email": "learner@dagluhub.edu", "role": "learner"}
    )
    learner.set_password("learnerpass123")
    learner.save()
    print(f"{'Created' if created else 'Updated'} Learner user: learner / learnerpass123")


    # 2. Create Learning Path
    path, created = LearningPath.objects.get_or_create(
        title="AI Tools & Automation",
        defaults={
            "description": "Master how to use ChatGPT, Midjourney, and AI agent platforms to automate workflows.",
            "difficulty_level": "Intermediate"
        }
    )
    if created:
        print(f"Created Learning Path: {path.title}")

    # 3. Create Course
    course, created = Course.objects.get_or_create(
        title="AI Tools for Productivity",
        defaults={
            "learning_path": path,
            "instructor": instructor,
            "description": "Learn to 10x your professional output using cutting-edge AI frameworks.",
            "thumbnail": "https://lh3.googleusercontent.com/aida-public/AB6AXuCwPFOs2sInGaT1LsnE4fbGW2WjbdgFVMTettwHKlQzJPdKzWW5Loa6quJZPGzTdZwgm29QTtz_IKlzc6Tin2MHXBn17AzfczV8tlo8UGrr7NcQ04DGg4yedlgakbaSAR1EgiKC7aQdykuUFwd_i1-7DGgEz02G6g-3KFVrS38W2WqxjHUsGuZcQspNOth123vERN4_XbJVc1piXtAerxs6xoVEFy9Som7gG3XkVmU_SE85cX4DUQHA7MqgPorpmQHb9joBG6_ylfS_",
            "is_premium": False
        }
    )
    if created:
        print(f"Created Course: {course.title}")

    # 4. Create Lessons
    lesson1, created = Lesson.objects.get_or_create(
        course=course,
        sort_order=1,
        defaults={
            "title": "Introduction to AI Prompting",
            "content_text": "Prompting is the core skill of interfacing with LLMs. Learn about roles, constraints, and framing.",
            "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", # Sample public video URL
            "duration_seconds": 300
        }
    )
    if created:
        print(f"Created Lesson 1: {lesson1.title}")

    lesson2, created = Lesson.objects.get_or_create(
        course=course,
        sort_order=2,
        defaults={
            "title": "System Personas and Boundaries",
            "content_text": "Deep dive into system prompts and setting boundaries to control outputs.",
            "video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
            "duration_seconds": 420
        }
    )
    if created:
        print(f"Created Lesson 2: {lesson2.title}")

    # 5. Create Quiz for Lesson 1
    quiz, created = Quiz.objects.get_or_create(
        lesson=lesson1,
        defaults={"title": "Introduction to AI Prompting Quiz"}
    )
    if created:
        print(f"Created Quiz for {lesson1.title}")

        # Quiz Questions
        q1 = QuizQuestion.objects.create(
            quiz=quiz,
            question_text="Which parameter dictates output randomness in LLM text generation?",
            explanation="Temperature controls the creativity or randomness of the LLM responses. Lower values are deterministic."
        )
        QuizOption.objects.create(question=q1, option_text="Temperature", is_correct=True)
        QuizOption.objects.create(question=q1, option_text="Max Tokens", is_correct=False)
        QuizOption.objects.create(question=q1, option_text="Frequency Penalty", is_correct=False)

        q2 = QuizQuestion.objects.create(
            quiz=quiz,
            question_text="What is zero-shot prompting?",
            explanation="Zero-shot prompting feeds the model a prompt without providing any context examples."
        )
        QuizOption.objects.create(question=q2, option_text="Prompting without examples", is_correct=True)
        QuizOption.objects.create(question=q2, option_text="Prompting with 1 example", is_correct=False)
        QuizOption.objects.create(question=q2, option_text="Prompting with infinite examples", is_correct=False)

    # 6. Create LessonProgress records
    p1, created = LessonProgress.objects.get_or_create(
        user=learner,
        lesson=lesson1,
        defaults={
            "is_completed": True,
            "watched_seconds": 300,
            "completed_at": timezone.now()
        }
    )
    if created:
        print("Created completed progress record for Lesson 1.")

    p2, created = LessonProgress.objects.get_or_create(
        user=learner,
        lesson=lesson2,
        defaults={
            "is_completed": False,
            "watched_seconds": 150
        }
    )
    if created:
        print("Created in-progress record for Lesson 2 (150s watched).")

    # 7. Create Certificate (completed path)
    # We can issue one for learner to demonstrate the UI certificates
    cert, created = Certificate.objects.get_or_create(
        user=learner,
        learning_path=path,
        defaults={
            "certificate_uuid": uuid.uuid4(),
            "issued_at": timezone.now()
        }
    )
    if created:
        print(f"Issued sample Certificate to learner for '{path.title}'")

    print("\nDatabase seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
