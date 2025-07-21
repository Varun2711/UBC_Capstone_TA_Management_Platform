from rest_framework import serializers
from .models import EmailNotification, NotificationLog, PasswordResetToken

class EmailNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailNotification
        fields = '__all__'
        read_only_fields = ('id', 'attempts', 'error_message', 'created_at', 'sent_at')

class SendNotificationSerializer(serializers.Serializer):
    recipient_email = serializers.EmailField()
    recipient_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=200)
    message_body = serializers.CharField()
    notification_type = serializers.ChoiceField(choices=EmailNotification.NOTIFICATION_TYPES)
    context_data = serializers.JSONField(required=False)
    scheduled_for = serializers.DateTimeField(required=False)

class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = '__all__'

class PasswordResetTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordResetToken
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'is_used')

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    user_type = serializers.CharField(max_length=20)
    user_id = serializers.CharField(max_length=50)
    user_name = serializers.CharField(max_length=100, required=False, allow_blank=True)