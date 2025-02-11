import { NextResponse } from 'next/server';
import { google } from 'googleapis';

type Review = {
    id: string;
    name: string;
    message: string;
    photo: string;
};

export async function GET() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A:D', // Assuming columns are: id, name, message, photo
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ reviews: [] });
        }

        // Skip header row if it exists and transform data
        const reviews: Review[] = rows
            .slice(1) // Skip header row
            .map((row) => ({
                id: row[0]?.toString() || '',
                name: row[1]?.toString() || '',
                message: row[2]?.toString() || '',
                photo: row[3]?.toString() || '',
            }))
            .filter(review => review.id && review.name); // Only include reviews with at least an id and name

        return NextResponse.json({ reviews });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
}