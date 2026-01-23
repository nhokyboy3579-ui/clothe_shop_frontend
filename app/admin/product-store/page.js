"use client";

import { useEffect, useState } from "react";
import { ProductStoreService } from "@/services/admin/ProductStoreService";

// --- IMPORT THƯ VIỆN UI ---
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import Pagination from "@/components/Pagination";

// ================= COMPONENT CHÍNH =================
export default function ProductStoreManager() {
  // --- STATE ---
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // State Bộ lọc & Tìm kiếm
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sort_qty: "",
    sort_price: "",
  });

  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // State Form
  const [formData, setFormData] = useState({
    product_id: "",
    price_root: "",
    qty: "",
    status: 1,
  });

  // --- 1. LOAD DANH SÁCH SẢN PHẨM CHO DROPDOWN ---
  useEffect(() => {
    const fetchProductsForSelect = async () => {
      try {
        const res = await ProductStoreService.getProductsForSelect();
        setProducts(res.data || res || []);
      } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);
      }
    };
    fetchProductsForSelect();
  }, []);

  // --- 2. LOAD DỮ LIỆU KHO (THEO TRANG + BỘ LỌC) ---
  const fetchStoreItems = async () => {
    try {
      setLoading(true);
      // Gộp trang hiện tại và các bộ lọc gửi lên Server
      const res = await ProductStoreService.getAll({
        page: currentPage,
        ...filters,
      });

      setItems(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải dữ liệu kho!");
    } finally {
      setLoading(false);
    }
  };

  // Gọi lại khi trang hoặc bộ lọc thay đổi
  useEffect(() => {
    // Reset về trang 1 nếu người dùng thay đổi bộ lọc
    if (currentPage !== 1 && (filters.search || filters.status)) {
      setCurrentPage(1);
    }
    fetchStoreItems();
  }, [currentPage, filters]);

  // --- XỬ LÝ THAY ĐỔI BỘ LỌC ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "", sort_qty: "", sort_price: "" });
    setCurrentPage(1);
  };

  // --- HÀNH ĐỘNG MODAL ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ product_id: "", price_root: "", qty: "", status: 1 });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
    setFormData({
      product_id: item.product_id,
      price_root: item.price_root,
      qty: item.qty,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentItem(null);
  };

  // --- XỬ LÝ SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.price_root < 0 || formData.qty < 0) {
      toast.error("Giá và số lượng không được âm!");
      return;
    }
    const toastId = toast.loading("Đang xử lý...");
    try {
      if (isEditing) {
        await ProductStoreService.update(currentItem.id, formData);
        toast.success("Cập nhật thành công!", { id: toastId });
      } else {
        await ProductStoreService.add(formData);
        toast.success("Nhập kho thành công!", { id: toastId });
      }
      fetchStoreItems();
      handleCloseModal();
    } catch (error) {
      const msg = error.response?.data?.message || "Đã có lỗi xảy ra!";
      toast.error(msg, { id: toastId });
    }
  };

  // --- XỬ LÝ XÓA ---
  const handleDelete = (id) => {
    Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Dữ liệu phiếu nhập này sẽ bị xóa vĩnh viễn!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Vâng, xóa nó!",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await ProductStoreService.delete(id);
          Swal.fire("Đã xóa!", "Phiếu nhập kho đã được xóa.", "success");
          fetchStoreItems();
        } catch (error) {
          Swal.fire("Lỗi!", "Không thể xóa phiếu nhập này.", "error");
        }
      }
    });
  };

  const formatMoney = (num) =>
    new Intl.NumberFormat("vi-VN").format(num) + " đ";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" reverseOrder={false} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">
            Quản Lý Nhập Kho
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý tồn kho và giá vốn sản phẩm theo thời gian thực
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all font-semibold flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nhập Hàng Mới
        </button>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 mb-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        {/* Tìm kiếm */}
        <div className="flex-1 min-w-[250px] relative">
          <input
            name="search"
            type="text"
            placeholder="Tìm tên sản phẩm..."
            value={filters.search}
            onChange={handleFilterChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"
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
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Trạng thái --</option>
          <option value="1">Đang hoạt động</option>
          <option value="0">Đang ẩn</option>
        </select>

        {/* Sắp xếp Số lượng */}
        <select
          name="sort_qty"
          value={filters.sort_qty}
          onChange={handleFilterChange}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Tồn kho --</option>
          <option value="asc">Tăng dần (Thấp nhất)</option>
          <option value="desc">Giảm dần (Nhiều nhất)</option>
        </select>

        {/* Nút reset */}
        <button
          onClick={resetFilters}
          className="text-gray-400 hover:text-red-500 transition-colors p-2"
          title="Làm mới bộ lọc"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="p-4 border-b">ID</th>
              <th className="p-4 border-b">Sản phẩm</th>
              <th className="p-4 border-b">Hình ảnh</th>
              <th className="p-4 border-b text-right">Giá Gốc</th>
              <th className="p-4 border-b text-center">Tồn Kho</th>
              <th className="p-4 border-b text-center">Trạng thái</th>
              <th className="p-4 border-b text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="p-4 text-gray-500 font-mono">#{item.id}</td>
                  <td className="p-4 font-semibold text-gray-800">
                    {item.product?.name || (
                      <span className="text-red-400 italic bg-red-50 px-2 py-1 rounded">
                        Đã xóa SP
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {item.product?.thumbnail ? (
                      <img
                        src={
                          item.product.thumbnail.includes("http")
                            ? item.product.thumbnail
                            : `http://localhost:8000/storage/${item.product.thumbnail}`
                        }
                        alt="img"
                        className="w-12 h-12 object-cover rounded-lg border shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right font-bold text-gray-700">
                    {formatMoney(item.price_root)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`py-1 px-3 rounded-full font-bold text-xs ${
                        item.qty > 10
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.qty}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.status === 1 ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>{" "}
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 font-bold text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>{" "}
                        Ẩn
                      </span>
                    )}
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition"
                      title="Chỉnh sửa"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                      title="Xóa"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-12 text-center text-gray-500 flex flex-col items-center"
                >
                  <span className="text-4xl mb-2">📦</span>
                  <span className="text-sm">
                    Không tìm thấy phiếu nhập kho nào phù hợp.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {lastPage > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={lastPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ================= MODAL FORM ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? "✏️ Cập Nhật Kho Hàng" : "📦 Nhập Hàng Mới"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-red-500 transition text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Sản phẩm <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-shadow disabled:bg-gray-100"
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  required
                  disabled={isEditing}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Giá Nhập (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.price_root}
                    onChange={(e) =>
                      setFormData({ ...formData, price_root: e.target.value })
                    }
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.qty}
                    onChange={(e) =>
                      setFormData({ ...formData, qty: e.target.value })
                    }
                    placeholder="0"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Trạng thái
                </label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="1">Hiện (Hoạt động)</option>
                  <option value="0">Ẩn (Tạm ngưng)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 transition-all"
                >
                  {isEditing ? "Lưu Thay Đổi" : "Xác Nhận Nhập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
