// app.js
const { initModels } = require('./src/models/index');
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware to log incoming routes (must be before routes)
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Static files middleware
app.use(express.static('public'));

// API Routes
const routes = require('./src/routes/index');
app.use('/api', routes);

// Global error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        suggestion: 'Visit /api for available endpoints'
    });
});

// Start the server only if not required by another module (like tests)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, async () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        
        try {
            await initModels();
            console.log('Transportation Request Management API is ready!');
            console.log(`API Documentation: http://localhost:${PORT}/api`);
        } catch (error) {
            console.error('Failed to initialize models:', error);
            process.exit(1);
        }
    });
}

// Export app for testing
module.exports = app;
