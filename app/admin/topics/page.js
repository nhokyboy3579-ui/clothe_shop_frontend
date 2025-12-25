'use client';
import React, { useEffect, useState } from 'react';
// Import thư viện thông báo
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import Pagination from '@/components/Pagination'; 
import { fetchTopics, saveTopic, deleteTopic } from '@/services/admin/TopicService'; 

export default function AdminTopics() {
  // State Data
  const [topics, setTopics] = useState([]);
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

  const initialForm = {
    name: '',
    slug: '',
    sort_order: 0,
    description: '',
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
      const res = await fetchTopics({ page: currentPage, limit: itemsPerPage, search: debouncedSearchTerm });
      // Xử lý response Laravel Paginate
      const data = res.data || res;
      setTopics(data); 
      setLastPage(res.last_page || 1);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu.');
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
      name: item.name,
      slug: item.slug,
      sort_order: item.sort_order || 0,
      description: item.description || '',
      status: String(item.status),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm mới...');

    try {
      await saveTopic(formData, isEditing ? editId : null);
      
      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm chủ đề thành công!', { id: toastId });
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

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Xóa chủ đề này có thể ảnh hưởng đến bài viết liên quan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTopic(id); 
          Swal.fire('Đã xóa!', 'Chủ đề đã được xóa.', 'success');
          loadData(); 
        } catch (error) { 
          Swal.fire('Lỗi!', 'Không thể xóa chủ đề này.', 'error');
        }
      }
    });
  };

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ style: { zIndex: 9999 } }} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 uppercase">Quản lý Chủ đề (Topics)</h2>
        <button onClick={handleOpenAdd} className="bg-purple-600 text-white px-4 py-2 rounded font-bold hover:bg-purple-700 shadow flex items-center gap-2">
          <span>+</span> Thêm Chủ Đề
        </button>
      </div>
      
      {/* SEARCH */}
      <div className="mb-4 flex justify-between items-center">
          <input
              type="text" 
              placeholder="Tìm kiếm chủ đề..."
              className="w-full sm:w-80 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="text-sm text-gray-600 font-medium">Tổng: {topics.length} chủ đề</div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-purple-500 min-h-[200px]">
        {loading ? (
           <div className="p-10 text-center flex flex-col items-center justify-center h-48 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
              Đang tải dữ liệu...
           </div>
        ) : topics.length === 0 ? (
            <div className="p-10 text-center text-gray-500 italic">Chưa có chủ đề nào.</div>
        ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Tên Chủ Đề</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4 text-center">Thứ tự</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {topics.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono">{item.id}</td>
                        <td className="p-4 font-bold text-gray-800">{item.name}</td>
                        <td className="p-4 text-gray-600 italic">{item.slug}</td>
                        <td className="p-4 text-center">{item.sort_order}</td>
                        <td className="p-4 text-center">
                             {item.status == 1 
                                ? <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded border border-green-200">Active</span>
                                : <span className="text-red-500 font-bold text-xs bg-red-100 px-2 py-1 rounded border border-red-200">Hidden</span>
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
      
      {/* PAGINATION */}
      {lastPage > 1 && (
          <Pagination currentPage={currentPage} totalPages={lastPage} onPageChange={setCurrentPage} />
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-purple-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">{isEditing ? 'Cập nhật chủ đề' : 'Thêm chủ đề mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-300 transition">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* Tên chủ đề */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Tên chủ đề (*)</label>
                  <input type="text" className="w-full border p-2.5 rounded focus:ring-2 ring-purple-500 outline-none transition-shadow" required 
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nhập tên chủ đề..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Slug (Tùy chọn)</label>
                        <input type="text" className="w-full border p-2.5 rounded focus:ring-2 ring-purple-500 outline-none transition-shadow" 
                            value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="tu-dong-tao" />
                    </div>
                    {/* Thứ tự */}
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Thứ tự</label>
                        <input type="number" className="w-full border p-2.5 rounded focus:ring-2 ring-purple-500 outline-none transition-shadow" 
                            value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: e.target.value})} />
                    </div>
                </div>

                {/* Trạng thái */}
                <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700">Trạng thái</label>
                    <select className="w-full border p-2.5 rounded focus:ring-2 ring-purple-500 outline-none bg-white"
                        value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                        <option value="1">Xuất bản (Active)</option>
                        <option value="0">Tạm ẩn (Hidden)</option>
                    </select>
                </div>

                {/* Mô tả */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Mô tả ngắn</label>
                  <textarea rows="3" className="w-full border p-2.5 rounded focus:ring-2 ring-purple-500 outline-none transition-shadow"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Mô tả về chủ đề này..." />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 shadow-lg disabled:bg-gray-400 transition-all">
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