import random
import string
from decimal import Decimal
from django.db import models
from django.utils import timezone
from accounts.models import UserProfile, Vehicle
from chargers.models import Charger


def generate_gate_pass_code():
    return ''.join(random.choices(string.digits, k=6))


class Booking(models.Model):
    BOOKING_TYPE_CHOICES = [
        ('ONE_OFF', 'Single Slot Booking'),
        ('RECURRING_WEEKLY', 'Recurring Weekly Subscription (ChargePe24 Routine)'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending Host Approval'),
        ('CONFIRMED', 'Confirmed & Gate Pass Issued'),
        ('IN_PROGRESS', 'Charging in Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    chargee = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='bookings')
    charger = models.ForeignKey(Charger, on_delete=models.CASCADE, related_name='bookings')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='bookings')

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    booking_type = models.CharField(max_length=20, choices=BOOKING_TYPE_CHOICES, default='ONE_OFF')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='CONFIRMED')

    gate_pass_code = models.CharField(
        max_length=6,
        default=generate_gate_pass_code,
        help_text="6-digit Society Security Gate Pass PIN"
    )
    estimated_kwh = models.DecimalField(max_digits=6, decimal_places=2, default=5.00)
    notes_for_host = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_time']

    @property
    def duration_hours(self):
        delta = self.end_time - self.start_time
        return round(max(delta.total_seconds() / 3600.0, 0.25), 2)

    @property
    def estimated_total_inr(self):
        hrs = Decimal(str(self.duration_hours))
        energy_cost = self.estimated_kwh * self.charger.rate_per_kwh
        slot_cost = hrs * self.charger.rate_per_hour
        return round(energy_cost + slot_cost, 2)

    def __str__(self):
        return f"Booking #{self.id} | {self.vehicle.registration_number} @ {self.charger.title}"


class ChargingSession(models.Model):
    END_REASON_CHOICES = [
        ('USER_STOP', 'Stopped by Chargee'),
        ('TIMER_EXPIRY', 'Booked Slot Timer Completed'),
        ('HOST_STOP', 'Stopped by Host'),
        ('SMART_PLUG_CUTOFF', 'IoT Smart Plug / OCPP Auto-Cutoff'),
    ]

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='session')
    actual_start = models.DateTimeField(default=timezone.now)
    actual_end = models.DateTimeField(null=True, blank=True)
    initial_meter_kwh = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    final_meter_kwh = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    total_energy_kwh = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    end_reason = models.CharField(max_length=20, choices=END_REASON_CHOICES, default='USER_STOP')

    def save(self, *args, **kwargs):
        if self.final_meter_kwh > self.initial_meter_kwh and self.total_energy_kwh == 0:
            self.total_energy_kwh = self.final_meter_kwh - self.initial_meter_kwh
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Session for Booking #{self.booking.id} ({self.total_energy_kwh} kWh)"


class Invoice(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending UPI Payment'),
        ('PAID_UPI', 'Paid via UPI'),
        ('SETTLED_TO_HOST', 'Settled to Host UPI'),
        ('REFUNDED', 'Refunded'),
    ]

    session = models.OneToOneField(ChargingSession, on_delete=models.CASCADE, related_name='invoice')
    base_energy_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    parking_slot_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    platform_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="10% ChargePe24 platform fee")
    host_payout_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="90% net payout to Host")
    total_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    payment_status = models.DecimalField if False else models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PAID_UPI'
    )
    upi_transaction_ref = models.CharField(max_length=64, blank=True, help_text="UPI UTR / Razorpay Order Ref")
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_totals(self):
        charger = self.session.booking.charger
        duration_hrs = Decimal(str(self.session.booking.duration_hours))
        kwh = self.session.total_energy_kwh or self.session.booking.estimated_kwh

        self.base_energy_cost = round(kwh * charger.rate_per_kwh, 2)
        self.parking_slot_cost = round(duration_hrs * charger.rate_per_hour, 2)
        gross = self.base_energy_cost + self.parking_slot_cost
        self.platform_fee = round(gross * Decimal('0.10'), 2)
        self.host_payout_amount = round(gross - self.platform_fee, 2)
        self.total_amount = gross

    def save(self, *args, **kwargs):
        if self.total_amount == 0:
            self.calculate_totals()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice #{self.id} | ₹{self.total_amount} ({self.get_payment_status_display()})"

