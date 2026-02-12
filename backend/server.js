const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// ✅ CORS for production
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://tender-ai-frontend.onrender.com'
    ],
    credentials: true
}));

app.use(express.json());

// ✅ TEST ROUTE - Works
app.get('/', (req, res) => {
    res.json({ 
        message: 'Tender AI API is running!',
        status: 'API Key: ' + (process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing'),
        timestamp: new Date().toISOString()
    });
});

// ✅ CRITICAL: API ANALYZE ROUTE - THIS WAS MISSING!
app.post('/api/analyze', upload.single('document'), (req, res) => {
    try {
        console.log('📄 Received file:', req.file?.originalname);
        
        // Mock analysis response
        const analysis = {
            deadline: "2024-12-15",
            requirements: [
                "Company registration certificate",
                "3 years of similar experience",
                "Bank guarantee of 5%",
                "ISO 9001 certification",
                "Local content commitment"
            ],
            evaluation_criteria: {
                technical: "40%",
                commercial: "30%",
                icv: "20%",
                hsee: "10%"
            }
        };

        res.json({
            success: true,
            filename: req.file?.originalname,
            analysis: analysis
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Handle any other routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ────────────────────────────
    ✅ Server running on port ${PORT}
    📍 Local: http://localhost:${PORT}
    📍 API: http://localhost:${PORT}/api/analyze
    ────────────────────────────
    `);
});