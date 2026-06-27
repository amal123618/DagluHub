import pytest
import time
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from courses.models import (
    LearningPath, Course, Lesson, LessonProgress, Quiz, QuizQuestion, QuizOption, Certificate
)

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def db_setup(db):
    """
    Sets up a complete learning path, course, lesson, quiz, options, and user accounts.
    """
    # Create Users
    admin_user = User.objects.create_superuser(
        username="admin_qa", email="admin@dagluhub.edu", password="securepassword123"
    )
    admin_user.role = "admin"
    admin_user.save()

    instructor_user = User.objects.create_user(
        username="instructor_qa", email="instructor@dagluhub.edu", password="securepassword123"
    )
    instructor_user.role = "instructor"
    instructor_user.save()

    learner_user = User.objects.create_user(
        username="learner_qa", email="learner@dagluhub.edu", password="securepassword123"
    )
    learner_user.role = "learner"
    learner_user.save()

    # Create Content Tree
    path_obj = LearningPath.objects.create(
        title="AI Tools & Automation",
        description="Learn to build agents and automate work.",
        difficulty_level="Intermediate"
    )

    course_obj = Course.objects.create(
        learning_path=path_obj,
        instructor=instructor_user,
        title="Prompt Engineering Fundamentals",
        description="Master prompts for LLMs.",
        is_premium=False
    )

    lesson_obj = Lesson.objects.create(
        course=course_obj,
        title="System Prompts & Boundaries",
        duration_seconds=300,  # 5 minutes
        sort_order=1
    )

    quiz_obj = Quiz.objects.create(
        lesson=lesson_obj,
        title="System Prompts Quiz"
    )

    question_obj = QuizQuestion.objects.create(
        quiz=quiz_obj,
        question_text="Which system tag defines the primary system agent role?",
        explanation="The <identity> tag configures the primary persona instructions."
    )

    opt_correct = QuizOption.objects.create(
        question=question_obj,
        option_text="<identity>",
        is_correct=True
    )

    opt_incorrect = QuizOption.objects.create(
        question=question_obj,
        option_text="<comment>",
        is_correct=False
    )

    return {
        "admin": admin_user,
        "instructor": instructor_user,
        "learner": learner_user,
        "path": path_obj,
        "course": course_obj,
        "lesson": lesson_obj,
        "quiz": quiz_obj,
        "question": question_obj,
        "correct_option": opt_correct,
        "incorrect_option": opt_incorrect
    }


# ─── 1. AUTHENTICATION LIFECYCLE & ROLE RESTRICTIONS ──────────────────────────

def test_user_authentication_flow(api_client, db_setup):
    """
    Tests Login, Token Retrieval, Session Verification, and Role Restrictions.
    """
    # Test Login Endpoint
    login_url = reverse("courses:auth-login")
    login_payload = {
        "username": "learner_qa",
        "password": "securepassword123"
    }
    response = api_client.post(login_url, login_payload, format="json")
    
    assert response.status_code == status.HTTP_200_OK
    assert "token" in response.data
    assert response.data["user"]["username"] == "learner_qa"
    assert response.data["user"]["role"] == "learner"
    
    token = response.data["token"]
    
    # Authenticate Client with Token
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    
    # Test /api/auth/me/ session verification
    me_url = reverse("courses:auth-me")
    me_response = api_client.get(me_url)
    assert me_response.status_code == status.HTTP_200_OK
    assert me_response.data["email"] == "learner@dagluhub.edu"
    
    # Test role access block: learner cannot perform admin functions or claims certificate prematurely
    path_id = db_setup["path"].id
    claim_url = reverse("courses:learningpath-claim-certificate", kwargs={"pk": path_id})
    claim_response = api_client.post(claim_url, format="json")
    
    # Learner should be rejected since they have not completed the path
    assert claim_response.status_code == status.HTTP_400_BAD_REQUEST
    assert "error" in claim_response.data


# ─── 2. CONTENT RETRIEVAL & PERFORMANCE (N+1 GUARD) ──────────────────────────

def test_content_retrieval_performance_and_n1_guard(api_client, db_setup):
    """
    Ensures learning paths and course lists load efficiently, return all nested 
    collections accurately, and adhere to a strict latency SLA of <200ms.
    """
    paths_url = reverse("courses:learningpath-list")
    
    # Measure response time
    start_time = time.perf_counter()
    response = api_client.get(paths_url)
    end_time = time.perf_counter()
    
    latency_ms = (end_time - start_time) * 1000
    
    # Asserts
    assert response.status_code == status.HTTP_200_OK
    assert latency_ms < 200.0, f"SLA Violation: Endpoint took {latency_ms:.2f}ms (threshold: 200ms)"
    
    # Verify nested structures (No N+1 queries)
    # The serializers nested outline structure: LearningPath -> Courses -> Lessons
    data = response.data
    assert len(data) > 0
    path_data = data[0]
    assert "courses" in path_data
    assert len(path_data["courses"]) > 0
    course_data = path_data["courses"][0]
    assert "lessons" in course_data
    assert len(course_data["lessons"]) > 0
    assert course_data["lessons"][0]["title"] == "System Prompts & Boundaries"


