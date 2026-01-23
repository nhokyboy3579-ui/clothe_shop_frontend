"use client";
import React, { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";

import Pagination from "@/components/Pagination";
import {
  fetchTopics,
  saveTopic,
  deleteTopic,
} from "@/services/admin/TopicService";

export default function AdminTopics() {
  // --- STATE ---
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Search, Filter & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Lọc theo trạng thái
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // State Modal & Form
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    name: "",
    slug: "",
    sort_order: 0,
    description: "",
    status: "1",
  };
  const [formData, setFormData] = useState(initialForm);

  // --- EFFECT: Debounce Search ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- EFFECT: Load Data ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        status: statusFilter,
      };

      const res = await fetchTopics(params);
      const data = res.data || res;

      setTopics(data || []);
      setLastPage(res.last_page || 1);
      setTotalItems(res.total || 0);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- HANDLERS ---
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
      description: item.description || "",
      status: String(item.status),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading(
      isEditing ? "Đang cập nhật..." : "Đang thêm mới..."
    );

    try {
      await saveTopic(formData, isEditing ? editId : null);
      toast.success("Thành công!", { id: toastId });
      setShowModal(false);
      loadData();
    } catch (error) {
      const msg = error.response?.data?.message || "Có lỗi xảy ra";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này có thể ảnh hưởng đến các bài viết thuộc chủ đề này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa ngay",
      confirmButtonColor: "#7c3aed",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTopic(id);
          Swal.fire("Đã xóa!", "", "success");
          loadData();
        } catch (error) {
          Swal.fire("Lỗi!", "Không thể xóa chủ đề này.", "error");
        }
      }
    });
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 uppercase italic tracking-tight">
          Quản lý Chủ đề
        </h2>
        <button
          onClick={handleOpenAdd}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 shadow-lg transition-all flex items-center gap-2"
        >
          <span>+</span> THÊM CHỦ ĐỀ
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Tìm tên chủ đề hoặc slug..."
            className="w-full p-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="p-3 bg-gray-50 border-0 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang hoạt động</option>
          <option value="0">Đang tạm ẩn</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Danh mục chủ đề ({totalItems})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
              <tr>
                <th className="p-4 w-16">ID</th>
                <th className="p-4">Tên Chủ Đề / Slug</th>
                <th className="p-4 text-center">Thứ tự</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-20 text-center animate-pulse font-bold text-gray-300"
                  >
                    ĐANG TẢI...
                  </td>
                </tr>
              ) : topics.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-20 text-center text-gray-400 italic"
                  >
                    Không tìm thấy chủ đề nào.
                  </td>
                </tr>
              ) : (
                topics.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-gray-400">
                      #{item.id}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono italic">
                        {item.slug}
                      </p>
                    </td>
                    <td className="p-4 text-center font-bold text-purple-600">
                      <span className="bg-purple-50 px-3 py-1 rounded-full">
                        {item.sort_order}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          item.status == 1
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status == 1 ? "bg-green-600" : "bg-red-600"
                          }`}
                        ></span>
                        {item.status == 1 ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all mr-2"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {lastPage > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={lastPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="bg-purple-700 text-white px-8 py-5 flex justify-between items-center">
              <h3 className="font-black italic uppercase tracking-wider">
                {isEditing ? "Cập nhật chủ đề" : "Thêm chủ đề mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-3xl hover:scale-125 transition-all"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Tên chủ đề (*)
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 ring-purple-500 outline-none font-bold"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VD: Tin tức công nghệ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border-0 p-3 rounded-xl outline-none text-sm italic"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="tin-tuc-cntt"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 border-0 p-3 rounded-xl outline-none font-bold text-purple-600"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Trạng thái hoạt động
                </label>
                <select
                  className="w-full bg-gray-50 border-0 p-3 rounded-xl outline-none font-bold"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="1">Xuất bản (Active)</option>
                  <option value="0">Tạm ẩn (Hidden)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  rows="3"
                  className="w-full bg-gray-50 border-0 p-4 rounded-2xl outline-none focus:ring-2 ring-purple-500 text-sm"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-purple-700 text-white rounded-2xl font-black hover:bg-purple-800 shadow-xl disabled:bg-gray-300 transition-all uppercase text-xs tracking-widest"
                >
                  {isSubmitting
                    ? "ĐANG LƯU..."
                    : isEditing
                    ? "CẬP NHẬT"
                    : "TẠO MỚI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
