'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header'; // Header chung của bạn
import { UserPostService } from '@/services/UserPostService';

export default function TopicPage() {
    const { slug } = useParams(); // Lấy slug từ URL
    const [posts, setPosts] = useState([]);
    const [topicInfo, setTopicInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const res = await UserPostService.getByTopic(slug);
            if (res && res.status) {
                setPosts(res.data.data); // res.data.data vì Laravel trả về object pagination
                setTopicInfo(res.topic);
            }
            setLoading(false);
        };
        if(slug) fetchData();
    }, [slug]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Header />
            
            <div className="container mx-auto px-4 py-12">
                {/* Breadcrumb & Title */}
                <div className="mb-10 text-center">
                    <p className="text-sm text-gray-500 mb-2">
                        <Link href="/" className="hover:underline">Trang chủ</Link> / <span>Blog</span>
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                        {loading ? 'Đang tải...' : (topicInfo ? topicInfo.name : 'Danh sách bài viết')}
                    </h1>
                    <div className="w-20 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                        <p className="text-xl text-gray-500">Chưa có bài viết nào thuộc chủ đề này.</p>
                        <Link href="/" className="text-blue-600 mt-4 inline-block hover:underline">Quay về trang chủ</Link>
                    </div>
                ) : (
                    /* Post Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => {
                            // Xử lý URL ảnh
                            const imgUrl = post.image 
                                ? (post.image.startsWith('http') ? post.image : `http://localhost:8000/storage/${post.image}`)
                                : 'https://placehold.co/600x400?text=No+Image';

                            return (
                                <article key={post.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full group">
                                    {/* Ảnh thumbnail */}
                                    <Link href={`/posts/${post.slug}`} className="relative h-56 w-full overflow-hidden">
                                        <Image 
                                            src={imgUrl} 
                                            alt={post.title} 
                                            fill 
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            unoptimized
                                        />
                                        {/* Badge Topic */}
                                        <span className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                            {post.topic?.name || 'Tin tức'}
                                        </span>
                                    </Link>

                                    {/* Nội dung tóm tắt */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="text-sm text-gray-400 mb-2">
                                            {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            <Link href={`/posts/${post.slug}`}>
                                                {post.title}
                                            </Link>
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                                            {post.description || 'Không có mô tả ngắn...'}
                                        </p>
                                        
                                        <Link 
                                            href={`/posts/${post.slug}`} 
                                            className="inline-flex items-center text-blue-600 font-semibold hover:underline mt-auto"
                                        >
                                            Đọc tiếp <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}