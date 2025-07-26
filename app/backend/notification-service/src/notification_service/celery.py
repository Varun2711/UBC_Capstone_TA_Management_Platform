import os
from celery import Celery
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'notification_service.settings')

django.setup()

app = Celery('notification_service')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')