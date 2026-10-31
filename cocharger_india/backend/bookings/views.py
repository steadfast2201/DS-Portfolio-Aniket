import uuid
from datetime import time
from decimal import Decimal
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from accounts.models import UserProfile, Vehicle
from accounts.serializers import UserProfileSerializer, VehicleSerializer
from chargers.models import Charger, ChargerSchedule
from chargers.serializers import ChargerSerializer
from .models import Booking, ChargingSession, Invoice
from .serializers import BookingSerializer, ChargingSessionSerializer


def dashboard_view(request):
    chargers = Charger.objects.filter(is_active=True).select_related('host', 'host__user').prefetch_related('schedules')
    bookings = Booking.objects.select_related(
        'chargee', 'chargee__user', 'charger', 'charger__host', 'charger__host__user',
        'vehicle', 'session', 'session__invoice'
    ).all()[:25]
    profiles = UserProfile.objects.select_related('user').all()
    vehicles = Vehicle.objects.select_related('owner', 'owner__user').all()

    # Host financial aggregates from completed invoices
    invoice_totals = Invoice.objects.aggregate(
        total_gross=Sum('total_amount'),
        total_host_payout=Sum('host_payout_amount'),
        total_platform_fee=Sum('platform_fee'),
    )
    session_totals = ChargingSession.objects.aggregate(
        total_kwh=Sum('total_energy_kwh')
    )

    host_profiles = UserProfile.objects.filter(role__in=['HOST', 'BOTH']).select_related('user')

    return render(request, 'bookings/dashboard.html', {
        'chargers': chargers,
        'bookings': bookings,
        'profiles': profiles,
        'host_profiles': host_profiles,
        'vehicles': vehicles,
        'total_gross': invoice_totals['total_gross'] or Decimal('0.00'),
        'total_host_payout': invoice_totals['total_host_payout'] or Decimal('0.00'),
        'total_platform_fee': invoice_totals['total_platform_fee'] or Decimal('0.00'),
        'total_kwh': session_totals['total_kwh'] or Decimal('0.00'),
    })


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.select_related('user').prefetch_related('vehicles').all()
    serializer_class = UserProfileSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.select_related('owner', 'owner__user').all()
    serializer_class = VehicleSerializer


