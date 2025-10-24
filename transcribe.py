import sys
import whisper
import json
import warnings
import os

# Suppress the FP16 warning that appears when using CPU
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

# CLI argument se file path lo
if len(sys.argv) < 2:
    print("Error: Please provide an audio file path")
    print("Usage: python transcribe.py <audio_file_path> [language] [task]")
    sys.exit(1)

file_path = sys.argv[1]
language = sys.argv[2] if len(sys.argv) > 2 else "ur"  # Default to Urdu
task = sys.argv[3] if len(sys.argv) > 3 else "translate"  # Default to translate

# Check if file exists
if not os.path.exists(file_path):
    print(f"Error: Audio file not found: {file_path}")
    sys.exit(1)

# Load Whisper model
model_name = "small"  # Change this to tiny/base/medium/large as needed
try:
    model = whisper.load_model(model_name)
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    sys.exit(1)

# Process audio with Whisper
try:
    result = model.transcribe(
        file_path, 
        language=language, 
        task=task,
        temperature=0,
        best_of=1,
        beam_size=5
    )
except Exception as e:
    print(f"Error during transcription: {e}")
    sys.exit(1)

# Extract text from result
processed_text = result["text"].strip()
if not processed_text:
    processed_text = "[No speech detected]"

# Prepare output based on task
if task == "translate":
    output = {
        "originalText": f"[Original {language.upper()} speech detected]",
        "translatedText": processed_text,
        "language": language,
        "task": task,
        "model": f"whisper-{model_name}"
    }
else:
    output = {
        "originalText": processed_text,
        "translatedText": "[Translation not requested]",
        "language": language,
        "task": task,
        "model": f"whisper-{model_name}"
    }

# Output JSON result
print(json.dumps(output, ensure_ascii=False))
