from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
import secrets
from .models import EmailNotification, NotificationLog, PasswordResetToken
from .serializers import (
    EmailNotificationSerializer, 
    SendNotificationSerializer, 
    NotificationLogSerializer,
    PasswordResetRequestSerializer
)
from .tasks import send_email_task
import logging

logger = logging.getLogger(__name__)

class EmailNotificationViewSet(viewsets.ModelViewSet):
    queryset = EmailNotification.objects.all()
    serializer_class = EmailNotificationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'notification_type', 'recipient_email']
    
    @action(detail=False, methods=['post'])
    def send_notification(self, request):
        """Send an email notification"""
        serializer = SendNotificationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid data provided',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create email notification record
            notification = EmailNotification.objects.create(
                recipient_email=serializer.validated_data['recipient_email'],
                recipient_name=serializer.validated_data.get('recipient_name', ''),
                subject=serializer.validated_data['subject'],
                message_body=serializer.validated_data['message_body'],
                notification_type=serializer.validated_data['notification_type'],
                context_data=serializer.validated_data.get('context_data', {}),
                scheduled_for=serializer.validated_data.get('scheduled_for')
            )
            
            # Log creation
            NotificationLog.objects.create(
                notification=notification,
                action='CREATED',
                details='Notification created and queued for sending'
            )
            
            # Queue email for sending
            if notification.scheduled_for and notification.scheduled_for > timezone.now():
                send_email_task.apply_async(
                    args=[str(notification.id)],
                    eta=notification.scheduled_for
                )
                message = 'Email scheduled for sending'
            else:
                send_email_task.delay(str(notification.id))
                message = 'Email queued for sending'
            
            return Response({
                'message': message,
                'notification_id': str(notification.id),
                'status': notification.status
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            return Response({
                'error': f'Failed to create notification: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def send_offer_notification(self, request):
        """Send TA offer notification to student"""
        try:
            student_email = request.data.get('student_email')
            student_name = request.data.get('student_name')
            course_code = request.data.get('course_code')
            course_name = request.data.get('course_name')
            deadline = request.data.get('deadline')
            offer_id = request.data.get('offer_id')
            
            if not all([student_email, course_code, deadline]):
                return Response({
                    'error': 'student_email, course_code, and deadline are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            subject = f"TA Offer - {course_code}"
            message_body = f"""
Dear {student_name},

You have received a TA offer for {course_code} - {course_name}.

Offer Details:
- Course: {course_code} - {course_name}
- Response Deadline: {deadline}

Please log into the TA Management System to accept or reject this offer.

This offer will expire on {deadline}. Please respond before the deadline.

Best regards,
TA Management System
            """.strip()
            
            notification = EmailNotification.objects.create(
                recipient_email=student_email,
                recipient_name=student_name,
                subject=subject,
                message_body=message_body,
                notification_type='offer_created',
                context_data={
                    'course_code': course_code,
                    'course_name': course_name,
                    'deadline': deadline,
                    'offer_id': offer_id
                }
            )
            
            send_email_task.delay(str(notification.id))
            
            return Response({
                'message': 'TA offer notification sent',
                'notification_id': str(notification.id)
            })
            
        except Exception as e:
            logger.error(f"Error sending offer notification: {str(e)}")
            return Response({
                'error': f'Failed to send offer notification: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def send_final_allocation_notice(self, request):
        """Send final allocation notice to instructor after all allocations are confirmed"""
        try:
            instructor_email = request.data.get('instructor_email')
            instructor_name = request.data.get('instructor_name')
            course_code = request.data.get('course_code')
            course_name = request.data.get('course_name')
            allocations = request.data.get('allocations', [])  # List of TA allocations
            term = request.data.get('term')
            
            if not all([instructor_email, course_code, allocations]):
                return Response({
                    'error': 'instructor_email, course_code, and allocations are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Build allocation details
            allocation_details = []
            for allocation in allocations:
                allocation_details.append(
                    f"- {allocation.get('ta_name')} ({allocation.get('student_number')}) - {allocation.get('hours')} hours"
                )
            
            subject = f"Final TA Allocation Notice - {course_code}"
            message_body = f"""
Dear {instructor_name},

The final TA allocation for {course_code} - {course_name} has been completed for {term}.

TA Assignments:
{chr(10).join(allocation_details)}

Please reach out to your assigned TAs to coordinate schedules and responsibilities.

You can contact the TA Management System administrator if you have any questions about these assignments.

Best regards,
TA Management System
            """.strip()
            
            notification = EmailNotification.objects.create(
                recipient_email=instructor_email,
                recipient_name=instructor_name,
                subject=subject,
                message_body=message_body,
                notification_type='final_allocation_notice',
                context_data={
                    'course_code': course_code,
                    'course_name': course_name,
                    'term': term,
                    'allocations': allocations
                }
            )
            
            send_email_task.delay(str(notification.id))
            
            return Response({
                'message': 'Final allocation notice sent',
                'notification_id': str(notification.id)
            })
            
        except Exception as e:
            logger.error(f"Error sending final allocation notice: {str(e)}")
            return Response({
                'error': f'Failed to send final allocation notice: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def send_application_received(self, request):
        """Send confirmation that application was received"""
        try:
            student_email = request.data.get('student_email')
            student_name = request.data.get('student_name')
            course_code = request.data.get('course_code')
            course_name = request.data.get('course_name')
            application_date = request.data.get('application_date')
            
            if not all([student_email, course_code]):
                return Response({
                    'error': 'student_email and course_code are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            subject = f"Application Received - {course_code}"
            message_body = f"""
Dear {student_name},

Your TA application for {course_code} has been successfully received and is under review.

Application Details:
- Course: {course_code} - {course_name}
- Submitted: {application_date}

You will be notified if you are selected for a TA position in this course.

Best regards,
TA Management System
            """.strip()
            
            notification = EmailNotification.objects.create(
                recipient_email=student_email,
                recipient_name=student_name,
                subject=subject,
                message_body=message_body,
                notification_type='application_received',
                context_data={
                    'course_code': course_code,
                    'course_name': course_name,
                    'application_date': application_date
                }
            )
            
            send_email_task.delay(str(notification.id))
            
            return Response({
                'message': 'Application received confirmation sent',
                'notification_id': str(notification.id)
            })
            
        except Exception as e:
            logger.error(f"Error sending application confirmation: {str(e)}")
            return Response({
                'error': f'Failed to send application confirmation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def send_deadline_reminder(self, request):
        """Send deadline reminder notifications"""
        try:
            recipients = request.data.get('recipients', [])
            deadline_type = request.data.get('deadline_type')  # e.g., 'application', 'offer_response'
            deadline_date = request.data.get('deadline_date')
            course_info = request.data.get('course_info', {})
            
            notifications_created = []
            
            for recipient in recipients:
                if deadline_type == 'offer_response':
                    subject = f"Reminder: TA Offer Response Deadline - {course_info.get('course_code')}"
                    message_body = f"""
Dear {recipient.get('name')},

This is a reminder that your TA offer for {course_info.get('course_code')} requires a response by {deadline_date}.

Please log into the TA Management System to accept or reject this offer before the deadline.

Best regards,
TA Management System
                    """.strip()
                elif deadline_type == 'application':
                    subject = f"Reminder: TA Application Deadline - {course_info.get('course_code')}"
                    message_body = f"""
Dear {recipient.get('name')},

This is a reminder that TA applications for {course_info.get('course_code')} are due by {deadline_date}.

Please submit your application before the deadline if you're interested in this position.

Best regards,
TA Management System
                    """.strip()
                else:
                    continue
                
                notification = EmailNotification.objects.create(
                    recipient_email=recipient.get('email'),
                    recipient_name=recipient.get('name'),
                    subject=subject,
                    message_body=message_body,
                    notification_type='deadline_reminder',
                    context_data={
                        'deadline_type': deadline_type,
                        'deadline_date': deadline_date,
                        'course_info': course_info
                    }
                )
                
                send_email_task.delay(str(notification.id))
                notifications_created.append(str(notification.id))
            
            return Response({
                'message': f'Deadline reminders sent to {len(notifications_created)} recipients',
                'notification_ids': notifications_created
            })
            
        except Exception as e:
            logger.error(f"Error sending deadline reminders: {str(e)}")
            return Response({
                'error': f'Failed to send deadline reminders: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend a failed notification"""
        try:
            notification = self.get_object()
            
            if notification.status == 'sent':
                return Response({
                    'error': 'Notification has already been sent'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset status and queue for sending
            notification.status = 'pending'
            notification.error_message = ''
            notification.save()
            
            # Log resend
            NotificationLog.objects.create(
                notification=notification,
                action='RESEND_QUEUED',
                details='Notification queued for resending'
            )
            
            send_email_task.delay(str(notification.id))
            
            return Response({
                'message': 'Notification queued for resending',
                'notification_id': str(notification.id)
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to resend notification: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @action(detail=False, methods=['get'])
    def verify_reset_token(self, request):
        """Verify if a reset token is valid"""
        try:
            token = request.query_params.get('token')
            if not token:
                return Response({'error': 'Token required'}, status=400)
            
            reset_token = PasswordResetToken.objects.get(token=token)
            
            if reset_token.is_used:
                return Response({'error': 'Token already used'}, status=400)
            
            if reset_token.is_expired():
                return Response({'error': 'Token expired'}, status=400)
            
            return Response({
                'valid': True,
                'email': reset_token.email,
                'user_type': reset_token.user_type,
                'user_id': reset_token.user_id,
                'expires_at': reset_token.expires_at
            })
            
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=404)

    @action(detail=False, methods=['post'])
    def mark_token_used(self, request):
        """Mark a reset token as used"""
        try:
            token = request.data.get('token')
            reset_token = PasswordResetToken.objects.get(token=token)
            reset_token.is_used = True
            reset_token.save()
            
            return Response({'message': 'Token marked as used'})
            
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Token not found'}, status=404)

    @action(detail=False, methods=['post'])
    def send_password_reset(self, request):
        """Send password reset email"""
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid data provided',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            email = serializer.validated_data['email']
            user_type = serializer.validated_data['user_type']
            user_id = serializer.validated_data['user_id']
            user_name = serializer.validated_data.get('user_name', '')
            
            # Generate reset token
            token = secrets.token_urlsafe(32)
            expires_at = timezone.now() + timedelta(hours=24)
            
            # Create reset token record
            reset_token = PasswordResetToken.objects.create(
                email=email,
                user_type=user_type,
                user_id=user_id,
                token=token,
                expires_at=expires_at
            )
            
            # Create reset link
            reset_link = f"http://localhost:8080/reset-password?token={token}"
            
            # Send notification
            subject = "Password Reset Request - TA Management System"
            message_body = f"""
Hello,

You have requested a password reset for your TA Management System account.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you did not request this reset, please ignore this email.

Best regards,
TA Management System
            """.strip()
            
            notification = EmailNotification.objects.create(
                recipient_email=email,
                recipient_name=user_name,
                subject=subject,
                message_body=message_body,
                notification_type='password_reset',
                context_data={
                    'reset_token': token,
                    'reset_link': reset_link,
                    'user_type': user_type
                }
            )
            
            send_email_task.delay(str(notification.id))
            
            return Response({
                'message': 'Password reset email sent',
                'notification_id': str(notification.id)
            })
            
        except Exception as e:
            logger.error(f"Error sending password reset: {str(e)}")
            return Response({
                'error': f'Failed to send password reset: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @action(detail=False, methods=['post'])
    def send_offer_accepted(self, request):
        """Send notification when student accepts TA offer"""
        try:
            # Extract data
            student_email = request.data.get('student_email')
            student_name = request.data.get('student_name')
            course_code = request.data.get('course_code')
            course_name = request.data.get('course_name')
            instructor_email = request.data.get('instructor_email')
            coordinator_email = request.data.get('coordinator_email')
            
            # Send to student
            student_subject = f"TA Offer Accepted - {course_code}"
            student_message = f"""
            <html><body style="font-family: Arial, sans-serif;">
                <h2>TA Offer Accepted</h2>
                <p>Dear {student_name},</p>
                <p>Thank you for accepting the TA position.</p>
                <p>You will receive further instructions from your course instructor soon.</p>
                <p>Best regards,<br>TA Management System</p>
            </body></html>
            """
            
            student_notification = EmailNotification.objects.create(
                recipient_email=student_email,
                recipient_name=student_name,
                subject=student_subject,
                message_body=student_message,
                notification_type='offer_accepted',
                context_data=request.data
            )
            send_email_task.delay(str(student_notification.id))
            
            # Send to coordinator
            if coordinator_email:
                coord_subject = f"TA Offer Accepted - {course_code} - {student_name}"
                coord_message = f"""
                <html><body style="font-family: Arial, sans-serif;">
                    <h2>TA Offer Update</h2>
                    <p>Dear Coordinator,</p>
                    <p><strong>{student_name}</strong> has <span style="color: green;">ACCEPTED</span> the TA offer for:</p>
                    <ul>
                        <li>Course: {course_code} - {course_name}</li>
                        <li>Student: {student_name} ({student_email})</li>
                    </ul>
                    <p>You can now proceed with the final allocation process.</p>
                </body></html>
                """
                
                coord_notification = EmailNotification.objects.create(
                    recipient_email=coordinator_email,
                    subject=coord_subject,
                    message_body=coord_message,
                    notification_type='offer_accepted',
                    context_data=request.data
                )
                send_email_task.delay(str(coord_notification.id))
            
            return Response({'message': 'Offer acceptance notifications sent'})
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def send_offer_rejected(self, request):
        """Send notification when student rejects TA offer"""
        try:
            student_email = request.data.get('student_email')
            student_name = request.data.get('student_name')
            course_code = request.data.get('course_code')
            coordinator_email = request.data.get('coordinator_email')
            
            # Send to coordinator
            if coordinator_email:
                coord_subject = f"TA Offer Declined - {course_code} - {student_name}"
                coord_message = f"""
                <html><body style="font-family: Arial, sans-serif;">
                    <h2>TA Offer Update</h2>
                    <p>Dear Coordinator,</p>
                    <p><strong>{student_name}</strong> has <span style="color: red;">DECLINED</span> the TA offer for {course_code}.</p>
                    <p>You may need to extend an offer to another candidate.</p>
                </body></html>
                """
                
                coord_notification = EmailNotification.objects.create(
                    recipient_email=coordinator_email,
                    subject=coord_subject,
                    message_body=coord_message,
                    notification_type='offer_rejected',
                    context_data=request.data
                )
                send_email_task.delay(str(coord_notification.id))
            
            return Response({'message': 'Offer rejection notifications sent'})
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def send_deadline_approaching(self, request):
        """Send deadline approaching notifications (24-48 hours before)"""
        try:
            recipients = request.data.get('recipients', [])
            deadline_type = request.data.get('deadline_type')  # 'offer_response', 'application_deadline'
            deadline_date = request.data.get('deadline_date')
            hours_remaining = request.data.get('hours_remaining', 24)
            course_code = request.data.get('course_code')
            
            notifications_sent = []
            
            for recipient in recipients:
                if deadline_type == 'offer_response':
                    subject = f"URGENT: TA Offer Response Due in {hours_remaining} Hours - {course_code}"
                    message_body = f"""
                    <html><body style="font-family: Arial, sans-serif;">
                        <div style="border-left: 4px solid #e74c3c; padding: 20px; background-color: #fdf2f2;">
                            <h2 style="color: #e74c3c;">Urgent: Deadline Approaching</h2>
                            <p>Dear {recipient.get('name')},</p>
                            
                            <p><strong>Your TA offer response is due in {hours_remaining} hours!</strong></p>
                            
                            <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
                                <p><strong>Course:</strong> {course_code}</p>
                                <p><strong>Deadline:</strong> {deadline_date}</p>
                                <p><strong>Time Remaining:</strong> {hours_remaining} hours</p>
                            </div>
                            
                            <p style="color: #e74c3c;">Please log into the TA Management System immediately to respond to your offer.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="http://localhost:5173/student/offers" 
                                style="background-color: #e74c3c; color: white; padding: 15px 30px; 
                                        text-decoration: none; border-radius: 5px; display: inline-block;">
                                    Respond to Offer Now
                                </a>
                            </div>
                        </div>
                    </body></html>
                    """
                else:
                    subject = f"Deadline Reminder: {course_code} Application Due Soon"
                    message_body = f"""
                    <html><body style="font-family: Arial, sans-serif;">
                        <h2>Application Deadline Approaching</h2>
                        <p>Dear {recipient.get('name')},</p>
                        <p>This is a reminder that applications for {course_code} are due in {hours_remaining} hours.</p>
                        <p><strong>Deadline:</strong> {deadline_date}</p>
                        <p>Please submit your application if you haven't already.</p>
                    </body></html>
                    """
                
                notification = EmailNotification.objects.create(
                    recipient_email=recipient.get('email'),
                    recipient_name=recipient.get('name'),
                    subject=subject,
                    message_body=message_body,
                    notification_type='deadline_approaching',
                    context_data={
                        'deadline_type': deadline_type,
                        'hours_remaining': hours_remaining,
                        'deadline_date': deadline_date,
                        'course_code': course_code
                    }
                )
                
                send_email_task.delay(str(notification.id))
                notifications_sent.append(str(notification.id))
            
            return Response({
                'message': f'Deadline approaching notifications sent to {len(notifications_sent)} recipients',
                'notification_ids': notifications_sent
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['notification', 'action']

@api_view(['GET'])
@permission_classes([AllowAny])
def notification_stats(request):
    """Get notification statistics"""
    try:
        total_notifications = EmailNotification.objects.count()
        pending_notifications = EmailNotification.objects.filter(status='pending').count()
        sent_notifications = EmailNotification.objects.filter(status='sent').count()
        failed_notifications = EmailNotification.objects.filter(status='failed').count()
        
        stats_by_type = {}
        for notification_type, _ in EmailNotification.NOTIFICATION_TYPES:
            stats_by_type[notification_type] = EmailNotification.objects.filter(
                notification_type=notification_type
            ).count()
        
        return Response({
            'total_notifications': total_notifications,
            'pending_notifications': pending_notifications,
            'sent_notifications': sent_notifications,
            'failed_notifications': failed_notifications,
            'stats_by_type': stats_by_type
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to get stats: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'Notification Service is running',
        'service_scope': 'Email notification management',
        'available_endpoints': {
            'notifications': '/api/notifications/',
            'send_notification': '/api/notifications/send_notification/',
            'send_offer_notification': '/api/notifications/send_offer_notification/',
            'send_offer_accepted': '/api/notifications/send_offer_accepted/',          # NEW
            'send_offer_rejected': '/api/notifications/send_offer_rejected/',          # NEW
            'send_final_allocation_notice': '/api/notifications/send_final_allocation_notice/', #for instructor
            'send_application_received': '/api/notifications/send_application_received/',
            'send_deadline_reminder': '/api/notifications/send_deadline_reminder/',
            'send_deadline_approaching': '/api/notifications/send_deadline_approaching/', # NEW
            'send_password_reset': '/api/notifications/send_password_reset/',
            'notification_stats': '/api/stats/',
            'notification_logs': '/api/logs/',
        }
    })