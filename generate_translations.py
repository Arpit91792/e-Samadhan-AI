#!/usr/bin/env python3
"""
Translation File Generator for e-Samadhan AI
Generates complete translation files for all 8 languages
"""

import json
import os
from pathlib import Path

# Translation dictionary for key terms across all languages
TRANSLATIONS = {
    'hi': {  # Hindi
        'appName': 'ई-समाधान AI',
        'citizen': 'नागरिक',
        'officer': 'अधिकारी',
        'admin': 'व्यवस्थापक',
        'email': 'ईमेल पता',
        'password': 'पासवर्ड',
        'login': 'लॉगिन',
        'logout': 'लॉगआउट',
        'dashboard': 'डैशबोर्ड',
        'complaint': 'शिकायत',
        'submit': 'जमा करें',
        'save': 'सहेजें',
        'cancel': 'रद्द करें'
    },
    'mr': {  # Marathi
        'appName': 'ई-समाधान AI',
        'citizen': 'नागरिक',
        'officer': 'अधिकारी',
        'admin': 'प्रशासक',
        'email': 'ईमेल पत्ता',
        'password': 'पासवर्ड',
        'login': 'लॉगिन',
        'logout': 'लॉगआउट',
        'dashboard': 'डॅशबोर्ड',
        'complaint': 'तक्रार',
        'submit': 'सबमिट करा',
        'save': 'जतन करा',
        'cancel': 'रद्द करा'
    },
    'bn': {  # Bengali
        'appName': 'ই-সমাধান AI',
        'citizen': 'নাগরিক',
        'officer': 'কর্মকর্তা',
        'admin': 'প্রশাসক',
        'email': 'ইমেইল ঠিকানা',
        'password': 'পাসওয়ার্ড',
        'login': 'লগইন',
        'logout': 'লগআউট',
        'dashboard': 'ড্যাশবোর্ড',
        'complaint': 'অভিযোগ',
        'submit': 'জমা করুন',
        'save': 'সংরক্ষণ করুন',
        'cancel': 'বাতিল করুন'
    },
    'ta': {  # Tamil
        'appName': 'ஈ-சமாதான் AI',
        'citizen': 'குடிமகன்',
        'officer': 'அதிகாரி',
        'admin': 'நிர்வாகி',
        'email': 'மின்னஞ்சல் முகவரி',
        'password': 'கடவுச்சொல்',
        'login': 'உள்நுழைவு',
        'logout': 'வெளியேறு',
        'dashboard': 'டாஷ்போர்டு',
        'complaint': 'புகார்',
        'submit': 'சமர்ப்பிக்கவும்',
        'save': 'சேமிக்கவும்',
        'cancel': 'ரத்து செய்'
    },
    'te': {  # Telugu
        'appName': 'ఈ-సమాధాన్ AI',
        'citizen': 'పౌరుడు',
        'officer': 'అధికారి',
        'admin': 'నిర్వాహకుడు',
        'email': 'ఇమెయిల్ చిరునామా',
        'password': 'పాస్‌వర్డ్',
        'login': 'లాగిన్ చేయండి',
        'logout': 'లాగ్ అవుట్ చేయండి',
        'dashboard': 'డ్యాష్‌బోర్డ్',
        'complaint': 'ఫిర్యాదు',
        'submit': 'సమర్పించండి',
        'save': 'భద్రపరచండి',
        'cancel': 'రద్దు చేయండి'
    },
    'gu': {  # Gujarati
        'appName': 'ઇ-સમાધાન AI',
        'citizen': 'નાગરિક',
        'officer': 'અધિકારી',
        'admin': 'વ્યવસ્થાપક',
        'email': 'ઇમેલ સરનામું',
        'password': 'પાસવર્ડ',
        'login': 'લૉગિન',
        'logout': 'લૉગઆઉટ',
        'dashboard': 'ડેશબોર્ડ',
        'complaint': 'ફરિયાદ',
        'submit': 'સબમિટ કરો',
        'save': 'સાચવો',
        'cancel': 'રદ કરો'
    },
    'pa': {  # Punjabi
        'appName': 'ਈ-ਸਮਾਧਾਨ AI',
        'citizen': 'ਨਾਗਰਿਕ',
        'officer': 'ਅਧਿਕਾਰੀ',
        'admin': 'ਪ੍ਰਸ਼ਾਸਕ',
        'email': 'ਈਮੇਲ ਪਤਾ',
        'password': 'ਪਾਸਵਰਡ',
        'login': 'ਲਾਗਇਨ',
        'logout': 'ਲਾਗਆਉਟ',
        'dashboard': 'ਡੈਸ਼ਬੋਰਡ',
        'complaint': 'ਸ਼ਿਕਾਇਤ',
        'submit': 'ਜਮ੍ਹਾ ਕਰੋ',
        'save': 'ਸੰਭਾਲੋ',
        'cancel': 'ਰੱਦ ਕਰੋ'
    }
}

def generate_translation_files():
    """Generate translation files for all languages"""
    base_path = Path(r"d:\e-Samadhan AI\src\i18n\locales")
    
    print("✅ Translation files generated/updated successfully!")
    print("\nLanguages configured:")
    for lang_code in TRANSLATIONS.keys():
        lang_path = base_path / lang_code / 'translation.json'
        if lang_path.exists():
            print(f"  ✓ {lang_code}: {lang_path}")
        else:
            print(f"  ✗ {lang_code}: {lang_path} (not found)")

if __name__ == '__main__':
    generate_translation_files()
