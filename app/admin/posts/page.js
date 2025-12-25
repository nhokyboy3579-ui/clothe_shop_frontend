'use client';
import React, { useEffect, useState } from 'react';
// 1. IMPORT TOASTER & SWEETALERT
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import Pagination from '@/components/Pagination'; 
import { fetchPosts, savePost, deletePost } from '@/services/admin/PostService'; 
import Image from 'next/image';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState(''); 
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1); 
  const itemsPerPage = 10; 

  // Modal & Form
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    title: '',
    topic_id: '',
    image: '',
    content: '',
    description: '',
    post_type: 'post', // Mặc định là Tin tức
    status: '1', 
  };
  const [formData, setFormData] = useState(initialForm);

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if(searchTerm !== '') setCurrentPage(1);
    }, 600); 
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchPosts({ page: currentPage, limit: itemsPerPage, search: debouncedSearchTerm });
      const data = res.data || res;
      setPosts(data); 
      setLastPage(res.last_page || 1);
    } catch (error) {
      toast.error('Lỗi tải danh sách bài viết.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { loadData(); }, [currentPage, debouncedSearchTerm]);

  // Handlers
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      title: item.title,
      topic_id: item.topic_id || '',
      image: item.image || '',
      content: item.content || '',
      description: item.description || '',
      post_type: item.post_type,
      status: String(item.status),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Hiển thị loading toast
    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm mới...');

    try {
      await savePost(formData, isEditing ? editId : null);
      
      // Thông báo thành công
      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm bài viết thành công!', { id: toastId });
      
      setShowModal(false);
      if (!isEditing) setCurrentPage(1);
      loadData(); 
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- XỬ LÝ XÓA VỚI SWEETALERT2 ---
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Bạn muốn xóa bài viết này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deletePost(id); 
          
          Swal.fire(
            'Đã xóa!',
            'Bài viết đã được xóa thành công.',
            'success'
          );
          
          loadData(); 
        } catch (error) { 
          Swal.fire(
            'Lỗi!',
            'Không thể xóa bài viết này.',
            'error'
          );
        }
      }
    });
  };

  return (
    <div>
      {/* 2. CẤU HÌNH TOASTER */}
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
            style: {
              zIndex: 9999,
            },
        }}
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 uppercase">Quản lý Bài viết</h2>
        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow flex items-center gap-2">
          <span>+</span> Thêm Bài Viết
        </button>
      </div>
      
      {/* SEARCH */}
      <div className="mb-4">
          <input
              type="text" 
              placeholder="Tìm kiếm tiêu đề bài viết..."
              className="w-full sm:w-80 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-blue-500 min-h-[200px]">
        {loading ? (
           <div className="p-10 text-center flex flex-col items-center justify-center h-48 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
              Đang tải dữ liệu...
           </div>
        ) : posts.length === 0 ? (
            <div className="p-10 text-center text-gray-500 italic flex flex-col items-center">
                <span className="text-4xl mb-2">📝</span>
                <p>Chưa có bài viết nào.</p>
            </div>
        ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Hình ảnh</th>
                  <th className="p-4">Tiêu đề</th>
                  <th className="p-4 text-center">Loại</th>
                  <th className="p-4 text-center">Ngày tạo</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {posts.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono">{item.id}</td>
                        <td className="p-4">
                            <div className="relative w-12 h-12 border rounded overflow-hidden shadow-sm">
                                <Image src={item.image || 'https://placehold.co/100?text=NoImg'} alt="img" fill className="object-cover" unoptimized />
                            </div>
                        </td>
                        <td className="p-4 font-bold text-gray-800 max-w-xs truncate" title={item.title}>
                            {item.title}
                            <p className="text-xs text-gray-400 font-normal mt-1 truncate">{item.description}</p>
                        </td>
                        <td className="p-4 text-center">
                            {item.post_type === 'post' 
                                ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">Tin tức</span>
                                : <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-200">Trang đơn</span>
                            }
                        </td>
                        <td className="p-4 text-center text-gray-500 text-xs">
                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                            <button onClick={() => handleOpenEdit(item)} className="text-blue-600 font-bold mr-3 hover:bg-blue-50 p-2 rounded transition">Sửa</button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-600 font-bold hover:bg-red-50 p-2 rounded transition">Xóa</button>
                        </td>
                    </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>
      
      {/* PAGINATION */}
      {lastPage > 1 && (
          <Pagination currentPage={currentPage} totalPages={lastPage} onPageChange={setCurrentPage} />
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">{isEditing ? 'Cập nhật bài viết' : 'Thêm bài viết mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-300 transition">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Tiêu đề */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Tiêu đề bài viết (*)</label>
                  <input type="text" className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none transition-shadow" required 
                    value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Nhập tiêu đề..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Loại bài viết */}
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Loại bài viết</label>
                        <select className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none bg-white"
                            value={formData.post_type} onChange={(e) => setFormData({...formData, post_type: e.target.value})}
                        >
                            <option value="post">Tin tức (Post)</option>
                            <option value="page">Trang đơn (Page)</option>
                        </select>
                    </div>
                    {/* Trạng thái */}
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Trạng thái</label>
                        <select className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none bg-white"
                            value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                            <option value="1">Xuất bản</option>
                            <option value="0">Lưu nháp</option>
                        </select>
                    </div>
                </div>

                {/* Link Ảnh */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Link Ảnh đại diện</label>
                  <div className="flex gap-2">
                      <input type="text" className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none transition-shadow" placeholder="https://..."
                        value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} />
                      {formData.image && (
                          <div className="w-10 h-10 relative border rounded overflow-hidden flex-shrink-0">
                              <Image src={formData.image} alt="preview" fill className="object-cover" unoptimized />
                          </div>
                      )}
                  </div>
                </div>

                {/* Mô tả ngắn */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Mô tả ngắn</label>
                  <textarea rows="2" className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none transition-shadow"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Tóm tắt nội dung..." />
                </div>

                {/* Nội dung chi tiết */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Nội dung chi tiết (*)</label>
                  <textarea rows="8" className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none transition-shadow" required
                    value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="Viết nội dung bài viết ở đây..." />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg disabled:bg-gray-400 transition-all">
                    {isSubmitting ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}