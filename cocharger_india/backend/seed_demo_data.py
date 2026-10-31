import os
import django
from datetime import time, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from accounts.models import UserProfile, Vehicle
from chargers.models import Charger, ChargerSchedule
from bookings.models import Booking, ChargingSession, Invoice


def run_seed():
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@cocharger.in', 'admin123')
        print("Created superuser: admin / admin123")

    # 1. Create Hosts & Chargees
    u1, _ = User.objects.get_or_create(username='rohan_host', defaults={'first_name': 'Rohan Kulkarni', 'email': 'rohan@society.in'})
    p1, _ = UserProfile.objects.get_or_create(
        user=u1,
        defaults={
            'phone': '+919822011223',
            'role': 'BOTH',
            'society_name': 'Amanora Park Town',
            'flat_or_house_no': 'Tower 14 - Flat 902',
            'city': 'Pune',
            'upi_id': 'rohan.k@okicici',
            'kyc_verified': True,
        }
    )

    u2, _ = User.objects.get_or_create(username='priya_driver', defaults={'first_name': 'Priya Deshmukh', 'email': 'priya@ev.in'})
    p2, _ = UserProfile.objects.get_or_create(
        user=u2,
        defaults={
            'phone': '+919823455667',
            'role': 'CHARGEE',
            'society_name': 'Amanora Park Town',
            'flat_or_house_no': 'Tower 18 - Flat 304',
            'city': 'Pune',
            'upi_id': 'priya.d@oksbi',
            'kyc_verified': True,
        }
    )

    u3, _ = User.objects.get_or_create(username='vikram_villa', defaults={'first_name': 'Vikram Joshi', 'email': 'vikram@villa.in'})
    p3, _ = UserProfile.objects.get_or_create(
        user=u3,
        defaults={
            'phone': '+919765432109',
            'role': 'HOST',
            'society_name': 'Koregaon Park Lane 6',
            'flat_or_house_no': 'Bungalow #12',
            'city': 'Pune',
            'upi_id': 'vikram.j@okhdfcbank',
            'kyc_verified': True,
        }
    )

    # 2. Create Vehicles
    v1, _ = Vehicle.objects.get_or_create(
        registration_number='MH-12-EV-4501',
        defaults={
            'owner': p2,
            'category': '2W',
            'make_model': 'Ather 450X Gen-3',
            'battery_capacity_kwh': Decimal('3.70'),
            'connector_type': '15A_SOCKET',
        }
    )

    v2, _ = Vehicle.objects.get_or_create(
        registration_number='MH-12-EV-9099',
        defaults={
            'owner': p1,
            'category': '4W',
            'make_model': 'Tata Nexon EV Empowered+',
            'battery_capacity_kwh': Decimal('40.50'),
            'connector_type': 'TYPE_2',
        }
    )

    # 3. Create Chargers across the 3 Segments & 3 Hardware Tiers
    c1, _ = Charger.objects.get_or_create(
        title='Amanora Tower 14 — Basement Slot B-19',
        defaults={
            'host': p1,
            'segment_type': 'INTRA_SOCIETY',
            'society_name': 'Amanora Park Town, Hadapsar',
            'parking_bay_number': 'B1-19',
            'address': 'Hadapsar, Pune, Maharashtra',
            'city': 'Pune',
            'latitude': Decimal('18.519500'),
            'longitude': Decimal('73.939200'),
            'hardware_tier': 'IOT_SMART_PLUG',
            'connector_type': '15A_SOCKET',
            'supported_vehicles': 'ALL_EVS',
            'max_power_kw': Decimal('3.30'),
            'rate_per_kwh': Decimal('11.50'),
            'rate_per_hour': Decimal('15.00'),
            'requires_gate_pass': True,
        }
    )

    c2, _ = Charger.objects.get_or_create(
        title='Koregaon Park Bungalow #12 Driveway (7.2kW Fast AC)',
        defaults={
            'host': p3,
            'segment_type': 'INDEPENDENT_HOME',
            'society_name': 'KP Lane 6 Independent Villa',
            'parking_bay_number': 'Porch Bay 1',
            'address': 'Lane 6, Koregaon Park, Pune',
            'city': 'Pune',
            'latitude': Decimal('18.536200'),
            'longitude': Decimal('73.894000'),
            'hardware_tier': 'OCPP_EVSE',
            'connector_type': 'TYPE_2',
            'supported_vehicles': '4W_ONLY',
            'max_power_kw': Decimal('7.20'),
            'rate_per_kwh': Decimal('14.00'),
            'rate_per_hour': Decimal('25.00'),
            'requires_gate_pass': True,
        }
    )

    c3, _ = Charger.objects.get_or_create(
        title='Ganesh Kirana & Supermart — Kothrud 15A Point',
        defaults={
            'host': p3,
            'segment_type': 'KIRANA_COMMERCIAL',
            'society_name': 'Kothrud Main Road Market',
            'parking_bay_number': 'Shopfront Slot #2',
            'address': 'Karve Road, Kothrud, Pune',
            'city': 'Pune',
            'latitude': Decimal('18.507400'),
            'longitude': Decimal('73.807700'),
            'hardware_tier': 'DUMB_15A',
            'connector_type': '15A_SOCKET',
            'supported_vehicles': '2W_3W_ONLY',
            'max_power_kw': Decimal('3.30'),
            'rate_per_kwh': Decimal('12.00'),
            'rate_per_hour': Decimal('10.00'),
            'requires_gate_pass': False,
        }
    )

    for day in [1, 3, 5]:  # Tue, Thu, Sat overnight
        ChargerSchedule.objects.get_or_create(
            charger=c1,
            day_of_week=day,
            defaults={'start_time': time(22, 0), 'end_time': time(7, 0), 'is_recurring': True}
        )

    # 4. Create Sample Bookings & Completed Invoice
    if not Booking.objects.exists():
        now = timezone.now()
        b1 = Booking.objects.create(
            chargee=p2,
            charger=c1,
            vehicle=v1,
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=6),
            booking_type='RECURRING_WEEKLY',
            status='CONFIRMED',
            gate_pass_code='482910',
            estimated_kwh=Decimal('3.50'),
            notes_for_host='Every Tue & Thu overnight charge',
        )

        b2 = Booking.objects.create(
            chargee=p1,
            charger=c2,
            vehicle=v2,
            start_time=now - timedelta(hours=5),
            end_time=now - timedelta(hours=1),
            booking_type='ONE_OFF',
            status='COMPLETED',
            gate_pass_code='739104',
            estimated_kwh=Decimal('22.00'),
        )
        session = ChargingSession.objects.create(
            booking=b2,
            actual_start=b2.start_time,
            actual_end=b2.end_time,
            initial_meter_kwh=Decimal('140.00'),
            final_meter_kwh=Decimal('162.50'),
            total_energy_kwh=Decimal('22.50'),
            end_reason='TIMER_EXPIRY',
        )
        inv = Invoice.objects.create(
            session=session,
            payment_status='PAID_UPI',
            upi_transaction_ref='UPI-4298103491',
        )
        inv.calculate_totals()
        inv.save()

    print("Demo seed completed successfully!")


if __name__ == '__main__':
    run_seed()

