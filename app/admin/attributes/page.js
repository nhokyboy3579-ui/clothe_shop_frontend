// app/admin/attributes/page.js

'use client';
import { useEffect, useState, useMemo } from 'react';
// 1. IMPORT TOASTER & SWEETALERT
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2'; 

import Pagination from '@/components/Pagination'; 
import { fetchAttributeData, saveAttribute, deleteAttribute } from '@/services/admin/AttributeService'; 

export default function AdminAttributes() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1); 
  
  // --- STATE MODAL & FORM ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({ name: '' });


  // 1. Load danh sách Attribute
  const fetchAttributes = async () => {
    try {
      const resData = await fetchAttributeData({
          page: currentPage, 
          limit: 10, 
          search: searchTerm 
      });
      
      setAttributes(resData.data || []); 
      setLastPage(resData.last_page || 1);
      setCurrentPage(resData.current_page || 1);

    } catch (error) {
      toast.error(error.message || 'Lỗi tải danh sách thuộc tính.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchAttributes(); 
  }, [currentPage, searchTerm]);


  // --- HANDLERS ---

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: '' });
    setValidationErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (attr) => {
    setIsEditing(true);
    setEditId(attr.id);
    setFormData({ name: attr.name });
    setValidationErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});

    // Hiển thị loading toast
    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm mới...');

    try {
      const payload = { name: formData.name };
      
      await saveAttribute(payload, isEditing ? editId : null);
      
      // Thông báo thành công
      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm mới thành công!', { id: toastId });
      
      setShowModal(false);
      
      setCurrentPage(isEditing ? currentPage : 1);
      fetchAttributes(); 

    } catch (error) {
      const errors = error.response?.data?.errors;
      const msg = errors 
        ? Object.values(errors).flat()[0] 
        : (error.response?.data?.message || 'Có lỗi xảy ra');
      
      setValidationErrors(errors || {});
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- XỬ LÝ XÓA VỚI SWEETALERT2 ---
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Xóa thuộc tính này? Nó phải không có giá trị biến thể liên quan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteAttribute(id); 
          
          Swal.fire(
            'Đã xóa!',
            'Thuộc tính đã được xóa thành công.',
            'success'
          );
          
          fetchAttributes();
        } catch (error) { 
          Swal.fire(
            'Lỗi!',
            error.message || 'Không thể xóa thuộc tính này.',
            'error'
          );
        }
      }
    });
  };


  // Hàm render bảng
  const AttributeTable = ({ data, onEdit, onDelete }) => (
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
        <tr>
          <th className="p-4">ID</th>
          <th className="p-4">Tên thuộc tính</th>
          <th className="p-4">Ngày tạo</th>
          <th className="p-4 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-sm">
        {data.map(attr => (
          <tr key={attr.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-mono">{attr.id}</td>
            <td className="p-4 font-bold">{attr.name}</td>
            <td className="p-4 text-gray-500">{new Date(attr.created_at).toLocaleDateString()}</td>
            <td className="p-4 text-center whitespace-nowrap">
              <button onClick={() => onEdit(attr)} className="text-blue-600 font-bold mr-3 hover:bg-blue-50 p-2 rounded transition">Sửa</button>
              <button onClick={() => onDelete(attr.id)} className="text-red-600 font-bold hover:bg-red-50 p-2 rounded transition">Xóa</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );


  if (loading) return (
      <div className="p-10 text-center flex flex-col items-center justify-center h-screen text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          Đang tải dữ liệu...
      </div>
  );

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

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 uppercase">Quản lý Thuộc tính</h2>
        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow flex items-center gap-2 transition">
          <span>+</span> Thêm Thuộc tính
        </button>
      </div>
      
      {/* KHU VỰC TÌM KIẾM */}
      <div className="mb-4 flex justify-between items-center">
          <input
              type="text" 
              placeholder="Tìm kiếm theo tên thuộc tính..."
              className="w-80 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              value={searchTerm} 
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); 
              }}
          />
          <div className="text-sm text-gray-600 font-medium">
              Hiện {attributes.length} mục.
          </div>
      </div>


      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-indigo-500 min-h-[200px]">
        {attributes.length === 0 && !loading ? (
             <div className="p-10 text-center text-gray-500 italic flex flex-col items-center">
                <span className="text-4xl mb-2">🏷️</span>
                <p>Không tìm thấy thuộc tính nào.</p>
             </div>
        ) : (
            <AttributeTable data={attributes} onEdit={handleOpenEdit} onDelete={handleDelete} />
        )}
      </div>
      
      {/* NÚT PHÂN TRANG */}
      {lastPage > 1 && (
          <Pagination 
              currentPage={currentPage}
              totalPages={lastPage} 
              onPageChange={setCurrentPage}
          />
      )}


      {/* --- MODAL FORM --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">{isEditing ? 'Cập nhật thuộc tính' : 'Thêm mới thuộc tính'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-300 transition">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              
              <div className="mb-6">
                <label className="block text-sm font-bold mb-1 text-gray-700">Tên thuộc tính (VD: Màu sắc, Size)</label>
                <input type="text" name="name" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" required 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nhập tên thuộc tính..." />
                {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name[0]}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow disabled:bg-blue-400 transition">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thuộc tính'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}