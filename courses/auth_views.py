from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .serializers import UserSerializer


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate a user and return an auth token + user profile.

    Request body: { "username": "...", "password": "..." }
    Response:     { "token": "...", "user": { id, username, email, role } }
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response(
            {'error': 'Both username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response(
            {'error': 'Invalid credentials. Please check your username and password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Get or create the DRF auth token for this user
    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {
            'token': token.key,
            'user': UserSerializer(user).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Invalidate the current auth token (logout).
    The client should delete the token from localStorage after this call.
    """
    try:
        request.user.auth_token.delete()
    except Token.DoesNotExist:
        pass  # Already logged out — treat as success

    return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Return the authenticated user's profile.
    Used by the frontend on startup to restore the session from a stored token.
    """
    return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
