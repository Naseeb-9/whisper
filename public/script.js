class SpeechTranslator {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.animationId = null;

        this.initializeElements();
        this.setupEventListeners();
        this.setupAudioVisualizer();
    }

    initializeElements() {
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.status = document.getElementById('status');
        this.timer = document.getElementById('timer');
        this.originalText = document.getElementById('originalText');
        this.translatedText = document.getElementById('translatedText');
        this.loadingSection = document.getElementById('loadingSection');
        this.visualizer = document.getElementById('visualizer');
    }

    setupEventListeners() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
    }

    setupAudioVisualizer() {
        const canvas = this.visualizer;
        const ctx = canvas.getContext('2d');
        this.canvasCtx = ctx;
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };

            // Setup audio visualization
            this.setupAudioAnalysis(stream);

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();

            this.updateUI('recording');
            this.startTimer();
            this.startVisualization();

        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.updateStatus('Error: Could not access microphone. Please check permissions.');
        }
    }

    setupAudioAnalysis(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        
        this.analyser.fftSize = 256;
        this.microphone.connect(this.analyser);
    }

    startVisualization() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isRecording) return;

            this.animationId = requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            this.canvasCtx.fillStyle = '#f8f9fa';
            this.canvasCtx.fillRect(0, 0, this.visualizer.width, this.visualizer.height);
            
            const barWidth = (this.visualizer.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * this.visualizer.height;
                
                const gradient = this.canvasCtx.createLinearGradient(0, this.visualizer.height, 0, this.visualizer.height - barHeight);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                
                this.canvasCtx.fillStyle = gradient;
                this.canvasCtx.fillRect(x, this.visualizer.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };

        draw();
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop all tracks
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            this.updateUI('stopped');
            this.stopTimer();
            this.stopVisualization();
        }
    }

    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clear canvas
        this.canvasCtx.fillStyle = '#f8f9fa';
        this.canvasCtx.fillRect(0, 0, this.visualizer.width, this.visualizer.height);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateUI(state) {
        switch (state) {
            case 'recording':
                this.recordBtn.disabled = true;
                this.stopBtn.disabled = false;
                this.status.textContent = 'Recording... Speak in Urdu';
                this.status.style.color = '#f44336';
                document.body.classList.add('recording');
                break;
            case 'stopped':
                this.recordBtn.disabled = false;
                this.stopBtn.disabled = true;
                this.status.textContent = 'Processing your speech...';
                this.status.style.color = '#667eea';
                document.body.classList.remove('recording');
                break;
            case 'ready':
                this.recordBtn.disabled = false;
                this.stopBtn.disabled = true;
                this.status.textContent = 'Click "Start Recording" to begin';
                this.status.style.color = '#555';
                this.timer.textContent = '00:00';
                break;
        }
    }

    updateStatus(message) {
        this.status.textContent = message;
        this.status.style.color = '#f44336';
    }

    async processRecording() {
        this.loadingSection.style.display = 'block';
        
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            this.displayResults(result.originalText, result.translatedText);
            this.updateUI('ready');

        } catch (error) {
            console.error('Error processing recording:', error);
            this.updateStatus('Error processing audio. Please try again.');
            this.updateUI('ready');
        } finally {
            this.loadingSection.style.display = 'none';
        }
    }

    displayResults(original, translated) {
        this.originalText.textContent = original;
        this.originalText.classList.add('has-content');
        
        this.translatedText.textContent = translated;
        this.translatedText.classList.add('has-content');
        
        // Add a subtle animation
        this.originalText.style.transform = 'translateY(10px)';
        this.originalText.style.opacity = '0';
        this.translatedText.style.transform = 'translateY(10px)';
        this.translatedText.style.opacity = '0';
        
        setTimeout(() => {
            this.originalText.style.transition = 'all 0.5s ease';
            this.originalText.style.transform = 'translateY(0)';
            this.originalText.style.opacity = '1';
            
            setTimeout(() => {
                this.translatedText.style.transition = 'all 0.5s ease';
                this.translatedText.style.transform = 'translateY(0)';
                this.translatedText.style.opacity = '1';
            }, 200);
        }, 100);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpeechTranslator();
});

// Handle page visibility changes to stop recording if user switches tabs
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.speechTranslator && window.speechTranslator.isRecording) {
        window.speechTranslator.stopRecording();
    }
});
