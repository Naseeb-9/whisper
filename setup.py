#!/usr/bin/env python3
"""
Setup script for Whisper Node.js application
This script installs the required Python dependencies for the local Whisper model
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Python dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing Python dependencies: {e}")
        return False

def test_whisper():
    """Test if Whisper is working correctly"""
    print("Testing Whisper installation...")
    try:
        import whisper
        model = whisper.load_model("small")
        print("✅ Whisper model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error testing Whisper: {e}")
        return False

def test_translator():
    """Test if the translation model is working correctly"""
    print("Testing translation model...")
    try:
        from transformers import pipeline
        translator = pipeline("translation", model="Helsinki-NLP/opus-mt-ur-en")
        # Test with a simple Urdu phrase
        test_result = translator("آپ کیسے ہیں؟")
        print("✅ Translation model loaded successfully!")
        print(f"   Test translation: 'آپ کیسے ہیں؟' -> '{test_result[0]['translation_text']}'")
        return True
    except Exception as e:
        print(f"❌ Error testing translation model: {e}")
        return False

def main():
    print("🚀 Setting up Whisper Node.js application...")
    print("=" * 50)
    
    # Install requirements
    if not install_requirements():
        print("Setup failed. Please check the error messages above.")
        return False
    
    # Test Whisper
    if not test_whisper():
        print("Setup failed. Whisper model could not be loaded.")
        return False
    
    # Test Translation model
    if not test_translator():
        print("Setup failed. Translation model could not be loaded.")
        return False
    
    print("=" * 50)
    print("✅ Setup completed successfully!")
    print("You can now run: npm start")
    print("The server will use:")
    print("  - Local Whisper 'small' model for transcription")
    print("  - Helsinki-NLP translator for Urdu to English translation")
    
    return True

if __name__ == "__main__":
    main()
