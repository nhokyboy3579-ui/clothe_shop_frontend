'use client';
import { useEffect, useState, useMemo } from 'react';
// 1. IMPORT TOASTER & SWEETALERT
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2'; 

import Image from 'next/image';
import Pagination from '@/components/Pagination'; 
import { fetchBannerData, saveBanner, deleteBanner } from '@/services/admin/BannerService'; 

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1); 
  const itemsPerPage = 10; 

  // --- STATE MODAL & FORM ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const initialForm = {
    name: '',
    link: '',
    position: 'slideshow', 
    sort_order: 0,
    description: '',
    status: '1' 
  };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null); 


  // 1. Load dữ liệu
  const fetchBanners = async () => {
    try {
      const resData = await fetchBannerData({
          page: currentPage, 
          limit: itemsPerPage, 
          search: searchTerm 
      });
      
      setBanners(resData.data || []); 
      setLastPage(resData.last_page || 1);
      setCurrentPage(resData.current_page || 1);

    } catch (error) {
      toast.error(error.message || 'Lỗi tải danh sách banner.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchBanners(); 
  }, [currentPage, searchTerm]);


  // --- HANDLERS ---

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setValidationErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (banner) => {
    setIsEditing(true);
    setEditId(banner.id);
    setFormData({
      name: banner.name,
      link: banner.link || '',
      position: banner.position,
      sort_order: banner.sort_order || 0,
      description: banner.description || '',
      status: String(banner.status) 
    });
    setImageFile(null);
    setImagePreview(banner.image || null); 
    setValidationErrors({});
    setShowModal(true);
  };

  // Xử lý chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});

    const data = new FormData();
    data.append('name', formData.name);
    data.append('link', formData.link || '');
    data.append('position', formData.position);
    data.append('sort_order', formData.sort_order);
    data.append('description', formData.description || '');
    data.append('status', formData.status);
    
    if (imageFile) data.append('image', imageFile);

    // Hiển thị loading toast
    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm mới...');

    try {
      await saveBanner(data, isEditing ? editId : null);
      
      // Thông báo thành công
      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm mới thành công!', { id: toastId });
      
      setShowModal(false);
      if (!isEditing) setCurrentPage(1);
      fetchBanners(); 

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
      text: "Bạn muốn xóa banner này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteBanner(id); 
          
          Swal.fire(
            'Đã xóa!',
            'Banner đã được xóa thành công.',
            'success'
          );
          
          fetchBanners(); 
        } catch (error) { 
          Swal.fire(
            'Lỗi!',
            error.message || 'Không thể xóa banner này.',
            'error'
          );
        }
      }
    });
  };


  // Hàm render bảng
  const BannerTable = ({ data, onEdit, onDelete }) => (
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
        <tr>
          <th className="p-4">ID</th>
          <th className="p-4">Ảnh</th>
          <th className="p-4">Tên Banner</th>
          <th className="p-4">Vị trí</th>
          <th className="p-4">Thứ tự</th>
          <th className="p-4">Trạng thái</th>
          <th className="p-4 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-sm">
        {data.map(b => (
          <tr key={b.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-mono">{b.id}</td>
            <td className="p-4">
              <div className="relative w-32 h-10 overflow-hidden border rounded flex items-center justify-center bg-gray-100 shadow-sm group">
                <img 
                  src={b.image || 'https://placehold.co/128x40?text=No+Img'} 
                  alt={b.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                  onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/128x40?text=ERR';
                  }}
                />
              </div>
            </td>
            <td className="p-4 font-bold text-gray-800">{b.name}</td>
            <td className="p-4 uppercase text-xs font-semibold text-gray-500">{b.position}</td>
            <td className="p-4 text-center font-mono">{b.sort_order}</td>
            <td className="p-4">
              {b.status == 1 
                ? <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active</span> 
                : <span className="inline-flex items-center gap-1 text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Hidden</span>
              }
            </td>
            <td className="p-4 text-center whitespace-nowrap">
              <button onClick={() => onEdit(b)} className="text-blue-600 font-bold mr-3 hover:bg-blue-50 p-2 rounded transition">Sửa</button>
              <button onClick={() => onDelete(b.id)} className="text-red-600 font-bold hover:bg-red-50 p-2 rounded transition">Xóa</button>
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
        <h2 className="text-2xl font-bold text-gray-800 uppercase">Quản lý Banner</h2>
        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow flex items-center gap-2 transition">
          <span>+</span> Thêm Banner
        </button>
      </div>
      
      {/* KHU VỰC TÌM KIẾM & PHÂN TRANG */}
      <div className="mb-4 flex justify-between items-center">
          <input
              type="text" 
              placeholder="Tìm kiếm theo tên banner..."
              className="w-80 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              value={searchTerm} 
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); 
              }}
          />
          <div className="text-sm text-gray-600 font-medium">
              Tổng cộng: {banners.length} mục
          </div>
      </div>


      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-indigo-500 min-h-[200px]">
        {banners.length === 0 && !loading ? (
             <div className="p-10 text-center text-gray-500 italic flex flex-col items-center">
                <span className="text-4xl mb-2">🖼️</span>
                <p>Không tìm thấy banner nào.</p>
             </div>
        ) : (
            <BannerTable data={banners} onEdit={handleOpenEdit} onDelete={handleDelete} />
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">{isEditing ? 'Cập nhật banner' : 'Thêm mới banner'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-300 transition">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              
              {/* Image Upload Area */}
              <div className="flex justify-center flex-col items-center mb-6">
                  <div className="relative w-full h-32 mb-2 group cursor-pointer" onClick={() => document.getElementById('bannerInput').click()}>
                      <div className={`relative w-full h-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden hover:bg-gray-100 transition`}>
                          {imagePreview ? (
                              <Image src={imagePreview} alt="Banner Preview" fill className="object-cover" unoptimized />
                          ) : (
                              <div className="text-gray-400 text-sm flex flex-col items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                  </svg>
                                  Nhấn để tải ảnh lên (Ngang)
                              </div>
                          )}
                      </div>
                      
                      <input type="file" id="bannerInput" name="image" className="hidden" accept="image/*" onChange={handleFileChange} required={!isEditing}/>
                  </div>
                  <label className="text-sm font-medium text-gray-700">Hình ảnh Banner {isEditing ? '(Tùy chọn)' : '*'}</label>
                  {validationErrors.image && <p className="text-red-500 text-xs mt-1">{validationErrors.image[0]}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Tên Banner *</label>
                  <input type="text" name="name" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" required 
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="VD: Khuyến mãi mùa hè" />
                  {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Link liên kết</label>
                  <input type="text" name="link" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Vị trí *</label>
                  <select name="position" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})}
                  >
                    <option value="slideshow">Slideshow (Trang chủ)</option>
                    <option value="ads">Ads (Quảng cáo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Thứ tự sắp xếp</label>
                  <input type="number" name="sort_order" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Trạng thái</label>
                  <select name="status" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="1">Active</option>
                    <option value="0">Hidden</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold mb-1 text-gray-700">Mô tả</label>
                <textarea name="description" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" rows="3"
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả ngắn về banner..."
                ></textarea>
              </div>


              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow disabled:bg-gray-400 transition">
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