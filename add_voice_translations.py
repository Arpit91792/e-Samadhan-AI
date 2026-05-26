#!/usr/bin/env python3
import json
from pathlib import Path

# Path to locales directory
LOCALES_DIR = Path("src/i18n/locales")

# New translation keys for VoiceComplaint
VOICE_COMPLAINT_KEYS = {
    "voiceComplaint": {
        "title": "AI Voice Complaint",
        "instruction": "Click microphone and speak your complaint in any language",
        "detectedVoice": "Detected Voice:",
        "analyzing": "AI analyzing complaint...",
        "tryAgain": "Try Again",
        "hearSummary": "Hear Summary"
    }
}

# English translations
TRANSLATIONS = {
    "en": {
        "voiceComplaint": {
            "title": "AI Voice Complaint",
            "instruction": "Click microphone and speak your complaint in any language",
            "detectedVoice": "Detected Voice:",
            "analyzing": "AI analyzing complaint...",
            "tryAgain": "Try Again",
            "hearSummary": "Hear Summary"
        }
    },
    "hi": {
        "voiceComplaint": {
            "title": "एआई वॉयस शिकायत",
            "instruction": "माइक्रोफोन पर क्लिक करें और अपनी शिकायत किसी भी भाषा में बोलें",
            "detectedVoice": "पहचानी गई आवाज़:",
            "analyzing": "एआई शिकायत का विश्लेषण कर रहा है...",
            "tryAgain": "फिर से कोशिश करें",
            "hearSummary": "सारांश सुनें"
        }
    },
    "mr": {
        "voiceComplaint": {
            "title": "एआই व्हॉइस तक्रार",
            "instruction": "माइक्रोफोन क्लिक करा आणि आपली तक्रार कोणतीही भाषेत बोला",
            "detectedVoice": "शोधलेली व्हॉइस:",
            "analyzing": "एआई तक्रारीचे विश्लेषण करत आहे...",
            "tryAgain": "पुन्हा प्रयत्न करा",
            "hearSummary": "सारांश ऐका"
        }
    },
    "bn": {
        "voiceComplaint": {
            "title": "এআই ভয়েস অভিযোগ",
            "instruction": "মাইক্রোফোনে ক্লিক করুন এবং যেকোনো ভাষায় আপনার অভিযোগ বলুন",
            "detectedVoice": "সনাক্ত করা ভয়েস:",
            "analyzing": "এআই অভিযোগ বিশ্লেষণ করছে...",
            "tryAgain": "আবার চেষ্টা করুন",
            "hearSummary": "সারাংশ শুনুন"
        }
    },
    "ta": {
        "voiceComplaint": {
            "title": "AI குரல் புகார்",
            "instruction": "மைக்ரோஃபோனைக் கிளிக் செய்து உங்கள் புகாரை எந்த மொழியிலும் சொல்லுங்கள்",
            "detectedVoice": "கண்டறிந்த குரல்:",
            "analyzing": "AI புகாரை பகுப்பாய்வு செய்கிறது...",
            "tryAgain": "மீண்டும் முயற்சி செய்யவும்",
            "hearSummary": "சுருக்கத்தைக் கேளுங்கள்"
        }
    },
    "te": {
        "voiceComplaint": {
            "title": "AI వాయిస్ ఫిర్యాదు",
            "instruction": "మైక్రోఫోన్‌ను క్లిక్ చేసి మీ ఫిర్యాదు ఏ ভাषায় అయినా చెప్పండి",
            "detectedVoice": "గుర్తించిన వాయిస్:",
            "analyzing": "AI ఫిర్యాదు విశ్లేషణ చేస్తోంది...",
            "tryAgain": "మళ్ళీ ప్రయత్నించండి",
            "hearSummary": "సారాంశం వినండి"
        }
    },
    "gu": {
        "voiceComplaint": {
            "title": "AI વોઇસ ફરિયાદ",
            "instruction": "માઇક્રોફોન પર ક્લિક કરો અને તમારી ફરિયાદ કોઈપણ ભાષામાં બોલો",
            "detectedVoice": "શોધાયેલ વોઇસ:",
            "analyzing": "AI ફરિયાદનું વિશ્લેષણ કરી રહ્યું છે...",
            "tryAgain": "ફરી પ્રયાસ કરો",
            "hearSummary": "સારાંશ સાંભળો"
        }
    },
    "pa": {
        "voiceComplaint": {
            "title": "AI ਵੌਸ ਸ਼ਿਕਾਇਤ",
            "instruction": "ਮਾਈਕ੍ਰੋਫੋਨ ਨੂੰ ਕਲਿੱਕ ਕਰੋ ਅਤੇ ਆਪਣੀ ਸ਼ਿਕਾਇਤ ਕਿਸੇ ਵੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ",
            "detectedVoice": "ਖੋਜੀ ਗਈ ਵੌਸ:",
            "analyzing": "AI ਸ਼ਿਕਾਇਤ ਦੀ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਹੀ ਹੈ...",
            "tryAgain": "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
            "hearSummary": "ਸਾਰ ਸੁਣੋ"
        }
    }
}

def add_voice_complaint_keys():
    """Add voiceComplaint keys to all language files"""
    for lang_code, translations in TRANSLATIONS.items():
        lang_file = LOCALES_DIR / lang_code / "translation.json"
        
        if not lang_file.exists():
            print(f"⚠️  File not found: {lang_file}")
            continue
        
        try:
            with open(lang_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Add or update voiceComplaint keys
            if "voiceComplaint" not in data:
                data["voiceComplaint"] = translations["voiceComplaint"]
            else:
                data["voiceComplaint"].update(translations["voiceComplaint"])
            
            # Write back with proper formatting
            with open(lang_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Added voiceComplaint keys to {lang_code}")
        except Exception as e:
            print(f"❌ Error updating {lang_code}: {e}")

# Run the update
if __name__ == "__main__":
    print("Adding voiceComplaint translation keys...")
    add_voice_complaint_keys()
    print("\n✨ All translation files updated!")