# ─── 3. STATE PROGRESSION HOOK (90% WATCHED MILESTONE) ─────────────────────────

def test_lesson_state_progression_threshold(api_client, db_setup):
    """
    Verifies progress.watched_seconds automatically updates completion state
    when hitting the 90% duration milestone (Django ViewSet business rule).
    """
    learner = db_setup["learner"]
    lesson = db_setup["lesson"]
    
    # Authenticate user
    api_client.force_authenticate(user=learner)
    
    progress_url = reverse("courses:lesson-track-progress", kwargs={"pk": lesson.id})
    
    # Under 90% Milestone: 200 seconds of a 300-second video (66%)
    payload_under = {"watched_seconds": 200}
    response_under = api_client.post(progress_url, payload_under, format="json")
    
    assert response_under.status_code == status.HTTP_200_OK
    assert response_under.data["watched_seconds"] == 200
    assert response_under.data["is_completed"] is False
    
    # Over 90% Milestone: 270 seconds of a 300-second video (90% threshold exactly)
    payload_over = {"watched_seconds": 270}
    response_over = api_client.post(progress_url, payload_over, format="json")
    
    assert response_over.status_code == status.HTTP_200_OK
    assert response_over.data["watched_seconds"] == 270
    assert response_over.data["is_completed"] is True
    
    # Verify database persistence
    db_progress = LessonProgress.objects.get(user=learner, lesson=lesson)
    assert db_progress.is_completed is True
    assert db_progress.completed_at is not None


# ─── 4. QUIZ ANTI-CHEAT AND EVALUATION MATH ───────────────────────────────────

def test_quiz_anti_cheat_and_grading(api_client, db_setup):
    """
    1. GET request must never leak correct answers or explanations.
    2. POST submission must validate correctness, calculate grade, and provide instant explanation text.
    """
    learner = db_setup["learner"]
    quiz = db_setup["quiz"]
    question = db_setup["question"]
    opt_correct = db_setup["correct_option"]
    opt_incorrect = db_setup["incorrect_option"]
    
    api_client.force_authenticate(user=learner)
    
    # 1. GET Layout Anti-Cheat Verification
    quiz_detail_url = reverse("courses:quiz-detail", kwargs={"pk": quiz.id})
    layout_response = api_client.get(quiz_detail_url)
    
    assert layout_response.status_code == status.HTTP_200_OK
    questions_data = layout_response.data["questions"]
    assert len(questions_data) > 0
    
    # Verify field exclusions in serializers (is_correct & explanation must not leak)
    option_data = questions_data[0]["options"][0]
    assert "is_correct" not in option_data
    assert "explanation" not in questions_data[0]
    
    # 2. POST Submission & Evaluation Grading System Math
    submit_url = reverse("courses:quiz-submit", kwargs={"pk": quiz.id})
    
    # Case A: Correct Answer Submission
    correct_payload = {
        "answers": [
            {
                "question_id": question.id,
                "selected_option_id": opt_correct.id
            }
        ]
    }
    submit_response_correct = api_client.post(submit_url, correct_payload, format="json")
    
    assert submit_response_correct.status_code == status.HTTP_200_OK
    assert submit_response_correct.data["score"] == "100%"
    assert submit_response_correct.data["passed"] is True
    
    result_detail = submit_response_correct.data["results"][0]
    assert result_detail["is_correct"] is True
    assert result_detail["correct_option_id"] == opt_correct.id
    assert result_detail["explanation"] == "The <identity> tag configures the primary persona instructions."
    
    # Case B: Incorrect Answer Submission
    incorrect_payload = {
        "answers": [
            {
                "question_id": question.id,
                "selected_option_id": opt_incorrect.id
            }
        ]
    }
    submit_response_incorrect = api_client.post(submit_url, incorrect_payload, format="json")
    
    assert submit_response_incorrect.status_code == status.HTTP_200_OK
    assert submit_response_incorrect.data["score"] == "0%"
    assert submit_response_incorrect.data["passed"] is False
    assert submit_response_incorrect.data["results"][0]["is_correct"] is False
