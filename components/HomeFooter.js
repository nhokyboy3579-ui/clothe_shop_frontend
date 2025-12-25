'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserTopicService } from '@/services/UserTopicService';

export default function HomeFooter() {
    const [topics, setTopics] = useState([]);

    useEffect(() => {
        const fetchTopics = async () => {
            const data = await UserTopicService.getAll();
            setTopics(data);
        };
        fetchTopics();
    }, []);

    return (
        <footer className="bg-white text-gray-800 py-16 border-t border-gray-200 mt-20">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl md:text-3xl font-bold uppercase mb-8 tracking-widest text-gray-900">
                    Khám Phá Blog & Tin Tức
                </h2>
                
                <div className="flex flex-wrap justify-center gap-4">
                    {topics.length > 0 ? (
                        topics.map((topic) => (
                            <Link 
                                key={topic.id} 
                                href={`/topics/${topic.slug}`} 
                                // Cập nhật style nút bấm cho nền trắng:
                                // Nền xám nhạt (bg-gray-100) thay vì xám đậm
                                // Chữ xám đậm (text-gray-700) thay vì trắng mờ
                                className="bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 px-6 py-3 rounded-full transition-all duration-300 font-medium shadow-sm border border-gray-200 hover:border-blue-500 hover:-translate-y-1"
                            >
                                {topic.name}
                            </Link>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">Đang cập nhật chủ đề...</p>
                    )}
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} My Store. Designed for content lovers.
                </div>
            </div>
        </footer>
    );
}