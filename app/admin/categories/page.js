'use client';
import { useEffect, useState, useMemo } from 'react';
// 1. IMPORT TOASTER & SWEETALERT
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { fetchCategoryData, saveCategory, deleteCategory } from '@/services/admin/CategoryService'; 

export default function AdminCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
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

  const initialForm = {
    name: '',
    slug: '',
    parent_id: '',
    sort_order: 0,
    description: '',
    status: '0' 
  };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null); 


  // 1. Load danh sách danh mục
  const fetchCategories = async () => {
    try {
      const resData = await fetchCategoryData({
          page: currentPage, 
          limit: 10, 
          search: searchTerm 
      });
      
      setCategories(resData.data || []); 
      setLastPage(resData.last_page || 1);
      setCurrentPage(resData.current_page || 1);

    } catch (error) {
      toast.error(error.message || 'Lỗi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchCategories(); 
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

  const handleOpenEdit = (category) => {
    setIsEditing(true);
    setEditId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug || '',
      parent_id: category.parent_id || '',
      sort_order: category.sort_order || 0,
      description: category.description || '',
      status: String(category.status) 
    });
    setImageFile(null);
    setImagePreview(category.image || null); 
    setValidationErrors({});
    setShowModal(true);
  };

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
    data.append("name", formData.name);
    data.append("slug", formData.slug || "");
    data.append("status", formData.status);
    data.append("sort_order", formData.sort_order);
    data.append("description", formData.description || "");
    if (formData.parent_id) data.append("parent_id", formData.parent_id);
    if (imageFile) data.append("image", imageFile);

    // Hiển thị Loading Toast
    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm mới...');

    try {
      await saveCategory(data, isEditing ? editId : null);

      // Thông báo thành công
      toast.success(
        isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!",
        { id: toastId }
      );
      
      setShowModal(false);

      if (!isEditing) setCurrentPage(1);
      fetchCategories();
    } catch (error) {
      const errors = error.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat()[0]
        : error.response?.data?.message || "Có lỗi xảy ra";
      
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
      text: "Xóa danh mục này? Nó phải không chứa sản phẩm hoặc danh mục con.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCategory(id);
          
          Swal.fire(
            'Đã xóa!',
            'Danh mục đã được xóa thành công.',
            'success'
          );

          if (categories.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            fetchCategories();
          }
        } catch (error) {
          Swal.fire(
            'Lỗi!',
            error.message || "Không thể xóa danh mục này.",
            'error'
          );
        }
      }
    });
  };

  // Hàm render bảng
  const CategoryTable = ({ data, onEdit, onDelete }) => (
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
        <tr>
          <th className="p-4">ID</th>
          <th className="p-4">Tên danh mục</th>
          <th className="p-4">Ảnh</th>
          <th className="p-4">Danh mục cha</th>
          <th className="p-4">Thứ tự</th>
          <th className="p-4">Trạng thái</th>
          <th className="p-4 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-sm">
        {data.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-mono">{c.id}</td>
            <td className="p-4 font-bold">{c.name}</td>
            <td className="p-4">
              <div className="relative w-10 h-10 border rounded bg-gray-100">
                <Image
                  src={c.image || "https://placehold.co/40x40?text=No+Img"} 
                  alt={c.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </td>
            <td className="p-4 text-gray-500">
              {c.parent ? c.parent.name : "--- (Gốc) ---"}
            </td>
            <td className="p-4">{c.sort_order}</td>
            <td className="p-4">
              {c.status == 0 ? (
                <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded border border-green-200">
                  Active
                </span>
              ) : (
                <span className="text-red-500 text-xs font-bold bg-red-100 px-2 py-1 rounded border border-red-200">
                  Hidden
                </span>
              )}
            </td>
            <td className="p-4 text-center whitespace-nowrap">
              <button
                onClick={() => onEdit(c)}
                className="text-blue-600 font-bold mr-3 hover:bg-blue-50 p-2 rounded transition"
              >
                Sửa
              </button>
              <button
                onClick={() => onDelete(c.id)}
                className="text-red-600 font-bold hover:bg-red-50 p-2 rounded transition"
              >
                Xóa
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading)
    return (
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
        <h2 className="text-2xl font-bold text-gray-800 uppercase">
          Quản lý Danh mục
        </h2>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow flex items-center gap-2 transition"
        >
          <span>+</span> Thêm Danh mục
        </button>
      </div>

      {/* KHU VỰC TÌM KIẾM */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên danh mục..."
          className="w-80 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); 
          }}
        />
        <div className="text-sm text-gray-600">
          Hiện {categories.length} mục.
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-indigo-500 min-h-[200px]">
        {categories.length === 0 && !loading ? (
          <div className="p-10 text-center text-gray-500 italic flex flex-col items-center">
            <span className="text-4xl mb-2">📂</span>
            <p>Không tìm thấy danh mục nào.</p>
          </div>
        ) : (
          <CategoryTable
            data={categories}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* NÚT PHÂN TRANG */}
      <Pagination 
        currentPage={currentPage}
        totalPages={lastPage} 
        onPageChange={setCurrentPage}
    />

      {/* --- MODAL FORM --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-indigo-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">
                {isEditing ? "Cập nhật danh mục" : "Thêm mới danh mục"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-300 transition">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Image Upload Area */}
              <div className="flex justify-center flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-2 group">
                  <div
                    className={`relative w-24 h-24 rounded-lg border-2 border-gray-300 bg-white p-1`}
                  >
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Category Image"
                        fill
                        className="object-cover rounded-lg"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Img
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow border-2 border-white transition-transform hover:scale-110 z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                      />
                    </svg>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-gray-700">
                  Ảnh đại diện (Tùy chọn)
                </label>
                {validationErrors.image && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.image[0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Tên danh mục (*)
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.name[0]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Danh mục cha
                  </label>
                  <select
                    name="parent_id"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.parent_id}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_id: e.target.value })
                    }
                  >
                    <option value="">(Không có / Gốc)</option>
                    {categories.filter((c) => c.id !== editId).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.parent_id && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.parent_id[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Thứ tự sắp xếp
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Trạng thái
                  </label>
                  <select
                    name="status"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="0">Active</option> 
                    <option value="1">Hidden</option> 
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold mb-1">Mô tả</label>
                <textarea
                  name="description"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-bold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow disabled:bg-blue-400 transition"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}