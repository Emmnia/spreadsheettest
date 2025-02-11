import { google } from 'googleapis';
import { Readable } from 'stream';

// Функция для конвертации Buffer в Readable Stream
async function bufferToStream(buffer: Buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

export async function POST(request: Request) {
    try {
        // Получаем данные формы
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const message = formData.get('message') as string;
        const photo = formData.get('photo') as File;

        // Настраиваем аутентификацию
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
                    name: `${name}_${Date.now()}_${photo.name}`, // имя файла
                    mimeType: photo.type,
                    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!], // ID папки в Google Drive
                },
                media: {
                    mimeType: photo.type,
                    body: photoStream,
                },
                fields: 'id, webViewLink',
            });

            photoUrl = driveResponse.data.webViewLink || '';
        }

        // Инициализируем Google Sheets API
        const sheets = google.sheets({ version: 'v4', auth });

        // Записываем данные в таблицу
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A1:E1', // Добавили еще один столбец для ссылки на фото
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    name,
                    email,
                    `'${phone}`,
                    message,
                    photoUrl // Ссылка на фото в Google Drive
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