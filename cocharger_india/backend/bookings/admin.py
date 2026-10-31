from django.contrib import admin
from .models import Booking, ChargingSession, Invoice


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'chargee', 'vehicle', 'charger', 'start_time', 'end_time',
        'booking_type', 'status', 'gate_pass_code'
    )
    list_filter = ('status', 'booking_type', 'charger__city')
    search_fields = ('gate_pass_code', 'vehicle__registration_number', 'charger__title', 'chargee__phone')


@admin.register(ChargingSession)
class ChargingSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'actual_start', 'actual_end', 'total_energy_kwh', 'end_reason')
    list_filter = ('end_reason',)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'session', 'base_energy_cost', 'parking_slot_cost',
        'platform_fee', 'host_payout_amount', 'total_amount', 'payment_status', 'upi_transaction_ref'
    )
    list_filter = ('payment_status',)
    search_fields = ('upi_transaction_ref',)

