"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserTopicService } from "@/services/UserTopicService";
import { UserPostService } from "@/services/UserPostService";

export default function HomeFooter() {
  const [topics, setTopics] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Gọi API lấy Topics và Posts song song
        const [topicsData, postsRes] = await Promise.all([
          UserTopicService.getAll(),
          UserPostService.getByTopic(), // Không truyền slug để lấy bài mới nhất toàn bộ
        ]);

        setTopics(topicsData || []);

        // Dựa trên service bạn gửi: response trả về { data: { data: [...] } }
        if (postsRes && postsRes.data && Array.isArray(postsRes.data.data)) {
          setLatestPosts(postsRes.data.data.slice(0, 2));
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu footer:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper xử lý URL ảnh giống trang Detail bạn đã code
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/600x400?text=No+Image";
    return imagePath.startsWith("http")
      ? imagePath
      : `http://localhost:8000/storage/${imagePath}`;
  };

  return (
    <footer className="bg-white text-gray-800 py-16 border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4">
        {/* --- HIỂN THỊ 2 BÀI VIẾT MỚI NHẤT --- */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-xl font-bold uppercase mb-8 tracking-widest text-center text-gray-900">
            Bài viết mới nhất
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {latestPosts.length > 0
              ? latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.slug}`}
                    className="group block bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={getImageUrl(post.image)}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    </div>
                    {/* Title */}
                    <div className="p-5">
                      <h3 className="font-bold text-lg leading-tight text-gray-800 group-hover:text-blue-600 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-3 uppercase tracking-tighter">
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </Link>
                ))
              : !loading && (
                  <p className="col-span-2 text-center text-gray-400 italic">
                    Chưa có bài viết mới.
                  </p>
                )}
          </div>
        </div>

        {/* --- KHÁM PHÁ THEO CHỦ ĐỀ (TOPICS) --- */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold uppercase mb-8 tracking-widest text-gray-900">
            Khám Phá Blog
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            {topics.length > 0 ? (
              topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.slug}`}
                  className="bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 px-6 py-3 rounded-full transition-all duration-300 font-medium shadow-sm border border-gray-200"
                >
                  {topic.name}
                </Link>
              ))
            ) : (
              <p className="text-gray-500 italic">Đang cập nhật chủ đề...</p>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-400">
            &copy; {new Date().getFullYear()} My Store. Designed for content
            lovers.
          </div>
        </div>
      </div>
    </footer>
  );
}
