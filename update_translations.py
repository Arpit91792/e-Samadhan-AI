#!/usr/bin/env python3
import json
import os
from pathlib import Path

# Path to locales directory
LOCALES_DIR = Path("src/i18n/locales")

# New translation keys to add (with English as source)
NEW_KEYS = {
    "citizenSignup": {
        "title": "Citizen Registration",
        "subtitle": "AI-powered identity verification & signup",
        "personalInfo": "👤 Personal Information",
        "locationInfo": "📍 Location Information",
        "govtIdVerification": "🪪 Government ID Verification",
        "aiLivenessDetection": "🛡️ AI Liveness Detection",
        "emailOtpVerification": "✉️ Email OTP Verification",
        "createAccount": "Create Account",
        "creating": "Creating...",
        "back": "Back",
        "geolocationNotSupported": "Geolocation not supported",
        "locationDetected": "📍 Location detected!",
        "couldNotFetchAddress": "Could not fetch address. Enter manually.",
        "documentVerificationRequired": "Document Verification Required",
        "documentVerificationDesc": "Upload your government ID. AI will scan and verify it automatically.",
        "supportsFormats": "Supports JPG, PNG, WebP, PDF",
        "uploadedDocument": "Document uploaded",
        "fixErrorsBelow": "Please fix the errors below",
        "registerAsOfficer": "Registering as officer instead?"
    },
    "officerSignup": {
        "title": "Officer Registration",
        "subtitle": "Government officer account with department access",
        "personalInfo": "👤 Personal Information",
        "emailOtpVerification": "✉️ Email OTP Verification",
        "aiLivenessDetection": "🛡️ AI Liveness Detection",
        "registrationSummary": "📋 Registration Summary",
        "selfieCaptured": "Selfie captured!",
        "fixErrorsBelow": "Please fix the errors below",
        "completeRegistration": "Complete Registration",
        "registering": "Registering...",
        "back": "Back"
    },
    "adminSignup": {
        "title": "Admin Registration",
        "subtitle": "Department + secret key required",
        "accountCreation": "Account Creation",
        "createAdminAccount": "Create Admin Account",
        "creating": "Creating...",
        "back": "Back",
        "departmentCode": "Department Code",
        "secretKey": "Secret Key",
        "fixErrorsBelow": "Please fix the errors below"
    },
    "documentVerifier": {
        "title": "Document Verification",
        "uploadId": "Upload your Government ID",
        "aiScanning": "AI Scanning Document...",
        "documentVerified": "Document Verified ✓",
        "uploadDifferent": "Upload Different Document",
        "wrongDocumentUploaded": "Wrong Document Uploaded",
        "uploadCorrectDocument": "Upload Correct Document"
    },
    "faceVerifier": {
        "title": "Face Verification",
        "takePhoto": "Take Photo",
        "retake": "Retake",
        "cancel": "Cancel",
        "verifyFace": "Verify Face with AI"
    },
    "livenessVerifier": {
        "title": "AI Liveness Detection",
        "subtitle": "Government eKYC — anti-spoof verification",
        "startVerification": "Start Verification",
        "verifying": "Verifying..."
    },
    "emailOtpVerification": {
        "title": "Email Verification",
        "emailVerified": "Email Verified Successfully!",
        "otherMessages": "Verification in progress..."
    },
    "adminLoginPage": {
        "governmentAdminPortal": "Government Admin Portal",
        "copyright": "© e-Samadhan AI — Smart Governance"
    },
    "toastMessages": {
        "locationDetected": "📍 Location detected!",
        "selfieCapturing": "Selfie captured!",
        "pleaseFixErrors": "Please fix the errors below",
        "geolocationNotSupported": "Geolocation not supported",
        "couldNotFetchAddress": "Could not fetch address. Enter manually.",
        "alreadyRegistered": "Already registered. Please login.",
        "accountBlocked": "Your account has been blocked by admin.",
        "sendingOtp": "Sending OTP...",
        "verifyingOtp": "Verifying OTP...",
        "verifyingDocument": "Verifying document...",
        "verifyingLiveness": "Verifying liveness...",
        "success": "Success!",
        "error": "Error",
        "warning": "Warning",
        "failedToLoadGeolocation": "Failed to load geolocation"
    },
    "cameraCaptureMessages": {
        "allowCameraAccess": "Please allow camera access",
        "photoNotCapturing": "Photo is not capturing properly",
        "tryAgain": "Try Again",
        "cameraNotAvailable": "Camera not available"
    },
    "livenessMessages": {
        "keepHeadCentered": "Keep your head centered",
        "lookAtCamera": "Look at the camera",
        "blinkEyes": "Blink your eyes",
        "turnHeadLeft": "Turn your head left",
        "turnHeadRight": "Turn your head right",
        "livenessCheckFailed": "Liveness check failed. Try again.",
        "verifying": "Verifying..."
    },
    "signupValidationMessages": {
        "emailAlreadyExists": "Email already exists",
        "passwordTooWeak": "Password too weak",
        "passwordsMustMatch": "Passwords must match",
        "invalidPhoneNumber": "Invalid phone number",
        "invalidPinCode": "Invalid PIN code",
        "selectDepartment": "Please select a department",
        "selectDocumentType": "Please select a document type",
        "uploadDocument": "Please upload a document",
        "fieldRequired": "This field is required",
        "invalidEmail": "Invalid email address",
        "invalidInput": "Invalid input"
    }
}

def add_missing_keys_to_lang(lang_code, lang_file):
    """Add missing keys to a language file, using English as fallback."""
    try:
        with open(lang_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Add missing keys
        updated = False
        for section, keys in NEW_KEYS.items():
            if section not in data:
                data[section] = keys
                updated = True
            else:
                for key, value in keys.items():
                    if key not in data[section]:
                        data[section][key] = value
                        updated = True
        
        if updated:
            with open(lang_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✅ Updated {lang_code}: {lang_file}")
        else:
            print(f"⏭️  Already up-to-date: {lang_code}")
    except Exception as e:
        print(f"❌ Error updating {lang_code}: {e}")

# Update all language files
languages = ['en', 'hi', 'mr', 'bn', 'ta', 'te', 'gu', 'pa']
for lang in languages:
    lang_file = LOCALES_DIR / lang / 'translation.json'
    if lang_file.exists():
        add_missing_keys_to_lang(lang, lang_file)
    else:
        print(f"⚠️  File not found: {lang_file}")

print("\n✨ Translation updates complete!")
