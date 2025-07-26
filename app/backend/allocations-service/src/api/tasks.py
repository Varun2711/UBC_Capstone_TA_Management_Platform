from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import requests
import logging

from .models import Offer

logger = logging.getLogger(__name__)

@shared_task
def check_offer_deadlines():
    """
    Finds all pending offers with deadlines approaching (e.g., in the next 24 hours)
    and triggers a notification for each.
    """
    now = timezone.now()
    # Define the time window for reminders (e.g., between 24 and 48 hours from now)
    reminder_window_start = now
    reminder_window_end = now + timedelta(hours=48)

    # Find offers with deadlines in the reminder window that haven't been reminded yet
    expiring_offers = Offer.objects.filter(
        status='pending',
        response_deadline__gte=reminder_window_start,
        response_deadline__lt=reminder_window_end,
        # Optional: Add a flag to the Offer model to prevent multiple reminders
        reminder_sent=False 
    )

    if not expiring_offers.exists():
        logger.info("No expiring offers found needing a reminder.")
        return "No expiring offers found."

    recipients = []
    for offer in expiring_offers:
        recipients.append({
            'email': offer.student.email,
            'name': offer.student.name,
        })

    # Assume all offers in this batch are for the same course for simplicity,
    # or enhance to group by course.
    first_offer = expiring_offers.first()
    course_code = first_offer.offer_items.first().course.course_number if first_offer.offer_items.exists() else "Multiple Courses"
    
    notification_payload = {
        "recipients": recipients,
        "deadline_type": "offer_response",
        "deadline_date": first_offer.response_deadline.strftime('%B %d, %Y at %I:%M %p'),
        "hours_remaining": 24, # Or calculate dynamically
        "course_code": course_code
    }

    try:
        # Use localhost and the exposed port for local development
        notification_url = 'http://nginx/api/notifications/send_deadline_approaching/'
        response = requests.post(notification_url, json=notification_payload, timeout=15)
        
        if response.status_code == 200:
            logger.info(f"Successfully triggered deadline reminders for {len(recipients)} offers.")
            # Optional: Update a `reminder_sent` flag on the offers here
            expiring_offers.update(reminder_sent=True)
            return f"Sent reminders for {len(recipients)} offers."
        else:
            logger.error(f"Failed to send deadline reminders. Status: {response.status_code}, Body: {response.text}")
            return "Failed to send reminders."

    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling notification service for deadline reminders: {e}")
        return "Error calling notification service."