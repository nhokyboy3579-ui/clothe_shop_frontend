'use client';
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import Image from 'next/image';

// Import Component & Service
import Pagination from '@/components/Pagination'; 
import { fetchPosts, savePost, deletePost, fetchTopicsForPost } from '@/services/admin/PostService'; 

export default function AdminPosts() {
  // --- STATE ---
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]); // List chủ đề cho dropdown
  const [loading, setLoading] = useState(true);
  
  // State Search & Pagination
  const [searchTerm, setSearchTerm] = useState(''); 
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1); 
  const itemsPerPage = 10; 

  // State Modal & Form
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const initialForm = {
    title: '',
    slug: '',
    topic_id: '',
    description: '',
    content: '',
    type: 'post', // Mặc định là Tin tức
    status: '1', 
  };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // --- EFFECT: Debounce Search ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if(searchTerm !== '') setCurrentPage(1);
    }, 600); // Đợi 600ms sau khi ngừng gõ
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- EFFECT: Load Data ---
  const loadData = async () => {
    setLoading(true);
    try {
      // Gọi song song API lấy Post và API lấy Topic
      const [postsRes, topicsRes] = await Promise.all([
          fetchPosts({ page: currentPage, limit: itemsPerPage, search: debouncedSearchTerm }),
          fetchTopicsForPost() 
      ]);

      const data = postsRes.data || postsRes; 
      setPosts(data); 
      setLastPage(postsRes.last_page || 1);
      
      setTopics(topicsRes || []); // Set list chủ đề

    } catch (error) {
      toast.error('Lỗi tải dữ liệu.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { loadData(); }, [currentPage, debouncedSearchTerm]);

  // --- HANDLERS ---

  // Mở modal thêm mới
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      title: item.title,
      slug: item.slug,
      topic_id: item.topic_id || '', 
      description: item.description || '',
      content: item.content || '',
      type: item.type,
      status: String(item.status),
    });
    
    // Xử lý link ảnh
    const imgUrl = item.image 
        ? (item.image.startsWith('http') ? item.image : `http://localhost:8000/storage/${item.image}`) 
        : null;
    setImagePreview(imgUrl);
    setImageFile(null);
    
    setShowModal(true);
  };

  // Chọn ảnh từ máy tính
  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  // Submit Form (Thêm hoặc Sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Gom dữ liệu vào FormData
    const data = new FormData();
    data.append('title', formData.title);
    if(formData.slug) data.append('slug', formData.slug);
    if(formData.topic_id) data.append('topic_id', formData.topic_id);
    data.append('description', formData.description || '');
    data.append('content', formData.content);
    data.append('type', formData.type);
    data.append('status', formData.status);
    if (imageFile) data.append('image', imageFile);

    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm mới...');

    try {
      await savePost(data, isEditing ? editId : null);
      
      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm bài viết thành công!', { id: toastId });
      setShowModal(false);
      
      if (!isEditing) setCurrentPage(1);
      loadData(); 

    } catch (error) {
      // Lấy lỗi chi tiết từ Laravel trả về
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      const errors = error.response?.data?.errors;
      // Nếu có lỗi validate cụ thể, hiển thị cái đầu tiên
      const detailMsg = errors ? Object.values(errors).flat()[0] : msg;
      
      toast.error(detailMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa bài viết
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Bạn có chắc chắn muốn xóa bài viết này?",
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
          Swal.fire('Đã xóa!', 'Bài viết đã được xóa.', 'success');
          loadData(); 
        } catch (error) { 
          Swal.fire('Lỗi!', 'Không thể xóa bài viết này.', 'error');
        }
      }
    });
  };

  // --- RENDER ---
  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ style: { zIndex: 9999 } }} />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 uppercase">Quản lý Bài viết</h2>
        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow flex items-center gap-2">
          <span>+</span> Thêm Bài Viết
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-4 flex justify-between items-center">
          <input
              type="text" 
              placeholder="Tìm kiếm tiêu đề..."
              className="w-full sm:w-80 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="text-sm text-gray-600 font-medium">Tổng: {posts.length} bài</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-blue-500 min-h-[200px]">
        {loading ? (
           <div className="p-10 text-center flex flex-col items-center justify-center h-48 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
              Đang tải dữ liệu...
           </div>
        ) : posts.length === 0 ? (
            <div className="p-10 text-center text-gray-500 italic">Chưa có bài viết nào.</div>
        ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Hình ảnh</th>
                  <th className="p-4">Tiêu đề / Chủ đề</th>
                  <th className="p-4 text-center">Loại</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {posts.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono">{item.id}</td>
                        <td className="p-4">
                            <div className="relative w-16 h-10 border rounded overflow-hidden bg-gray-100 shadow-sm">
                                {item.image ? (
                                    <Image 
                                        src={item.image.startsWith('http') ? item.image : `http://localhost:8000/storage/${item.image}`} 
                                        alt="img" fill className="object-cover" unoptimized 
                                    />
                                ) : <span className="flex items-center justify-center h-full text-xs text-gray-400">No Img</span>}
                            </div>
                        </td>
                        <td className="p-4 max-w-xs">
                            <p className="font-bold text-gray-800 truncate" title={item.title}>{item.title}</p>
                            <p className="text-xs text-blue-600 font-medium mt-1">
                                {item.topic ? `📂 ${item.topic.name}` : '--- Không chủ đề ---'}
                            </p>
                        </td>
                        <td className="p-4 text-center">
                            {item.type === 'post' 
                                ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">Post</span>
                                : <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-200">Page</span>
                            }
                        </td>
                        <td className="p-4 text-center">
                             {item.status == 1 
                                ? <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">Active</span>
                                : <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded">Hidden</span>
                             }
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
      
      {/* Pagination */}
      {lastPage > 1 && (
          <Pagination currentPage={currentPage} totalPages={lastPage} onPageChange={setCurrentPage} />
      )}

      {/* --- MODAL FORM --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">{isEditing ? 'Cập nhật bài viết' : 'Thêm bài viết mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-300 transition">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CỘT TRÁI */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Tiêu đề bài viết (*)</label>
                            <input type="text" className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none transition-shadow" required 
                                value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Nhập tiêu đề..." />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Slug (URL)</label>
                            <input type="text" className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none transition-shadow" 
                                value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="tu-dong-tao-neu-trong" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Chủ đề (Topic)</label>
                            <select className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none bg-white"
                                value={formData.topic_id} onChange={(e) => setFormData({...formData, topic_id: e.target.value})}
                            >
                                <option value="">-- Chọn chủ đề --</option>
                                {topics.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">Loại</label>
                                <select className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none bg-white"
                                    value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="post">Tin tức (Post)</option>
                                    <option value="page">Trang đơn (Page)</option>
                                </select>
                            </div>
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
                    </div>

                    {/* CỘT PHẢI (Ảnh & Mô tả ngắn) */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Hình ảnh</label>
                            <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer relative overflow-hidden group"
                                onClick={() => document.getElementById('postImg').click()}
                            >
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="preview" fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="text-gray-400 text-sm flex flex-col items-center">
                                        <span className="text-2xl mb-1">📷</span>
                                        Nhấn để chọn ảnh
                                    </div>
                                )}
                                <input type="file" id="postImg" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Mô tả ngắn</label>
                            <textarea rows="4" className="w-full border p-2.5 rounded focus:ring-2 ring-blue-500 outline-none transition-shadow"
                                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Tóm tắt nội dung..." />
                        </div>
                    </div>
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