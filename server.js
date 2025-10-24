import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// No OpenAI initialization needed for local Whisper model

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Transcribe audio using local Whisper model
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Get language and task from request body (with defaults)
    const language = req.body.language || 'ur';  // Default to Urdu
    const task = req.body.task || 'translate';   // Default to translate

    console.log(`Processing: ${req.file.filename} (${(req.file.size / 1024).toFixed(1)}KB) - ${language.toUpperCase()} → ${task.toUpperCase()}`);

    // Transcribe/translate using local Whisper model (same as command line)
    const result = await new Promise((resolve, reject) => {
      const python = spawn('python', ['transcribe.py', req.file.path, language, task]);
      let output = '';
      let error = '';

      // Set timeout for 30 seconds (for faster feedback during testing)
      const timeout = setTimeout(() => {
        python.kill();
        reject(new Error('Processing timeout after 30 seconds - model may be loading for first time'));
      }, 60000);

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${error}`));
        } else {
          try {
            const jsonResult = JSON.parse(output.trim());
            resolve(jsonResult);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${parseError.message}`));
          }
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start Python script: ${err.message}`));
      });
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Log the results
    if (task === 'translate') {
      console.log(`✅ Translation: "${result.translatedText}"`);
    } else {
      console.log(`✅ Transcription: "${result.originalText}"`);
    }

    res.json({
      originalText: result.originalText,
      translatedText: result.translatedText,
      language: result.language,
      task: result.task,
      model: 'whisper-small-local-direct'
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Failed to process audio',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Whisper API server is running' });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log('🤖 Using Whisper model for transcription and translation');
});
