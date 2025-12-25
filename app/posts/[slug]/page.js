'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header'; 
import { UserPostService } from '@/services/UserPostService';

export default function PostDetailPage() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            const data = await UserPostService.getDetail(slug);
            setPost(data);
            setLoading(false);
        };
        if(slug) fetchDetail();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!post) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-600">
            <h1 className="text-2xl font-bold mb-2">Bài viết không tồn tại</h1>
            <Link href="/" className="text-blue-600 hover:underline">Về trang chủ</Link>
        </div>
    );

    const imgUrl = post.image 
        ? (post.image.startsWith('http') ? post.image : `http://localhost:8000/storage/${post.image}`)
        : null;

    return (
        <div className="bg-white min-h-screen font-serif text-gray-800 pb-20">
            <Header />

            {/* Hero Section (Tiêu đề + Ảnh) */}
            <div className="container mx-auto px-4 pt-10 pb-6 max-w-4xl">
                <nav className="flex items-center text-sm text-gray-500 mb-6 font-sans">
                    <Link href="/" className="hover:text-black">Trang chủ</Link>
                    <span className="mx-2">/</span>
                    {post.topic && (
                        <>
                            <Link href={`/topics/${post.topic.slug}`} className="hover:text-black font-medium text-blue-600">
                                {post.topic.name}
                            </Link>
                            <span className="mx-2">/</span>
                        </>
                    )}
                    <span className="truncate text-gray-800">Chi tiết bài viết</span>
                </nav>

                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4 font-sans">
                    {post.title}
                </h1>

                <div className="flex items-center text-sm text-gray-500 mb-8 font-sans border-b pb-4">
                    <span className="mr-4">Đăng ngày: {new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                    {post.author && <span>Bởi: <span className="font-bold text-gray-700">{post.author.name}</span></span>}
                </div>

                {imgUrl && (
                    <div className="relative w-full h-[300px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg mb-10">
                        <Image src={imgUrl} alt={post.title} fill className="object-cover" unoptimized />
                    </div>
                )}
            </div>

            {/* Nội dung bài viết */}
            <article className="container mx-auto px-4 max-w-3xl">
                {/* Mô tả ngắn (Sapo) */}
                {post.description && (
                    <div className="text-lg md:text-xl font-medium text-gray-700 italic mb-8 border-l-4 border-blue-600 pl-4 bg-blue-50 py-4 rounded-r-lg font-sans">
                        {post.description}
                    </div>
                )}

                {/* Nội dung chi tiết (HTML Content) */}
                <div 
                    className="prose prose-lg prose-slate max-w-none prose-img:rounded-xl prose-a:text-blue-600 hover:prose-a:underline font-sans"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Footer bài viết */}
                <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center font-sans">
                    <Link 
                        href={post.topic ? `/topics/${post.topic.slug}` : '/'}
                        className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-bold transition-colors"
                    >
                        &larr; Xem các bài viết khác
                    </Link>
                </div>
            </article>
        </div>
    );
}