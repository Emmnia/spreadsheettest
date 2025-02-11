import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

async function bufferToStream(buffer: Buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const message = formData.get('message') as string;
        const photo = formData.get('photo') as File;

        const submissionId = `SUBM_${Date.now()}_${uuidv4()}`;

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/spreadsheets',
            ],
        });

        // Инициализируем Google Drive API
        const drive = google.drive({ version: 'v3', auth });

        // Загружаем фото на Google Drive
        let photoUrl = '';
        if (photo) {
            const photoBuffer = Buffer.from(await photo.arrayBuffer());
            const photoStream = await bufferToStream(photoBuffer);

            const driveResponse = await drive.files.create({
                requestBody: {
                    name: `${submissionId}_${photo.name}`,
                    mimeType: photo.type,
                    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
                },
                media: {
                    mimeType: photo.type,
                    body: photoStream,
                },
                fields: 'id, webContentLink',
            });

            if (driveResponse.data.id) {
                await drive.permissions.create({
                    fileId: driveResponse.data.id,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone',
                    },
                });

                photoUrl = `https://drive.google.com/file/d/${driveResponse.data.id}/view?usp=sharing`;
            } else {
                console.error('Failed to get file ID from Google Drive response');
            }
        }

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A1:D1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    submissionId,
                    name,
                    message,
                    photoUrl
                ]],
            },
        });

        return NextResponse.json({
            message: 'Success',
            data: response.data
        });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
}