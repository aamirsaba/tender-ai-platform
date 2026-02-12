const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// ✅ CORS - Allow all origins for testing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ TEST ROUTE - Works
app.get('/', (req, res) => {
    res.json({ 
        message: 'Tender AI API is running!',
        status: '✅ Online',
        timestamp: new Date().toISOString()
    });
});

// ✅ API ANALYZE ROUTE - CRITICAL FIX
app.post('/api/analyze', upload.single('document'), (req, res) => {
    console.log('📄 API ROUTE HIT - /api/analyze');
    console.log('File received:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

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
        filename: req.file.originalname,
        analysis: analysis
    });
});

// ✅ TEST POST ROUTE - To verify POST works
app.post('/api/test', (req, res) => {
    res.json({ message: 'POST route works!' });
});

// ✅ 404 handler
app.use((req, res) => {
    console.log('❌ 404 - Route not found:', req.method, req.url);
    res.status(404).json({ 
        error: 'Route not found',
        method: req.method,
        path: req.url
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ────────────────────────────
    ✅ Server running on port ${PORT}
    📍 URL: https://tender-ai-backend-yc7k.onrender.com
    📍 Test:  https://tender-ai-backend-yc7k.onrender.com/
    📍 API:   https://tender-ai-backend-yc7k.onrender.com/api/analyze
    ────────────────────────────
    `);
});