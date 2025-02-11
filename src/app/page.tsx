'use client';

import { useEffect, useState } from 'react';
import { Form } from "@/app/components/Form";
import Image from 'next/image';

type Review = {
    id: string;
    name: string;
    message: string;
    photo: string;
};

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNextOrPrevious = (next: boolean) => {
        if (reviews.length === 0) return;

        setActiveIndex((prevIndex) => {
            const itemCount = reviews.length;
            if (next) {
                return (prevIndex + 1) % itemCount;
            } else {
                return (prevIndex - 1 + itemCount) % itemCount;
            }
        });
    };

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/reviews');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setReviews(data.reviews || []);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div>Loading...</div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center">
                <div>No reviews yet</div>
                <Form />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="h-[500px] relative mb-8">
                {reviews.map((review, i) => (
                    <div
                        key={review.id}
                        className={`absolute h-full w-full top-0 left-0 transition-opacity duration-500 ease-in-out 
                            ${activeIndex === i ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-2">{review.name}</h3>
                            <p className="mb-4">{review.message}</p>
                            {review.photo && (
                                <div className="relative w-full h-64">
                                    <Image
                                        src={review.photo}
                                        alt={`Review by ${review.name}`}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className="rounded-lg"
                                        unoptimized // добавьте это свойство, если используете внешние URL
                                        priority
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div className="absolute flex justify-center gap-4 z-20 w-full bottom-4">
                    <button
                        type="button"
                        onClick={() => handleNextOrPrevious(false)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => handleNextOrPrevious(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
            <Form />
        </div>
    );
}