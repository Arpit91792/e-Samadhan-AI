#!/usr/bin/env python3
"""
e-Samadhan AI Translation File Manager
Manages and extends translation files for all 8 supported languages
"""

import json
from pathlib import Path
from typing import Dict, Any

class TranslationManager:
    def __init__(self):
        self.base_path = Path(r"d:\e-Samadhan AI\src\i18n\locales")
        self.languages = ['en', 'hi', 'mr', 'bn', 'ta', 'te', 'gu', 'pa']
        
    def load_english_translations(self) -> Dict[str, Any]:
        """Load the complete English translation file"""
        en_file = self.base_path / "en" / "translation.json"
        if en_file.exists():
            with open(en_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def get_language_file(self, lang_code: str) -> Path:
        """Get the path to a language translation file"""
        return self.base_path / lang_code / "translation.json"
    
    def load_language_file(self, lang_code: str) -> Dict[str, Any]:
        """Load a language file or return empty dict if not exists"""
        lang_file = self.get_language_file(lang_code)
        if lang_file.exists():
            try:
                with open(lang_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                print(f"⚠️  {lang_code} file is malformed")
                return {}
        return {}
    
    def merge_translations(self, existing: Dict, template: Dict) -> Dict:
        """Merge existing translations with template, keeping existing values"""
        merged = template.copy()
        for key, value in existing.items():
            if isinstance(value, dict) and key in merged and isinstance(merged[key], dict):
                merged[key] = self.merge_translations(value, merged[key])
            else:
                merged[key] = value
        return merged
    
    def save_language_file(self, lang_code: str, translations: Dict):
        """Save translations to language file"""
        lang_file = self.get_language_file(lang_code)
        lang_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(lang_file, 'w', encoding='utf-8') as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)
        print(f"✅ {lang_code.upper()}: {lang_file}")
    
    def validate_all_files(self):
        """Validate all translation files"""
        print("\n📋 Translation File Status:")
        print("=" * 50)
        
        english = self.load_english_translations()
        en_keys = len(self._flatten_keys(english))
        print(f"English: {en_keys} keys")
        
        for lang in self.languages[1:]:
            lang_trans = self.load_language_file(lang)
            lang_keys = len(self._flatten_keys(lang_trans)) if lang_trans else 0
            coverage = (lang_keys / en_keys * 100) if en_keys > 0 else 0
            status = "✅" if coverage > 90 else "⚠️ " if coverage > 70 else "❌"
            print(f"{status} {lang.upper()}: {lang_keys} keys ({coverage:.1f}% coverage)")
    
    def _flatten_keys(self, d: Dict, prefix: str = "") -> list:
        """Flatten nested dictionary keys"""
        keys = []
        for k, v in d.items():
            key_path = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                keys.extend(self._flatten_keys(v, key_path))
            else:
                keys.append(key_path)
        return keys

def main():
    manager = TranslationManager()
    
    print("🌐 e-Samadhan AI Translation Manager")
    print("=" * 50)
    
    # Validate current translations
    manager.validate_all_files()
    
    # Instructions for completing translations
    print("\n📝 Next Steps:")
    print("1. Update incomplete language files")
    print("2. Add language switcher to all missing pages")
    print("3. Test language switching functionality")
    print("4. Verify localStorage persistence")

if __name__ == '__main__':
    main()
