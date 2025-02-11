import { google } from 'googleapis';

export default async function handler(req, res) {
    const { id } = req.query;

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        const response = await drive.files.get(
            { fileId: id, alt: 'media' },
            { responseType: 'stream' }
        );

        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).json({ error: 'Failed to fetch image' });
    }
}