const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: process.env.ACCESS_TOKEN
    },
});

// GET route to fetch form data
router.get('/formdata', async (req, res) => {
    try {
        res.status(404).json({ message: 'No form data found' });
    } catch (error) {
        console.error('Error fetching form data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST route to handle form submission
const handleUpload = (req, res) => {
    return new Promise((resolve, reject) => {
        const upload = req.app.locals.upload;
        upload.single('audio')(req, res, (err) => {
            if (err) {
                reject({
                    status: 400,
                    message: err.message,
                    headers: req.headers
                });
            }
            resolve();
        });
    });
};

router.post('/submit-audio', async (req, res) => {
    try {
        await handleUpload(req, res);

        try {
            console.log('Headers:', req.headers);
            console.log('Raw request body:', req.body);
            
            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    message: 'No audio file uploaded',
                    headers: req.headers
                });
            }

            const formData = {
                email: req.body.email || 'No email provided',
                isAgreed: req.body.isAgreed === 'true', // Convert string to boolean
                audio: req.file // Contains the uploaded file details
            };
            
            if (!formData.email) {
                return res.status(400).json({ 
                    message: 'Missing email field',
                    receivedData: formData,
                    headers: req.headers
                });
            }
            
            console.log('Processed form data:', formData);

            // Prepare email content
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: formData.email,
                subject: 'Audio Submission Confirmation',
                html: `
                    <h2>Thank you for your audio submission</h2>
                    <p>We have received your audio file submission. Here are the details:</p>
                    <p><strong>Email:</strong> ${formData.email}</p>
                    <p><strong>Agreement Status:</strong> ${formData.isAgreed ? 'Agreed' : 'Not Agreed'}</p>
                    <p><strong>File Details:</strong></p>
                    <ul>
                        <li>Filename: ${req.file.originalname}</li>
                        <li>Size: ${(req.file.size / 1024).toFixed(2)} KB</li>
                        <li>Type: ${req.file.mimetype}</li>
                    </ul>
                    <p>Your audio file is attached to this email.</p>
                `,
                attachments: [{
                    filename: req.file.originalname,
                    path: req.file.path
                }]
            };

            // Send email
            await transporter.sendMail(mailOptions);

            res.status(201).json({ 
                message: 'Form submitted successfully and email sent',
                formData
            });

        } catch (error) {
            console.error('Error processing form submission:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error handling upload:', error);
        res.status(error.status || 500).json({ 
            message: error.message || 'Internal server error',
            headers: error.headers
        });
    }
});

router.post('/submit-form', async (req, res) => {
    try {
        const formData = {
            cancerType: req.body.cancerType,
            condition: req.body.condition,
            reason: req.body.reason,
            fullName: req.body.fullName,
            phone: req.body.phone,
            email: req.body.email,
            formName: req.body.formName
        };

        console.log(formData);

        // Prepare email content with all form fields
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.body.email, // Use env variable or default
            subject: 'Form Response',
            html: `
                <h2>${formData.formName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Form Submission Details</h2>
                <p>${req.body.cancerType}</p>
                <p>${req.body.condition}</p>
                <p>${req.body.reason}</p>
                <p><strong>Full Name:</strong> ${req.body.fullName}</p>
                <p><strong>Phone:</strong> ${req.body.phone}</p>
                <p><strong>Email:</strong> ${req.body.email}</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: 'Form submitted successfully and email sent',
            formData
        });

    } catch (error) {
        console.error('Error processing form submission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
