from django.contrib import admin
from .models import UserProfile, Vehicle


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'role', 'society_name', 'flat_or_house_no', 'city', 'kyc_verified')
    list_filter = ('role', 'city', 'kyc_verified')
    search_fields = ('user__username', 'user__first_name', 'phone', 'society_name')


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'make_model', 'category', 'connector_type', 'battery_capacity_kwh', 'owner')
    list_filter = ('category', 'connector_type')
    search_fields = ('registration_number', 'make_model', 'owner__phone')

