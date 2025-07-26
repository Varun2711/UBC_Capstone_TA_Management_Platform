from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch
from api.models import EmailNotification, PasswordResetToken

class NotificationAPITest(APITestCase):
    """
    Tests for the Notification Service API endpoints.
    """

    def setUp(self):
        self.client = APIClient()

    @patch('api.views.send_email_task.delay')
    def test_send_offer_notification(self, mock_send_email):
        """
        Ensure we can create an offer notification and queue an email task.
        """
        url = '/api/notifications/send_offer_notification/'
        data = {
            "student_email": "student@test.com",
            "student_name": "Test Student",
            "course_code": "COSC 310",
            "course_name": "Software Engineering",
            "deadline": "2025-08-01T23:59:59Z",
            "offer_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EmailNotification.objects.count(), 1)
        
        notification = EmailNotification.objects.first()
        self.assertEqual(notification.recipient_email, "student@test.com")
        self.assertEqual(notification.notification_type, 'offer_created')
        
        # Check that the Celery task was called with the correct notification ID
        mock_send_email.assert_called_once_with(str(notification.id))

    @patch('api.views.send_email_task.delay')
    def test_send_final_allocation_notice(self, mock_send_email):
        """
        Ensure we can send a final allocation notice to an instructor.
        """
        url = '/api/notifications/send_final_allocation_notice/'
        data = {
            "instructor_email": "instructor@test.com",
            "instructor_name": "Dr. Instructor",
            "course_code": "COSC 499",
            "course_name": "Capstone Project",
            "term": "2025W",
            "allocations": [
                {"ta_name": "TA One", "student_number": "11111111", "hours": 5},
                {"ta_name": "TA Two", "student_number": "22222222", "hours": 10}
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EmailNotification.objects.count(), 1)
        
        notification = EmailNotification.objects.first()
        self.assertEqual(notification.recipient_email, "instructor@test.com")
        self.assertEqual(notification.notification_type, 'final_allocation_notice')
        
        mock_send_email.assert_called_once_with(str(notification.id))

    @patch('api.views.send_email_task.delay')
    def test_send_deadline_approaching_notification(self, mock_send_email):
        """
        Ensure we can send deadline reminders to multiple recipients.
        """
        url = '/api/notifications/send_deadline_approaching/'
        data = {
            "recipients": [
                {"email": "student1@test.com", "name": "Student One"},
                {"email": "student2@test.com", "name": "Student Two"}
            ],
            "deadline_type": "offer_response",
            "deadline_date": "2025-08-01T23:59:59Z",
            "hours_remaining": 24,
            "course_code": "COSC 121"
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EmailNotification.objects.count(), 2)
        self.assertEqual(mock_send_email.call_count, 2)

    @patch('api.views.send_email_task.delay')
    def test_password_reset_flow(self, mock_send_email):
        """
        Test the full password reset flow from request to verification.
        """
        # 1. Request a password reset
        reset_url = '/api/notifications/send_password_reset/'
        reset_data = {
            "email": "user@example.com",
            "user_type": "student",
            "user_id": "12345678",
            "user_name": "Test User"
        }
        response = self.client.post(reset_url, reset_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PasswordResetToken.objects.count(), 1)
        mock_send_email.assert_called_once()

        # 2. Verify the token (valid)
        token_obj = PasswordResetToken.objects.first()
        verify_url = f'/api/notifications/verify_reset_token/?token={token_obj.token}'
        response = self.client.get(verify_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])

        # 3. Mark the token as used
        mark_used_url = '/api/notifications/mark_token_used/'
        response = self.client.post(mark_used_url, {'token': token_obj.token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 4. Verify the token again (should be invalid)
        response = self.client.get(verify_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Token already used')