from django.contrib import admin
from .models import Charger, ChargerSchedule


class ChargerScheduleInline(admin.TabularInline):
    model = ChargerSchedule
    extra = 1


@admin.register(Charger)
class ChargerAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'host', 'segment_type', 'society_name', 'parking_bay_number',
        'hardware_tier', 'connector_type', 'max_power_kw', 'rate_per_kwh', 'rate_per_hour', 'is_active'
    )
    list_filter = ('segment_type', 'hardware_tier', 'connector_type', 'supported_vehicles', 'city', 'is_active')
    search_fields = ('title', 'society_name', 'address', 'host__phone')
    inlines = [ChargerScheduleInline]


@admin.register(ChargerSchedule)
class ChargerScheduleAdmin(admin.ModelAdmin):
    list_display = ('charger', 'day_of_week', 'start_time', 'end_time', 'is_recurring')
    list_filter = ('day_of_week', 'is_recurring')

