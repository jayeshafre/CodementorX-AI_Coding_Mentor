from django.db import models
from django.contrib.auth.models import User
import random
from datetime import datetime, timedelta
import uuid
from django.utils import timezone

class OTPVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    
    def is_expired(self):
        return datetime.now() > (self.created_at + timedelta(minutes=10)).replace(tzinfo=None)
    
    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))
    
class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    
    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(hours=1)  # 1 hour expiry
    
    class Meta:
        db_table = 'password_reset_tokens'