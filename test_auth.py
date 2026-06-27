import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'daglu_hub.settings'
import django
django.setup()

from django.contrib.auth import authenticate, get_user_model
User = get_user_model()

print("=== All users ===")
for u in User.objects.all():
    print(f"  {u.username} | role={u.role} | has_usable_password={u.has_usable_password()}")

print("\n=== Testing authenticate() ===")
user = authenticate(username='learner', password='learnerpass123')
print(f"  Result: {user}")

if user is None:
    # Try to check password directly
    try:
        learner = User.objects.get(username='learner')
        print(f"  User exists: {learner}")
        print(f"  check_password('learnerpass123'): {learner.check_password('learnerpass123')}")
        print(f"  is_active: {learner.is_active}")
    except User.DoesNotExist:
        print("  User 'learner' does not exist!")
else:
    print(f"  Login successful for: {user.username} ({user.role})")
