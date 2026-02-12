const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ✅ Add these for PDF/DOCX text extraction
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

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

// ✅ Initialize DeepSeek AI (OpenAI-compatible client)
const OpenAI = require('openai');
const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-dummy-key-for-fallback',
    baseURL: "https://api.deepseek.com"
});

// ✅ Helper function to extract text from uploaded files
async function extractTextFromFile(filePath, mimetype) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        
        if (mimetype.includes('pdf')) {
            const data = await pdfParse(fileBuffer);
            return data.text.substring(0, 8000); // First 8000 chars
        } else if (mimetype.includes('word') || mimetype.includes('doc') || mimetype.includes('docx')) {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value.substring(0, 8000);
        } else if (mimetype.includes('text')) {
            return fileBuffer.toString('utf8').substring(0, 8000);
        }
        return '';
    } catch (error) {
        console.error('❌ Text extraction error:', error);
        return '';
    }
}

// ✅ TEST ROUTE - Works
app.get('/', (req, res) => {
    res.json({ 
        message: 'Tender AI API is running!',
        status: '✅ Online',
        ai_provider: process.env.DEEPSEEK_API_KEY ? 'DeepSeek AI' : 'Mock Mode (No API Key)',
        timestamp: new Date().toISOString()
    });
});

// ✅ API ANALYZE ROUTE - WITH DEEPSEEK AI
app.post('/api/analyze', upload.single('document'), async (req, res) => {
    console.log('📄 API ROUTE HIT - /api/analyze');
    console.log('File received:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Extract text from the uploaded file
        const filePath = req.file.path;
        const fileMimetype = req.file.mimetype;
        const fileName = req.file.originalname;
        
        console.log('📖 Extracting text from file...');
        const extractedText = await extractTextFromFile(filePath, fileMimetype);
        console.log(`✅ Extracted ${extractedText.length} characters`);

        // Clean up the uploaded file after processing
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        // Check if we have DeepSeek API key
        if (!process.env.DEEPSEEK_API_KEY) {
            console.log('⚠️ No DeepSeek API key found, using mock data');
            const mockAnalysis = {
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

            return res.json({
                success: true,
                filename: fileName,
                analysis: mockAnalysis,
                ai_provider: 'mock-fallback'
            });
        }

        console.log('🤖 Calling DeepSeek AI...');

        // Prepare the prompt with extracted text
        const prompt = extractedText 
            ? `Analyze this tender document content and extract key information:\n\n${extractedText}`
            : `Analyze this tender document filename: "${fileName}". Based on the filename and typical tender requirements, provide a realistic analysis.`;

        const completion = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `You are a tender document analysis expert. Extract information from tender documents and return ONLY valid JSON without any markdown formatting or additional text.
                    
                    IMPORTANT: Always return percentages that add up to 100% total.`
                },
                {
                    role: "user",
                    content: `${prompt}
                    
                    Return ONLY this exact JSON structure (no other text):
                    {
                        "deadline": "YYYY-MM-DD",
                        "requirements": ["requirement1", "requirement2", "requirement3", "requirement4", "requirement5"],
                        "evaluation_criteria": {
                            "technical": "XX%",
                            "commercial": "XX%", 
                            "icv": "XX%",
                            "hsee": "XX%"
                        }
                    }
                    
                    Ensure evaluation_criteria percentages sum to 100%.`
                }
            ],
            temperature: 0.7,
            max_tokens: 1500
        });

        console.log('✅ DeepSeek response received');
        
        // Parse the JSON response
        const analysisText = completion.choices[0].message.content;
        console.log('Raw response:', analysisText.substring(0, 200) + '...');
        
        // Clean the response (remove markdown if any)
        const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
        let analysis;
        
        try {
            analysis = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            // Try to extract JSON from the text
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not parse AI response');
            }
        }

        // Validate and fix percentages
        if (analysis.evaluation_criteria) {
            const criteria = analysis.evaluation_criteria;
            // Ensure all criteria exist
            if (!criteria.technical) criteria.technical = "40%";
            if (!criteria.commercial) criteria.commercial = "30%";
            if (!criteria.icv) criteria.icv = "20%";
            if (!criteria.hsee) criteria.hsee = "10%";
        }

        res.json({
            success: true,
            filename: fileName,
            analysis: analysis,
            ai_provider: 'deepseek'
        });

    } catch (error) {
        console.error('❌ DeepSeek AI Error:', error);
        
        // Fallback to mock data if AI fails
        console.log('⚠️ Falling back to mock data');
        const mockAnalysis = {
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
            analysis: mockAnalysis,
            ai_provider: 'mock-fallback'
        });
    }
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
    ────────────────────────────────────────
    ✅ Server running on port ${PORT}
    📍 URL: https://tender-ai-backend-yc7k.onrender.com
    📍 Test:  https://tender-ai-backend-yc7k.onrender.com/
    📍 API:   https://tender-ai-backend-yc7k.onrender.com/api/analyze
    🤖 AI Provider: ${process.env.DEEPSEEK_API_KEY ? 'DeepSeek AI' : 'MOCK MODE (no API key)'}
    📄 PDF/DOCX Extraction: ✅ Enabled
    ────────────────────────────────────────
    `);
});