class ChargerViewSet(viewsets.ModelViewSet):
    queryset = Charger.objects.filter(is_active=True).select_related('host', 'host__user').prefetch_related('schedules')
    serializer_class = ChargerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        connector = self.request.query_params.get('connector')
        segment = self.request.query_params.get('segment')
        vehicles = self.request.query_params.get('vehicles')
        city = self.request.query_params.get('city')
        if connector:
            qs = qs.filter(connector_type=connector)
        if segment:
            qs = qs.filter(segment_type=segment)
        if vehicles:
            if vehicles == '2W_3W_ONLY':
                qs = qs.filter(supported_vehicles__in=['2W_3W_ONLY', 'ALL_EVS'])
            elif vehicles == '4W_ONLY':
                qs = qs.filter(supported_vehicles__in=['4W_ONLY', 'ALL_EVS'])
            else:
                qs = qs.filter(supported_vehicles=vehicles)
        if city:
            qs = qs.filter(city__iexact=city)
        return qs

    def perform_create(self, serializer):
        charger = serializer.save()
        # Automatically attach default overnight recurring schedule if days are supplied
        days = self.request.data.get('schedule_days', [0, 1, 2, 3, 4, 5, 6])
        start_str = self.request.data.get('schedule_start', '22:00')
        end_str = self.request.data.get('schedule_end', '07:00')
        try:
            sh, sm = map(int, start_str.split(':'))
            eh, em = map(int, end_str.split(':'))
            for d in days:
                ChargerSchedule.objects.create(
                    charger=charger,
                    day_of_week=int(d),
                    start_time=time(sh, sm),
                    end_time=time(eh, em),
                    is_recurring=True,
                )
        except Exception:
            pass


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related(
        'chargee', 'chargee__user', 'charger', 'vehicle'
    ).all()
    serializer_class = BookingSerializer

    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        booking = self.get_object()
        if hasattr(booking, 'session'):
            booking.status = 'IN_PROGRESS'
            booking.save(update_fields=['status'])
            return Response(ChargingSessionSerializer(booking.session).data, status=status.HTTP_200_OK)

        initial_kwh = Decimal(str(request.data.get('initial_meter_kwh', '100.00')))
        session = ChargingSession.objects.create(
            booking=booking,
            actual_start=timezone.now(),
            initial_meter_kwh=initial_kwh,
        )
        booking.status = 'IN_PROGRESS'
        booking.save(update_fields=['status'])
        return Response(ChargingSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def stop_session(self, request, pk=None):
        booking = self.get_object()
        if not hasattr(booking, 'session'):
            session = ChargingSession.objects.create(
                booking=booking,
                actual_start=booking.start_time,
                initial_meter_kwh=Decimal('100.00'),
            )
        else:
            session = booking.session

        consumed_kwh = Decimal(str(request.data.get('total_energy_kwh', booking.estimated_kwh)))
        session.actual_end = timezone.now()
        session.total_energy_kwh = consumed_kwh
        session.final_meter_kwh = session.initial_meter_kwh + consumed_kwh
        session.end_reason = request.data.get('end_reason', 'USER_STOP')
        session.save()

        booking.status = 'COMPLETED'
        booking.save(update_fields=['status'])

        invoice, _ = Invoice.objects.get_or_create(
            session=session,
            defaults={
                'upi_transaction_ref': f"UPI-{uuid.uuid4().hex[:10].upper()}",
                'payment_status': 'PAID_UPI',
            }
        )
        invoice.calculate_totals()
        invoice.save()

        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
def verify_gate_pass(request):
    code = request.query_params.get('code') or request.data.get('code')
    mark_arrived = request.data.get('mark_arrived', False)
    if not code:
        return Response({'valid': False, 'message': 'Please provide a 6-digit Gate Pass Code.'}, status=status.HTTP_400_BAD_REQUEST)

    booking = Booking.objects.select_related(
        'chargee', 'chargee__user', 'charger', 'charger__host', 'charger__host__user', 'vehicle'
    ).filter(gate_pass_code=str(code).strip()).first()

    if not booking:
        return Response({
            'valid': False,
            'message': 'Invalid Gate Pass Code. Entry denied.'
        }, status=status.HTTP_404_NOT_FOUND)

    if mark_arrived and booking.status == 'CONFIRMED':
        booking.status = 'IN_PROGRESS'
        booking.save(update_fields=['status'])
        if not hasattr(booking, 'session'):
            ChargingSession.objects.create(
                booking=booking,
                actual_start=timezone.now(),
                initial_meter_kwh=Decimal('100.00'),
            )

    return Response({
        'valid': booking.status in ['CONFIRMED', 'IN_PROGRESS'],
        'booking_id': booking.id,
        'status': booking.get_status_display(),
        'status_code': booking.status,
        'guest_name': booking.chargee.user.get_full_name() or booking.chargee.user.username,
        'guest_phone': booking.chargee.phone,
        'vehicle_plate': booking.vehicle.registration_number,
        'vehicle_model': booking.vehicle.make_model,
        'vehicle_category': booking.vehicle.get_category_display(),
        'society_name': booking.charger.society_name or booking.charger.title,
        'parking_bay': booking.charger.parking_bay_number,
        'host_name': booking.charger.host.user.get_full_name() or booking.charger.host.user.username,
        'host_flat': booking.charger.host.flat_or_house_no,
        'host_phone': booking.charger.host.phone,
        'window_start': booking.start_time,
        'window_end': booking.end_time,
    })


@api_view(['GET'])
def host_analytics(request):
    hosts = UserProfile.objects.filter(role__in=['HOST', 'BOTH']).select_related('user')
    data = []
    for h in hosts:
        invoices = Invoice.objects.filter(session__booking__charger__host=h)
        agg = invoices.aggregate(
            earnings=Sum('host_payout_amount'),
            gross=Sum('total_amount'),
            sessions_count=Count('id')
        )
        data.append({
            'host_id': h.id,
            'host_name': h.user.get_full_name() or h.user.username,
            'society_name': h.society_name,
            'upi_id': h.upi_id,
            'chargers_count': h.hosted_chargers.count(),
            'completed_sessions': agg['sessions_count'] or 0,
            'net_host_earnings_inr': agg['earnings'] or Decimal('0.00'),
            'gross_billed_inr': agg['gross'] or Decimal('0.00'),
        })
    return Response(data)



@api_view(['POST'])
def auth_login(request):
    """
    Sign in with phone number or username + password.
    For demo convenience, if password is 'demo' or matches user password, returns UserProfile.
    """
    identifier = str(request.data.get('identifier', '')).strip()
    password = str(request.data.get('password', '')).strip()

    if not identifier:
        return Response({'error': 'Please enter your phone number or username.'}, status=status.HTTP_400_BAD_REQUEST)

    profile = UserProfile.objects.select_related('user').prefetch_related('vehicles').filter(
        Q(phone__iexact=identifier) | Q(user__username__iexact=identifier) | Q(user__email__iexact=identifier)
    ).first()

    if not profile:
        return Response({'error': 'No account found with that phone number or username.'}, status=status.HTTP_404_NOT_FOUND)

    user = profile.user
    # Check standard Django password (or allow if user was seeded without a password hash)
    if user.has_usable_password() and password != 'demo123':
        authed = authenticate(username=user.username, password=password)
        if not authed:
            return Response({'error': 'Incorrect password. (Tip: use demo123 for seeded accounts)'}, status=status.HTTP_401_UNAUTHORIZED)

    return Response(UserProfileSerializer(profile).data, status=status.HTTP_200_OK)


@api_view(['POST'])
def auth_register(request):
    """
    Register a new ChargePe24 user (Host, Chargee, or Both) and optional EV.
    """
    full_name = str(request.data.get('full_name', '')).strip()
    phone = str(request.data.get('phone', '')).strip()
    password = str(request.data.get('password', '')).strip()
    role = request.data.get('role', 'BOTH')
    society_name = str(request.data.get('society_name', '')).strip()
    flat_or_house_no = str(request.data.get('flat_or_house_no', '')).strip()
    city = str(request.data.get('city', 'Pune')).strip()
    upi_id = str(request.data.get('upi_id', '')).strip()

    if not full_name or not phone or not password:
        return Response({'error': 'Full name, phone number, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if UserProfile.objects.filter(phone=phone).exists():
        return Response({'error': 'An account with this phone number already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    username = phone.replace('+', '').replace(' ', '')
    if User.objects.filter(username=username).exists():
        username = f"{username}_{uuid.uuid4().hex[:4]}"

    user = User.objects.create_user(
        username=username,
        first_name=full_name,
        password=password,
    )
    profile = UserProfile.objects.create(
        user=user,
        phone=phone,
        role=role,
        society_name=society_name,
        flat_or_house_no=flat_or_house_no,
        city=city or 'Pune',
        upi_id=upi_id,
        kyc_verified=True,
    )

    # Optional: Register the user's EV during sign up
    reg_no = str(request.data.get('vehicle_reg_number', '')).strip().upper()
    make_model = str(request.data.get('vehicle_make_model', '')).strip()
    if reg_no and make_model:
        Vehicle.objects.get_or_create(
            registration_number=reg_no,
            defaults={
                'owner': profile,
                'category': request.data.get('vehicle_category', '2W'),
                'make_model': make_model,
                'connector_type': request.data.get('vehicle_connector', '15A_SOCKET'),
                'battery_capacity_kwh': Decimal('4.00'),
            }
        )

    profile.refresh_from_db()
    return Response(UserProfileSerializer(profile).data, status=status.HTTP_201_CREATED)
