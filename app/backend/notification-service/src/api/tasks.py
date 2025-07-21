from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import EmailNotification, NotificationLog
import logging


logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_email_task(self, notification_id):
    try:
        notification = EmailNotification.objects.get(id=notification_id)
        notification.attempts += 1
        notification.save()
        
        # Log attempt
        NotificationLog.objects.create(
            notification=notification,
            action='SEND_ATTEMPT',
            details=f'Attempt #{notification.attempts}'
        )
        
        send_mail(
            subject=notification.subject,
            message=notification.message_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.recipient_email],
            fail_silently=False,
        )
        
        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save()
        
        # Log success
        NotificationLog.objects.create(
            notification=notification,
            action='SENT_SUCCESS',
            details='Email sent successfully'
        )
        
        logger.info(f"Email sent successfully to {notification.recipient_email}")
        return f"Email sent to {notification.recipient_email}"
        
    except EmailNotification.DoesNotExist:
        logger.error(f"EmailNotification with id {notification_id} not found")
        return f"Notification {notification_id} not found"
    except Exception as exc:
        notification = EmailNotification.objects.get(id=notification_id)
        notification.status = 'failed'
        notification.error_message = str(exc)
        notification.save()
        
        # Log failure
        NotificationLog.objects.create(
            notification=notification,
            action='SEND_FAILED',
            details=str(exc)
        )
        
        logger.error(f"Failed to send email to {notification.recipient_email}: {exc}")
        
        # Retry logic
        if self.request.retries < self.max_retries:
            notification.status = 'retry'
            notification.save()
            # Exponential backoff: 60s, 120s, 240s
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        
        return f"Failed to send email after {self.max_retries} attempts"