from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from .models import OTPVerification, PasswordResetToken
from .serializers import ForgotPasswordSerializer, ResetPasswordSerializer
import random
from datetime import datetime


# =================== AUTHENTICATION VIEWS ===================

@api_view(['POST'])
def signup(request):
    """User registration with email OTP verification"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if User.objects.filter(username__iexact=username).exists():
        return Response({'error': 'Username already exists'}, status=400)
    
    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'Email already exists'}, status=400)
    
    # Create user but set as inactive
    user = User.objects.create_user(
        username=username, 
        email=email, 
        password=password,
        is_active=False
    )
    
    # Generate and send OTP
    otp = OTPVerification.generate_otp()
    OTPVerification.objects.create(user=user, otp=otp)
    
    # Send email
    try:
        send_mail(
            'Verify Your Account - MyApp',
            f'''
            Hello {username},
            
            Thank you for signing up! Your OTP verification code is: {otp}
            
            This OTP will expire in 10 minutes.
            
            If you didn't create an account, please ignore this email.
            
            Best regards,
            MyApp Team
            ''',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return Response({
            'message': 'User created successfully. Please check your email for OTP verification.',
            'user_id': user.id
        }, status=201)
    except Exception as e:
        user.delete()
        return Response({'error': 'Failed to send verification email. Please try again.'}, status=500)


@api_view(['POST'])
def login(request):
    """User login with JWT token generation"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user and user.is_active:
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful!',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
    elif user and not user.is_active:
        return Response({'error': 'Account not verified. Please check your email for OTP.'}, status=401)
    else:
        return Response({'error': 'Invalid username or password.'}, status=401)


# =================== OTP VERIFICATION VIEWS ===================

@api_view(['POST'])
def verify_otp(request):
    """Verify OTP and activate user account"""
    user_id = request.data.get('user_id')
    otp_entered = request.data.get('otp')
    
    try:
        user = User.objects.get(id=user_id)
        otp_obj = OTPVerification.objects.get(user=user)
        
        if otp_obj.is_expired():
            return Response({'error': 'OTP has expired. Please request a new one.'}, status=400)
        
        if otp_obj.otp == otp_entered:
            user.is_active = True
            user.save()
            otp_obj.is_verified = True
            otp_obj.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Account verified successfully! You are now logged in.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=200)
        else:
            return Response({'error': 'Invalid OTP. Please check and try again.'}, status=400)
            
    except (User.DoesNotExist, OTPVerification.DoesNotExist):
        return Response({'error': 'Invalid verification request.'}, status=400)


@api_view(['POST'])
def resend_otp(request):
    """Resend OTP to user's email"""
    user_id = request.data.get('user_id')
    
    try:
        user = User.objects.get(id=user_id)
        otp_obj = OTPVerification.objects.get(user=user)
        
        # Generate new OTP
        new_otp = OTPVerification.generate_otp()
        otp_obj.otp = new_otp
        otp_obj.created_at = datetime.now()
        otp_obj.save()
        
        # Send email
        send_mail(
            'New OTP - MyApp',
            f'''
            Hello {user.username},
            
            Your new OTP verification code is: {new_otp}
            
            This OTP will expire in 10 minutes.
            
            Best regards,
            MyApp Team
            ''',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return Response({'message': 'New OTP sent successfully to your email!'}, status=200)
        
    except (User.DoesNotExist, OTPVerification.DoesNotExist):
        return Response({'error': 'Invalid request.'}, status=400)
    except Exception as e:
        return Response({'error': 'Failed to send email. Please try again.'}, status=500)


# =================== PASSWORD RESET VIEWS ===================

@api_view(['POST'])
def forgot_password(request):
    """Send password reset token to user's email"""
    serializer = ForgotPasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email__iexact=email)
            
            # Delete any existing password reset tokens for this user
            PasswordResetToken.objects.filter(user=user).delete()
            
            # Generate new reset token
            reset_token = PasswordResetToken.generate_token()
            PasswordResetToken.objects.create(user=user, token=reset_token)
            
            # Send email with reset link
            reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            
            send_mail(
                'Password Reset - MyApp',
                f'''
                Hello {user.username},
                
                You requested a password reset. Click the link below to reset your password:
                
                {reset_link}
                
                This link will expire in 1 hour.
                
                If you didn't request this reset, please ignore this email.
                
                Best regards,
                MyApp Team
                ''',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Password reset link sent to your email successfully!'
            }, status=200)
            
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            return Response({
                'message': 'If this email exists in our system, you will receive a password reset link.'
            }, status=200)
        except Exception as e:
            return Response({
                'error': 'Failed to send password reset email. Please try again.'
            }, status=500)
    
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def reset_password(request):
    """Reset user password using valid token"""
    serializer = ResetPasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            reset_token_obj = PasswordResetToken.objects.get(token=token)
            
            if reset_token_obj.is_expired():
                return Response({
                    'error': 'Password reset token has expired. Please request a new one.'
                }, status=400)
            
            if reset_token_obj.is_used:
                return Response({
                    'error': 'This password reset token has already been used.'
                }, status=400)
            
            # Reset the password
            user = reset_token_obj.user
            user.set_password(new_password)
            user.save()
            
            # Mark token as used
            reset_token_obj.is_used = True
            reset_token_obj.save()
            
            # Send confirmation email
            send_mail(
                'Password Reset Successful - MyApp',
                f'''
                Hello {user.username},
                
                Your password has been successfully reset.
                
                If you didn't make this change, please contact our support team immediately.
                
                Best regards,
                MyApp Team
                ''',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,  # Don't fail if confirmation email fails
            )
            
            return Response({
                'message': 'Password reset successful! You can now login with your new password.'
            }, status=200)
            
        except PasswordResetToken.DoesNotExist:
            return Response({
                'error': 'Invalid or expired password reset token.'
            }, status=400)
        except Exception as e:
            return Response({
                'error': 'Failed to reset password. Please try again.'
            }, status=500)
    
    return Response(serializer.errors, status=400)


# =================== USER PROFILE VIEWS ===================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get authenticated user's profile information"""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'date_joined': user.date_joined,
        'is_verified': user.is_active
    })