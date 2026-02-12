const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// 🛡️ Check if API key exists
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY is not set in .env file');
    console.error('📝 Please create a .env file with: OPENAI_API_KEY=your_key_here');
    console.error('📍 File should be at: ' + path.join(__dirname, '.env'));
    process.exit(1);
}

// ✅ Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 📁 Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

// Middleware
// More permissive CORS for development
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// 🏠 Test route
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Tender AI API is running!',
        status: 'API Key: ✅ Loaded',
        timestamp: new Date().toISOString()
    });
});

// 📄 Upload and analyze tender document
app.post('/api/analyze', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`📄 Processing: ${req.file.originalname}`);

        // For MVP, we'll simulate with sample data
        // In production, you'd extract text from PDF/DOCX
        const sampleAnalysis = {
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
            },
            warnings: [
                "⚠️ Bid bond required - not included",
                "⚠️ Deadline is in 5 days"
            ]
        };

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        res.json({
            success: true,
            filename: req.file.originalname,
            analysis: sampleAnalysis,
            checklist: generateChecklist(sampleAnalysis)
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            error: 'Analysis failed',
            details: error.message 
        });
    }
});

function generateChecklist(analysis) {
    return [
        { id: 1, item: "📄 Cover letter", completed: false },
        { id: 2, item: "🏢 Company profile", completed: false },
        { id: 3, item: "💰 Financial statements (3 years)", completed: false },
        { id: 4, item: "📋 Experience certificates", completed: false },
        { id: 5, item: "🔐 Bank guarantee", completed: false },
        { id: 6, item: `📅 Submit before: ${analysis.deadline}`, completed: false }
    ];
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    🚀 ────────────────────────────
         TENDER AI API SERVER
    ────────────────────────────
    ✅ Server: http://localhost:${PORT}
    🔑 API Key: ${process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing'}
    📁 Uploads: ${uploadDir}
    ────────────────────────────
    `);
});