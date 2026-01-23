"use client";
import React, { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import Image from "next/image";

// Import Component & Service
import Pagination from "@/components/Pagination";
import {
  fetchPosts,
  savePost,
  deletePost,
  fetchTopicsForPost,
} from "@/services/admin/PostService";

export default function AdminPosts() {
  // --- STATE ---
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Search, Filter & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [topicFilter, setTopicFilter] = useState(""); // Lọc theo topic
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

  // Form Data
  const initialForm = {
    title: "",
    slug: "",
    topic_id: "",
    description: "",
    content: "",
    type: "post",
    status: "1",
  };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
        topic_id: topicFilter,
        status: statusFilter,
      };

      const [postsRes, topicsRes] = await Promise.all([
        fetchPosts(params),
        fetchTopicsForPost(),
      ]);

      setPosts(postsRes.data || []);
      setLastPage(postsRes.last_page || 1);
      setTotalItems(postsRes.total || 0);
      setTopics(topicsRes || []);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, topicFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- HANDLERS ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      title: item.title,
      slug: item.slug,
      topic_id: item.topic_id || "",
      description: item.description || "",
      content: item.content || "",
      type: item.type,
      status: String(item.status),
    });
    const imgUrl = item.image
      ? item.image.startsWith("http")
        ? item.image
        : `http://localhost:8000/storage/${item.image}`
      : null;
    setImagePreview(imgUrl);
    setImageFile(null);
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
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (imageFile) data.append("image", imageFile);

    const toastId = toast.loading(
      isEditing ? "Đang cập nhật..." : "Đang thêm mới..."
    );
    try {
      await savePost(data, isEditing ? editId : null);
      toast.success("Thành công!", { id: toastId });
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error("Có lỗi xảy ra", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa ngay",
    });
    if (result.isConfirmed) {
      try {
        await deletePost(id);
        Swal.fire("Đã xóa!", "", "success");
        loadData();
      } catch (error) {
        Swal.fire("Lỗi!", "", "error");
      }
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 uppercase italic">
          Quản lý Bài viết
        </h2>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2"
        >
          <span>+</span> THÊM BÀI VIẾT
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Tìm kiếm tiêu đề bài viết..."
            className="w-full p-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 text-gray-400"
            >
              ×
            </button>
          )}
        </div>

        <select
          className="p-3 bg-gray-50 border-0 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          value={topicFilter}
          onChange={(e) => {
            setTopicFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Tất cả chủ đề</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          className="p-3 bg-gray-50 border-0 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang xuất bản</option>
          <option value="0">Bản nháp/Ẩn</option>
        </select>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Danh sách ({totalItems})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400">
              <tr>
                <th className="p-4 w-16">ID</th>
                <th className="p-4 w-24">Ảnh</th>
                <th className="p-4">Nội dung bài viết</th>
                <th className="p-4 text-center">Loại</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-20 text-center animate-pulse font-bold text-gray-300 uppercase"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-20 text-center text-gray-400 italic"
                  >
                    Không tìm thấy bài viết nào phù hợp.
                  </td>
                </tr>
              ) : (
                posts.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-gray-400">
                      #{item.id}
                    </td>
                    <td className="p-4">
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 border shadow-sm">
                        {item.image ? (
                          <Image
                            src={
                              item.image.startsWith("http")
                                ? item.image
                                : `http://localhost:8000/storage/${item.image}`
                            }
                            alt="img"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-[8px] text-gray-400">
                            NO IMAGE
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800 line-clamp-1">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase">
                          📂 {item.topic?.name || "Không rõ"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                          item.type === "post"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                            : "bg-purple-50 text-purple-600 border-purple-100"
                        }`}
                      >
                        {item.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
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
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all mr-1"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all"
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

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={lastPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* --- MODAL FORM --- (Giữ nguyên phần modal của bạn nhưng tối ưu CSS) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
              <h3 className="font-black italic uppercase tracking-wider">
                {isEditing ? "Cập nhật bài viết" : "Tạo bài viết mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-3xl hover:rotate-90 transition-all"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 overflow-y-auto space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                      Tiêu đề bài viết (*)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Chủ đề
                      </label>
                      <select
                        className="w-full bg-gray-50 border-0 p-3 rounded-xl outline-none"
                        value={formData.topic_id}
                        onChange={(e) =>
                          setFormData({ ...formData, topic_id: e.target.value })
                        }
                      >
                        <option value="">Chọn chủ đề</option>
                        {topics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                        Loại
                      </label>
                      <select
                        className="w-full bg-gray-50 border-0 p-3 rounded-xl outline-none font-bold"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                      >
                        <option value="post">Tin tức</option>
                        <option value="page">Trang đơn</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    Hình ảnh đại diện
                  </label>
                  <div
                    className="h-40 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer relative overflow-hidden flex items-center justify-center"
                    onClick={() => document.getElementById("postImg").click()}
                  >
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <span className="text-3xl block mb-1">🖼️</span>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          Click để tải ảnh
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="postImg"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Nội dung chi tiết (*)
                </label>
                <textarea
                  rows="6"
                  className="w-full bg-gray-50 border-0 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500"
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 shadow-xl disabled:bg-gray-300 transition-all uppercase text-xs tracking-widest"
                >
                  {isSubmitting
                    ? "ĐANG LƯU..."
                    : isEditing
                    ? "CẬP NHẬT"
                    : "XUẤT BẢN NGAY"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
