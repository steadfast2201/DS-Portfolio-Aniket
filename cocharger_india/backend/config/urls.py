from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from bookings.views import (
    UserProfileViewSet,
    VehicleViewSet,
    ChargerViewSet,
    BookingViewSet,
    verify_gate_pass,
    host_analytics,
    auth_login,
    auth_register,
)


@api_view(['GET'])
def backend_root_status(request):
    """
    Pure Backend API Root (Port 8000).
    The UI lives exclusively on the React Frontend (http://localhost:5173).
    """
    return Response({
        'service': 'ChargePe24 — Django REST Backend API',
        'status': 'online',
        'database': 'PostgreSQL (project_aniket)',
        'frontend_url': 'http://localhost:5173',
        'endpoints': {
            'auth_login': 'http://127.0.0.1:8000/api/auth/login/',
            'auth_register': 'http://127.0.0.1:8000/api/auth/register/',
            'chargers': 'http://127.0.0.1:8000/api/chargers/',
            'bookings': 'http://127.0.0.1:8000/api/bookings/',
            'profiles': 'http://127.0.0.1:8000/api/profiles/',
            'vehicles': 'http://127.0.0.1:8000/api/vehicles/',
            'verify_gate_pass': 'http://127.0.0.1:8000/api/verify-gate-pass/',
            'host_analytics': 'http://127.0.0.1:8000/api/host-analytics/',
            'django_admin': 'http://127.0.0.1:8000/admin/',
        }
    })


router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet, basename='profile')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'chargers', ChargerViewSet, basename='charger')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', backend_root_status, name='backend-root'),
    path('admin/', admin.site.urls),
    path('api/auth/login/', auth_login, name='auth-login'),
    path('api/auth/register/', auth_register, name='auth-register'),
    path('api/verify-gate-pass/', verify_gate_pass, name='verify-gate-pass'),
    path('api/host-analytics/', host_analytics, name='host-analytics'),
    path('api/', include(router.urls)),
]
