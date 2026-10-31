from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Vehicle


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class VehicleSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    connector_display = serializers.CharField(source='get_connector_type_display', read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'owner', 'registration_number', 'category', 'category_display',
            'make_model', 'battery_capacity_kwh', 'connector_type', 'connector_display', 'created_at'
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    vehicles = VehicleSerializer(many=True, read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'phone', 'role', 'role_display', 'society_name',
            'flat_or_house_no', 'city', 'upi_id', 'kyc_verified', 'vehicles', 'created_at'
        ]

