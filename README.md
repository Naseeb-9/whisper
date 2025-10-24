# Urdu Speech to English Translation with Local Models

A web application that uses open source models locally to convert Urdu speech to text and translate it to English. No API keys required!

## Features

- 🎤 Real-time audio recording
- 🗣️ Urdu speech recognition using local Whisper model (small)
- 🌐 Automatic translation from Urdu to English using Helsinki-NLP translator
- 📱 Responsive design
- 🎨 Modern UI with audio visualization
- 🔒 Privacy-focused (no data sent to external APIs)
- 💰 Cost-free (no API charges)

## Setup Instructions

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
# Option 1: Use the setup script (recommended)
python setup.py

# Option 2: Manual installation
pip install -r requirements.txt
```

### 3. Run the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## How to Use

1. Open the application in your web browser
2. Click "Start Recording" and allow microphone access
3. Speak in Urdu
4. Click "Stop Recording" when finished
5. Wait for the processing to complete
6. View your transcribed Urdu text and English translation

## Technical Details

- **Backend**: Node.js with Express
- **AI Models**: 
  - Local Whisper model (small) for speech recognition
  - Helsinki-NLP opus-mt-ur-en for Urdu to English translation
- **Frontend**: Vanilla JavaScript with modern CSS
- **Audio Processing**: Web Audio API for recording and visualization
- **Python Integration**: Child process execution for transcription and translation

## API Endpoints

- `GET /` - Serves the main application
- `POST /transcribe` - Processes audio and returns transcription + translation
- `GET /health` - Health check endpoint

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Microphone Access Issues
- Ensure your browser has permission to access the microphone
- Try refreshing the page and allowing permissions again

### Python/Model Issues
- Make sure Python is installed and accessible from command line
- Verify that all Python dependencies are installed: `pip list | grep -E "(whisper|transformers)"`
- Check that the Whisper model can be loaded: `python -c "import whisper; whisper.load_model('small')"`
- Check that the translation model can be loaded: `python -c "from transformers import pipeline; pipeline('translation', model='Helsinki-NLP/opus-mt-ur-en')"`

### Audio Processing Errors
- Ensure you're speaking clearly in Urdu
- Try shorter recordings (under 30 seconds)
- Check that the audio file format is supported (WAV, MP3, M4A, etc.)

### Performance Notes
- First transcription may take longer as both models load
- The "small" Whisper model provides good balance between speed and accuracy
- Translation model will be downloaded on first use (~200MB)
- For faster processing, you can change to "tiny" Whisper model in `transcribe.py`
- Both models will be cached after first use for faster subsequent processing

## License

MIT License
