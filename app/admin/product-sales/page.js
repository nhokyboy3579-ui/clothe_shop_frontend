// app/admin/product-sales/page.js

"use client";
import React, { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";

import Pagination from "@/components/Pagination";
import {
  fetchSaleData,
  saveSale,
  deleteSale,
  fetchProductsForDropdown,
} from "@/services/admin/ProductSaleService";

export default function AdminProductSales() {
  const [sales, setSales] = useState([]);
  const [productsDropdown, setProductsDropdown] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- BỘ LỌC VÀ SẮP XẾP ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '', 'active', 'upcoming', 'expired', 'hidden'
  const [sortPrice, setSortPrice] = useState("desc"); // 'asc' hoặc 'desc'

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSaleProduct, setCurrentSaleProduct] = useState(null);

  // --- HELPERS ---
  const getTodayString = () => new Date().toISOString().split("T")[0];
  const getNextWeekString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };
  const formatDateInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const initialForm = {
    product_id: "",
    price_sale: "",
    date_begin: getTodayString(),
    date_end: getNextWeekString(),
    status: "1",
  };
  const [formData, setFormData] = useState(initialForm);

  const formatCurrency = (amount) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // --- DEBOUNCE SEARCH ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset trang khi search
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- FETCH DATA (Cập nhật tham số) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, allProductsRes] = await Promise.all([
        fetchSaleData({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm,
          status_filter: statusFilter, // Gửi trạng thái lọc
          sort_price: sortPrice, // Gửi kiểu sắp xếp
        }),
        fetchProductsForDropdown(),
      ]);

      const salesData = salesRes.data || salesRes;
      setSales(Array.isArray(salesData) ? salesData : []);
      setLastPage(salesRes.last_page || 1);
      setAllProducts(allProductsRes || []);

      const existingProductIds = Array.isArray(salesData)
        ? salesData.map((s) => s.product_id)
        : [];
      const availableProducts = (allProductsRes || []).filter(
        (p) => !existingProductIds.includes(p.id)
      );
      setProductsDropdown(availableProducts);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, sortPrice]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedProductInfo = allProducts.find(
    (p) => String(p.id) === String(formData.product_id)
  );

  // --- HANDLERS (Giữ nguyên logic cũ của bạn) ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setCurrentSaleProduct(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (sale) => {
    setIsEditing(true);
    setEditId(sale.id);
    const fullProductInfo = allProducts.find((p) => p.id === sale.product_id);
    setCurrentSaleProduct(fullProductInfo);
    setFormData({
      product_id: String(sale.product_id),
      price_sale: sale.price_sale,
      date_begin: formatDateInput(sale.date_begin),
      date_end: formatDateInput(sale.date_end),
      status: String(sale.status),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const currentPrice =
      selectedProductInfo?.price_buy || selectedProductInfo?.price || 0;
    if (parseFloat(formData.price_sale) >= currentPrice) {
      toast.error(
        `Giá giảm phải nhỏ hơn giá gốc (${formatCurrency(currentPrice)})`
      );
      setIsSubmitting(false);
      return;
    }
    const toastId = toast.loading("Đang xử lý...");
    try {
      await saveSale(
        {
          ...formData,
          product_id: parseInt(formData.product_id),
          price_sale: parseFloat(formData.price_sale),
          status: parseInt(formData.status),
        },
        isEditing ? editId : null
      );
      toast.success("Thành công!", { id: toastId });
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error("Lỗi dữ liệu", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Xóa chương trình này?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteSale(id);
          toast.success("Đã xóa");
          fetchData();
        } catch (e) {
          toast.error("Lỗi khi xóa");
        }
      }
    });
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
          Quản lý Giảm giá
        </h2>
        <button
          onClick={handleOpenAdd}
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
        >
          + Thêm Giảm giá
        </button>
      </div>

      {/* TOOLBAR LỌC & TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Tìm tên sản phẩm..."
            className="w-full pl-10 p-2.5 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="p-2.5 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 font-medium"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang chạy</option>
          <option value="upcoming">Sắp bắt đầu</option>
          <option value="expired">Hết hạn</option>
          <option value="hidden">Tạm ẩn</option>
        </select>

        <select
          className="p-2.5 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 font-medium"
          value={sortPrice}
          onChange={(e) => {
            setSortPrice(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="desc">Giá giảm: Cao đến thấp</option>
          <option value="asc">Giá giảm: Thấp đến cao</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sản phẩm</th>
              <th className="p-4 text-right">Giá gốc</th>
              <th className="p-4 text-right">Giá giảm</th>
              <th className="p-4 text-center">Thời gian áp dụng</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : (
              sales.map((s) => {
                const now = new Date();
                const start = new Date(s.date_begin);
                const end = new Date(s.date_end);

                let statusBadge;
                if (s.status !== 1) {
                  statusBadge = (
                    <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-[10px] font-bold uppercase">
                      Tạm ẩn
                    </span>
                  );
                } else if (now < start) {
                  statusBadge = (
                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold uppercase border border-blue-100">
                      Sắp bắt đầu
                    </span>
                  );
                } else if (now >= start && now <= end) {
                  statusBadge = (
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-100">
                      Đang chạy
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-100">
                      Hết hạn
                    </span>
                  );
                }

                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-gray-400">#{s.id}</td>
                    <td className="p-4 font-bold text-gray-800">
                      {s.product?.name || "N/A"}
                    </td>
                    <td className="p-4 text-right line-through text-gray-400 italic text-xs">
                      {formatCurrency(s.product?.price_buy || s.product?.price)}
                    </td>
                    <td className="p-4 text-right font-black text-red-600 text-base">
                      {formatCurrency(s.price_sale)}
                    </td>
                    <td className="p-4 text-center text-[11px] text-gray-500 font-medium">
                      <div className="bg-gray-100 rounded-full px-2 py-0.5 inline-block">
                        {formatDateDisplay(s.date_begin)} -{" "}
                        {formatDateDisplay(s.date_end)}
                      </div>
                    </td>
                    <td className="p-4 text-center">{statusBadge}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="text-blue-600 font-bold hover:underline mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={lastPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0">
              <h3 className="font-bold uppercase">
                {isEditing ? "Cập nhật giảm giá" : "Thêm mới giảm giá"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl hover:text-gray-300"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">
                  Sản phẩm áp dụng (*)
                </label>
                <select
                  className="w-full border p-2.5 rounded bg-white"
                  required
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  disabled={isEditing}
                >
                  <option value="">-- Chọn Sản phẩm --</option>
                  {isEditing ? (
                    <option value={currentSaleProduct?.id}>
                      {currentSaleProduct?.name}
                    </option>
                  ) : (
                    productsDropdown.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
                {selectedProductInfo && (
                  <div className="mt-3 p-3 bg-blue-50 text-blue-900 rounded border border-blue-200 flex justify-between items-center text-sm shadow-sm animate-[fadeIn_0.3s]">
                    <span>Giá gốc hiện tại:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        selectedProductInfo.price_buy ||
                          selectedProductInfo.price ||
                          0
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">
                  Giá giảm (VND) (*)
                </label>
                <input
                  type="number"
                  step="1000"
                  className="w-full border p-2.5 rounded"
                  required
                  value={formData.price_sale}
                  onChange={(e) =>
                    setFormData({ ...formData, price_sale: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Ngày Bắt đầu
                  </label>
                  <input
                    type="date"
                    className="w-full border p-2.5 rounded"
                    required
                    value={formData.date_begin}
                    onChange={(e) =>
                      setFormData({ ...formData, date_begin: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Ngày Kết thúc
                  </label>
                  <input
                    type="date"
                    className="w-full border p-2.5 rounded"
                    required
                    value={formData.date_end}
                    onChange={(e) =>
                      setFormData({ ...formData, date_end: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">
                  Trạng thái
                </label>
                <select
                  className="w-full border p-2.5 rounded bg-white"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="1">Kích hoạt (Active)</option>
                  <option value="0">Tạm ẩn (Draft)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-lg disabled:bg-gray-400"
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : isEditing
                    ? "Cập nhật"
                    : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
