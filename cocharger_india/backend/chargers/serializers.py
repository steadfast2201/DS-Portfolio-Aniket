import math
from rest_framework import serializers
from .models import Charger, ChargerSchedule


class ChargerScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = ChargerSchedule
        fields = ['id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_recurring']


class ChargerSerializer(serializers.ModelSerializer):
    host_name = serializers.SerializerMethodField()
    host_phone = serializers.CharField(source='host.phone', read_only=True)
    segment_display = serializers.CharField(source='get_segment_type_display', read_only=True)
    hardware_display = serializers.CharField(source='get_hardware_tier_display', read_only=True)
    connector_display = serializers.CharField(source='get_connector_type_display', read_only=True)
    vehicles_display = serializers.CharField(source='get_supported_vehicles_display', read_only=True)
    schedules = ChargerScheduleSerializer(many=True, read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Charger
        fields = [
            'id', 'host', 'host_name', 'host_phone', 'title', 'segment_type', 'segment_display',
            'society_name', 'parking_bay_number', 'address', 'city', 'latitude', 'longitude',
            'hardware_tier', 'hardware_display', 'connector_type', 'connector_display',
            'supported_vehicles', 'vehicles_display', 'max_power_kw', 'rate_per_kwh',
            'rate_per_hour', 'requires_gate_pass', 'is_active', 'schedules', 'distance_km', 'created_at'
        ]

    def get_host_name(self, obj):
        return obj.host.user.get_full_name() or obj.host.user.username

    def get_distance_km(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        if lat is None or lng is None:
            return None
        try:
            lat1, lon1 = float(lat), float(lng)
            lat2, lon2 = float(obj.latitude), float(obj.longitude)
            radius = 6371.0
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = (math.sin(dlat / 2) ** 2 +
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return round(radius * c, 2)
        except (ValueError, TypeError):
            return None

