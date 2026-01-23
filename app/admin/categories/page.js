"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";
import {
  fetchCategoryData,
  saveCategory,
  deleteCategory,
} from "@/services/admin/CategoryService";

export default function AdminCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PHÂN TRANG & BỘ LỌC & SẮP XẾP ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Thêm state cho Lọc và Sắp xếp
  const [statusFilter, setStatusFilter] = useState(""); // '' (Tất cả), '0' (Active), '1' (Hidden)
  const [sortConfig, setSortConfig] = useState({
    column: "created_at",
    direction: "desc",
  });

  // --- STATE MODAL & FORM ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const initialForm = {
    name: "",
    slug: "",
    parent_id: "",
    sort_order: 0,
    description: "",
    status: "0",
  };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // 1. Load danh sách danh mục (Cập nhật params)
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const resData = await fetchCategoryData({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        sort_column: sortConfig.column,
        sort_direction: sortConfig.direction,
      });

      setCategories(resData.data || []);
      setLastPage(resData.last_page || 1);
      setCurrentPage(resData.current_page || 1);
    } catch (error) {
      toast.error(error.message || "Lỗi tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  // Theo dõi sự thay đổi của trang, tìm kiếm, lọc và sắp xếp
  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm, statusFilter, sortConfig]);

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
      slug: category.slug || "",
      parent_id: category.parent_id || "",
      sort_order: category.sort_order || 0,
      description: category.description || "",
      status: String(category.status),
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

    const toastId = toast.loading(
      isEditing ? "Đang cập nhật..." : "Đang thêm mới..."
    );

    try {
      await saveCategory(data, isEditing ? editId : null);
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

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Xóa danh mục này? Nó phải không chứa sản phẩm hoặc danh mục con.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCategory(id);
          Swal.fire("Đã xóa!", "Danh mục đã được xóa thành công.", "success");
          if (categories.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            fetchCategories();
          }
        } catch (error) {
          Swal.fire(
            "Lỗi!",
            error.message || "Không thể xóa danh mục này.",
            "error"
          );
        }
      }
    });
  };

  // Hàm xử lý đổi chiều sắp xếp
  const handleRequestSort = (column) => {
    const isAsc =
      sortConfig.column === column && sortConfig.direction === "asc";
    setSortConfig({
      column,
      direction: isAsc ? "desc" : "asc",
    });
  };

  // Render icon sắp xếp
  const renderSortIcon = (column) => {
    if (sortConfig.column !== column)
      return <span className="ml-1 text-gray-300">↕</span>;
    return sortConfig.direction === "asc" ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" reverseOrder={false} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">
          Quản lý Danh mục
        </h2>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <span className="text-xl">+</span> Thêm Danh mục
        </button>
      </div>

      {/* KHU VỰC BỘ LỌC & TÌM KIẾM */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        {/* Tìm kiếm */}
        <div className="flex-1 min-w-[280px] relative">
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>

        {/* Lọc Trạng thái */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Trạng thái:</span>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tất cả</option>
            <option value="0">Active</option>
            <option value="1">Hidden</option>
          </select>
        </div>

        {/* Nút reset nhanh */}
        <button
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("");
            setSortConfig({ column: "created_at", direction: "desc" });
          }}
          className="text-sm text-indigo-600 hover:underline font-medium"
        >
          Xóa bộ lọc
        </button>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-20 text-center text-gray-400 italic flex flex-col items-center">
            <span className="text-5xl mb-4">📂</span>
            <p className="text-lg">Không tìm thấy danh mục nào phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600 border-b border-gray-100">
                <tr>
                  <th
                    className="p-4 cursor-pointer hover:text-indigo-600 transition"
                    onClick={() => handleRequestSort("id")}
                  >
                    ID {renderSortIcon("id")}
                  </th>
                  <th
                    className="p-4 cursor-pointer hover:text-indigo-600 transition"
                    onClick={() => handleRequestSort("name")}
                  >
                    Tên danh mục {renderSortIcon("name")}
                  </th>
                  <th className="p-4">Ảnh</th>
                  <th className="p-4">Danh mục cha</th>
                  <th
                    className="p-4 cursor-pointer hover:text-indigo-600 transition"
                    onClick={() => handleRequestSort("sort_order")}
                  >
                    Thứ tự {renderSortIcon("sort_order")}
                  </th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {categories.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="p-4 font-mono text-gray-500">#{c.id}</td>
                    <td className="p-4 font-bold text-gray-800">{c.name}</td>
                    <td className="p-4">
                      <div className="relative w-10 h-10 border rounded-lg overflow-hidden bg-gray-50 shadow-sm">
                        <Image
                          src={
                            c.image || "https://placehold.co/40x40?text=No+Img"
                          }
                          alt={c.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 italic">
                      {c.parent ? (
                        c.parent.name
                      ) : (
                        <span className="text-gray-300">--- (Gốc) ---</span>
                      )}
                    </td>
                    <td className="p-4 font-medium">{c.sort_order}</td>
                    <td className="p-4">
                      {c.status == 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{" "}
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{" "}
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-blue-600 font-bold mr-3 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PHÂN TRANG */}
      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={lastPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* --- MODAL FORM --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase tracking-wider">
                {isEditing ? "✏️ Cập nhật danh mục" : "✨ Thêm mới danh mục"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl hover:rotate-90 transition-transform duration-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Image Upload */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-28 h-28 mb-3 group">
                  <div
                    className={`relative w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center`}
                  >
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">Chưa có ảnh</span>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-xl cursor-pointer hover:bg-indigo-700 shadow-xl transition-transform hover:scale-110">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Ảnh đại diện (Khuyên dùng 1:1)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tên danh mục (*)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Danh mục cha
                  </label>
                  <select
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.parent_id}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_id: e.target.value })
                    }
                  >
                    <option value="">(Không có / Gốc)</option>
                    {categories
                      .filter((c) => c.id !== editId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Thứ tự sắp xếp
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
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

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:bg-indigo-400 transition-all"
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
