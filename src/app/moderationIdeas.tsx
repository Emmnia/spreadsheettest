Да, это отличная идея! Вот как можно модифицировать код:

    ```typescript
// API route для отправки формы
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        
        const submissionId = `SUBM_${Date.now()}`;
        
        // Загрузка фото на Drive
        let photoUrl = '';
        const photo = formData.get('photo') as File;
        if (photo) {
            // ... код загрузки фото ...
        }

        // Записываем в таблицу с полем isApproved = FALSE
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A1:G1', // Добавляем столбец для статуса модерации
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    submissionId,
                    formData.get('name'),
                    formData.get('email'),
                    `'${formData.get('phone')}`,
formData.get('message'),
    photoUrl,
    'FALSE' // Статус модерации по умолчанию
]],
},
});

return NextResponse.json({
    message: 'Success',
    data: response.data
});

} catch (error) {
    // обработка ошибок
}
}
```

Затем создаем API route для получения одобренных отзывов:

```typescript
// app/api/reviews/route.ts
export async function GET(request: Request) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Получаем все строки
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A:G', // Все столбцы
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ reviews: [] });
        }

        // Фильтруем только одобренные отзывы
        const approvedReviews = rows.slice(1) // Пропускаем заголовки
            .filter(row => row[6] === 'TRUE') // Проверяем статус модерации
            .map(row => ({
                id: row[0],
                name: row[1],
                message: row[4],
                photo: row[5],
            }));

        return NextResponse.json({ reviews: approvedReviews });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
}
```

Компонент для отображения отзывов:

```typescript
// components/Reviews.tsx
'use client';

import { useEffect, useState } from 'react';

type Review = {
    id: string;
    name: string;
    message: string;
    photo: string;
};

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/reviews');
                const data = await response.json();
                setReviews(data.reviews);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="reviews-container">
            {reviews.map(review => (
                <div key={review.id} className="review">
                    <h3>{review.name}</h3>
                    <p>{review.message}</p>
                    {review.photo && (
                        <img
                            src={review.photo}
                            alt={`Review by ${review.name}`}
                            className="review-photo"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
```

Для автоматического обновления отзывов на сайте у вас есть несколько вариантов:

1. Использовать ISR (Incremental Static Regeneration):

```typescript
// app/reviews/page.tsx
export const revalidate = 86400; // Ревалидация раз в сутки (в секундах)

export default async function ReviewsPage() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
        next: { revalidate: 86400 }
    });
    const data = await response.json();

    return (
        <div>
            {/* Отображение отзывов */}
        </div>
    );
}
    ```

2. Создать cron-job, который будет запускать ребилд сайта раз в сутки:

```typescript
// pages/api/rebuild.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const response = await fetch(
            `https://api.vercel.com/v1/integrations/deploy/${process.env.VERCEL_DEPLOY_HOOK_ID}`,
            { method: 'POST' }
        );

        res.status(200).json({ message: 'Rebuild triggered' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger rebuild' });
    }
}
    ```

3. Использовать webhook в Google Sheets, который будет вызываться при изменении таблицы.

Для модерации в Google Sheets вы можете:
1. Создать выпадающий список в столбце модерации (TRUE/FALSE)
2. Использовать условное форматирование для визуального выделения одобренных/неодобренных отзывов
3. Создать отдельный лист для одобренных отзывов с помощью формул

Это даст вам удобный интерфейс для модерации и автоматическое обновление отзывов на сайте.