from rest_framework import serializers
from .models import Booking, ChargingSession, Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'session', 'base_energy_cost', 'parking_slot_cost',
            'platform_fee', 'host_payout_amount', 'total_amount',
            'payment_status', 'payment_status_display', 'upi_transaction_ref', 'created_at'
        ]


class ChargingSessionSerializer(serializers.ModelSerializer):
    invoice = InvoiceSerializer(read_only=True)
    end_reason_display = serializers.CharField(source='get_end_reason_display', read_only=True)

    class Meta:
        model = ChargingSession
        fields = [
            'id', 'booking', 'actual_start', 'actual_end',
            'initial_meter_kwh', 'final_meter_kwh', 'total_energy_kwh',
            'end_reason', 'end_reason_display', 'invoice'
        ]


class BookingSerializer(serializers.ModelSerializer):
    chargee_name = serializers.SerializerMethodField()
    charger_title = serializers.CharField(source='charger.title', read_only=True)
    society_name = serializers.CharField(source='charger.society_name', read_only=True)
    parking_bay = serializers.CharField(source='charger.parking_bay_number', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.registration_number', read_only=True)
    vehicle_model = serializers.CharField(source='vehicle.make_model', read_only=True)
    booking_type_display = serializers.CharField(source='get_booking_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_hours = serializers.FloatField(read_only=True)
    estimated_total_inr = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    session = ChargingSessionSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'chargee', 'chargee_name', 'charger', 'charger_title',
            'society_name', 'parking_bay', 'vehicle', 'vehicle_plate', 'vehicle_model',
            'start_time', 'end_time', 'booking_type', 'booking_type_display',
            'status', 'status_display', 'gate_pass_code', 'estimated_kwh',
            'duration_hours', 'estimated_total_inr', 'notes_for_host', 'session', 'created_at'
        ]
        read_only_fields = ['gate_pass_code']

    def get_chargee_name(self, obj):
        return obj.chargee.user.get_full_name() or obj.chargee.user.username

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        charger = data.get('charger')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time.")

        if charger and start_time and end_time:
            overlapping = Booking.objects.filter(
                charger=charger,
                status__in=['CONFIRMED', 'IN_PROGRESS'],
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)
            if overlapping.exists():
                raise serializers.ValidationError(
                    "This charger slot is already booked during the selected time window."
                )
        return data

