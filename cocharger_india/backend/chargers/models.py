from django.db import models
from accounts.models import UserProfile


class Charger(models.Model):
    SEGMENT_CHOICES = [
        ('INTRA_SOCIETY', '1. Intra-Society P2P (Gated RWA / Apartment)'),
        ('INDEPENDENT_HOME', '2. Independent Home / Bungalow Driveway'),
        ('KIRANA_COMMERCIAL', '3. Kirana Store / Micro-Commercial Shop'),
        ('OFFICE_TECH_PARK', '4. Office / IT Tech Park Workplace Bay'),
        ('HOTEL_HOMESTAY', '5. Hotel / Resort / Homestay Parking'),
        ('RESTAURANT_DHABA', '6. Highway Dhaba / Restaurant / Cafe'),
        ('MALL_RETAIL', '7. Shopping Mall / Supermarket / Cinema'),
        ('HOSPITAL_INSTITUTION', '8. Hospital / College / Public Institution'),
    ]

    HARDWARE_TIER_CHOICES = [
        ('DUMB_15A', 'Tier 1: Standard 15A/16A Socket (Timer + Photo OCR)'),
        ('IOT_SMART_PLUG', 'Tier 2: Wi-Fi / MQTT Smart Plug Relay'),
        ('OCPP_EVSE', 'Tier 3: Smart Type 2 AC Wallbox (OCPP 1.6J)'),
    ]

    CONNECTOR_CHOICES = [
        ('15A_SOCKET', 'Standard 15A/16A 3-Pin Socket'),
        ('TYPE_2', 'Type 2 AC (7.2kW - 22kW)'),
        ('BHARAT_AC001', 'Bharat AC-001 (3.3kW)'),
    ]

    VEHICLE_SUPPORT_CHOICES = [
        ('2W_3W_ONLY', '2-Wheelers & 3-Wheelers Only'),
        ('4W_ONLY', '4-Wheelers Only'),
        ('ALL_EVS', 'All EVs (2W / 3W / 4W)'),
    ]

    host = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='hosted_chargers')
    title = models.CharField(max_length=150, help_text="e.g., Amanora Park Town - Tower 12 Slot P-08")
    segment_type = models.CharField(max_length=25, choices=SEGMENT_CHOICES, default='INTRA_SOCIETY')
    society_name = models.CharField(max_length=150, blank=True, help_text="RWA / Gated Society Name")
    parking_bay_number = models.CharField(max_length=50, help_text="e.g., Basement-1, Slot B-14")
    address = models.TextField()
    city = models.CharField(max_length=80, default='Pune')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=18.520430)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=73.856743)

    hardware_tier = models.CharField(max_length=20, choices=HARDWARE_TIER_CHOICES, default='DUMB_15A')
    connector_type = models.CharField(max_length=20, choices=CONNECTOR_CHOICES, default='15A_SOCKET')
    supported_vehicles = models.CharField(max_length=15, choices=VEHICLE_SUPPORT_CHOICES, default='ALL_EVS')
    max_power_kw = models.DecimalField(max_digits=5, decimal_places=2, default=3.30)

    # Cost-sharing / Infrastructure reimbursement pricing in INR (₹)
    rate_per_kwh = models.DecimalField(max_digits=6, decimal_places=2, default=12.00, help_text="₹ per kWh")
    rate_per_hour = models.DecimalField(max_digits=6, decimal_places=2, default=20.00, help_text="₹ per hour parking/slot fee")

    requires_gate_pass = models.BooleanField(default=True, help_text="True if inside gated RWA society")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_connector_type_display()} - {self.max_power_kw}kW)"


class ChargerSchedule(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    charger = models.ForeignKey(Charger, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField(help_text="e.g., 22:00 (10 PM)")
    end_time = models.TimeField(help_text="e.g., 07:00 (7 AM)")
    is_recurring = models.BooleanField(default=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.charger.title}: {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"

