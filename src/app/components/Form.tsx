'use client'

import {NextPage} from "next";
import {FormEvent, useState} from "react";

export const Form: NextPage = () => {

    const [formData, setFormData] = useState({
        name: "",
        message: ""
    });
    const [photo, setPhoto] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
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

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
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

            setFormData({
                name: '',
                message: ''
            });
            setPhoto(null);

        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <main className="min-h-screen bg-gray-100">
            <div className="max-w-5xl mx-auto py-16">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-8 space-y-4 rounded-lg shadow-md">
                    <div className="flex items-center justify-center">
                        <label htmlFor="name" className="sr-only">Name</label>
                        <input
                            value={formData.name}
                            onChange={handleChange}
                            type="text" id="name" name="name" placeholder="Name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div className="flex items-center justify-center">
                        <label htmlFor="message" className="sr-only">Message</label>
                        <textarea
                            value={formData.message}
                            onChange={handleChange}
                            id="message" name="message" placeholder="Message"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div className="flex items-center justify-center">
                        <label htmlFor="photo" className="sr-only">Photo</label>
                        <input
                            onChange={handlePhotoChange}
                            type="file" id="photo" name="photo" accept="image/*"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div className="flex items-center justify-center">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">Submit
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
