from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('HOST', 'Charger Host (Owner)'),
        ('CHARGEE', 'Chargee (EV Driver)'),
        ('BOTH', 'Both Host & Chargee'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=15, unique=True, help_text="Indian mobile number (+91...)")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='BOTH')
    society_name = models.CharField(max_length=150, blank=True, help_text="Apartment/RWA or Layout name")
    flat_or_house_no = models.CharField(max_length=50, blank=True, help_text="e.g., Tower B - 402")
    city = models.CharField(max_length=80, default='Pune')
    upi_id = models.CharField(max_length=100, blank=True, help_text="Host UPI ID for instant settlement (e.g. name@okaxis)")
    kyc_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.get_role_display()})"


class Vehicle(models.Model):
    CATEGORY_CHOICES = [
        ('2W', '2-Wheeler (Scooter / Bike)'),
        ('3W', '3-Wheeler (Auto / Cargo)'),
        ('4W', '4-Wheeler (Car / SUV)'),
    ]

    CONNECTOR_CHOICES = [
        ('15A_SOCKET', 'Standard 15A/16A 3-Pin Socket'),
        ('TYPE_2', 'Type 2 AC (7.2kW - 22kW)'),
        ('BHARAT_AC001', 'Bharat AC-001 (3.3kW)'),
    ]

    owner = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='vehicles')
    registration_number = models.CharField(max_length=20, unique=True, help_text="e.g., MH-12-EV-4501")
    category = models.CharField(max_length=5, choices=CATEGORY_CHOICES, default='2W')
    make_model = models.CharField(max_length=100, help_text="e.g., Ather 450X, Ola S1 Pro, Tata Nexon EV")
    battery_capacity_kwh = models.DecimalField(max_digits=5, decimal_places=2, default=3.70)
    connector_type = models.CharField(max_length=20, choices=CONNECTOR_CHOICES, default='15A_SOCKET')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.make_model} ({self.registration_number}) - {self.get_category_display()}"

