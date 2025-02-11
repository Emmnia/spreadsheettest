"use client";

import { FormEvent, useState } from 'react';

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [photo, setPhoto] = useState<File | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('message', formData.message);
            if (photo) {
                submitData.append('photo', photo);
            }

            const response = await fetch('/api/submit', {
                method: 'POST',
                body: submitData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Success:', data);

            // Очищаем форму
            setFormData({
                name: '',
                email: '',
                phone: '',
                message: ''
            });
            setPhoto(null);

        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                required
            />
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
            />
            <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                required
            />
            <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Message"
                required
            />
            <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
            />
            <button type="submit">Submit</button>
        </form>
    );
}


// Не забудьте:
//
//     Создать папку в Google Drive и получить её ID
// Добавить ID папки в переменные окружения (GOOGLE_DRIVE_FOLDER_ID)
// Убедиться, что у сервисного аккаунта есть права на запись в эту папку
// Настроить права доступа к файлам в Google Drive (если нужно, чтобы они были доступны по ссылке)
// Также можно добавить дополнительные проверки на размер и тип файла, если это необходимо.










Есть несколько способов связать фото с контактными данными:

    1. Использовать уникальный идентификатор для каждой записи:

    ```typescript
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        
        // Создаем уникальный ID для записи
        const submissionId = `SUBM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Загружаем фото с именем файла, содержащим ID записи
        const photo = formData.get('photo') as File;
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
                fields: 'id, webViewLink',
            });

            photoUrl = driveResponse.data.webViewLink || '';
        }

        // Записываем в таблицу вместе с ID
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A1:F1', // Добавляем столбец для ID
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    submissionId, // ID записи
                    formData.get('name'),
                    formData.get('email'),
                    `'${formData.get('phone')}`,
formData.get('message'),
    photoUrl
]],
},
});

return NextResponse.json({
    message: 'Success',
    submissionId,
    data: response.data
});

} catch (error) {
    // обработка ошибок
}
}
```

2. Создать отдельную папку для каждой заявки:

```typescript
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const submissionId = `SUBM_${Date.now()}`;

        // Создаем папку для этой заявки
        const folderResponse = await drive.files.create({
            requestBody: {
                name: submissionId,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
            },
            fields: 'id',
        });

        const submissionFolderId = folderResponse.data.id;

        // Загружаем фото в папку заявки
        const photo = formData.get('photo') as File;
        if (photo) {
            const photoBuffer = Buffer.from(await photo.arrayBuffer());
            const photoStream = await bufferToStream(photoBuffer);

            const driveResponse = await drive.files.create({
                requestBody: {
                    name: photo.name,
                    mimeType: photo.type,
                    parents: [submissionFolderId], // Используем ID папки заявки
                },
                media: {
                    mimeType: photo.type,
                    body: photoStream,
                },
                fields: 'id, webViewLink',
            });

            photoUrl = driveResponse.data.webViewLink || '';
        }

        // Записываем в таблицу
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A1:G1', // Добавляем столбец для ID папки
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    submissionId,
                    formData.get('name'),
                    formData.get('email'),
                    `'${formData.get('phone')}`,
                    formData.get('message'),
                    photoUrl,
                    `https://drive.google.com/drive/folders/${submissionFolderId}` // Ссылка на папку
                ]],
            },
        });

        return NextResponse.json({
            message: 'Success',
            submissionId,
            folderId: submissionFolderId,
            data: response.data
        });

    } catch (error) {
        // обработка ошибок
    }
}
```

3. Использовать временную метку и имя пользователя в имени файла:

```typescript
const fileName = `${formData.get('name')}_${new Date().toISOString()}_${photo.name}`;
```

4. Добавить метаданные к файлу в Google Drive:

```typescript
const driveResponse = await drive.files.create({
    requestBody: {
        name: photo.name,
        mimeType: photo.type,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
        properties: {  // Добавляем метаданные
            submissionId,
            userName: formData.get('name') as string,
            userEmail: formData.get('email') as string,
            submissionDate: new Date().toISOString()
        }
    },
    media: {
        mimeType: photo.type,
        body: photoStream,
    },
    fields: 'id, webViewLink, properties',
});
```

Рекомендую использовать комбинацию первого и второго способов: создавать уникальный ID для каждой заявки и отдельную папку в Google Drive. Это обеспечит:

1. Четкую связь между данными в таблице и файлами
2. Организованную структуру файлов
3. Возможность легко найти все файлы, относящиеся к конкретной заявке
4. Возможность управлять правами доступа на уровне папок

В таблице будут храниться:
- ID заявки
- Контактные данные
- Ссылка на фото
- Ссылка на папку с файлами заявки

Это сделает систему более организованной и удобной для администрирования.