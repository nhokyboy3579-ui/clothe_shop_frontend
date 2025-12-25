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

    if (!post) return <div className="min-h-screen flex items-center justify-center">Bài viết không tồn tại.</div>;

    const imgUrl = post.image 
        ? (post.image.startsWith('http') ? post.image : `http://localhost:8000/storage/${post.image}`)
        : null;

    return (
        <div className="bg-white min-h-screen text-gray-800 pb-20">
            <Header />

            <div className="container mx-auto px-4 pt-10 pb-6 max-w-4xl">
                {/* Breadcrumb */}
                <nav className="flex items-center text-sm text-gray-500 mb-6">
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
                    <span className="truncate text-gray-800">Chi tiết</span>
                </nav>

                {/* TIÊU ĐỀ: Đã xóa font-serif để dùng font Be Vietnam Pro */}
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                    {post.title}
                </h1>

                <div className="flex items-center text-sm text-gray-500 mb-8 border-b pb-4">
                    <span className="mr-4">Đăng ngày: {new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                    {post.author && <span>Bởi: <span className="font-bold text-gray-700">{post.author.name}</span></span>}
                </div>

                {imgUrl && (
                    <div className="relative w-full h-[300px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg mb-10">
                        <Image src={imgUrl} alt={post.title} fill className="object-cover" unoptimized />
                    </div>
                )}
            </div>

            <article className="container mx-auto px-4 max-w-3xl">
                {/* Mô tả ngắn: Xóa font-serif/italic để dễ đọc hơn */}
                {post.description && (
                    <div className="text-xl md:text-2xl font-medium text-gray-700 mb-10 border-l-4 border-blue-600 pl-6 py-2 leading-relaxed bg-blue-50/50 rounded-r-lg">
                        {post.description}
                    </div>
                )}

                {/* Nội dung chi tiết */}
                <div 
                    className="
                        prose prose-lg prose-slate max-w-none 
                        prose-headings:font-bold prose-headings:text-gray-900
                        prose-p:leading-8 prose-p:text-gray-800
                        prose-a:text-blue-600 hover:prose-a:underline
                        prose-img:rounded-xl prose-img:shadow-md
                        prose-strong:text-gray-900
                    "
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center">
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