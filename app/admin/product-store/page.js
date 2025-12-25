"use client";

import { useEffect, useState } from "react";
import { ProductStoreService } from "@/services/admin/ProductStoreService";

// --- IMPORT THƯ VIỆN THÔNG BÁO ---
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2'; 

// ================= COMPONENT CHÍNH =================
export default function ProductStoreManager() {
  // --- STATE ---
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  // --- 1. LOAD DỮ LIỆU ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [storeRes, productRes] = await Promise.all([
        ProductStoreService.getAll(),
        ProductStoreService.getProductsForSelect()
      ]);

      setItems(storeRes.data.data || []); 
      setProducts(productRes.data || productRes || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải dữ liệu kho!");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HÀNH ĐỘNG MODAL ---
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

  // --- 3. XỬ LÝ SUBMIT (DÙNG TOAST) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate cơ bản
    if(formData.price_root < 0 || formData.qty < 0) {
        toast.error("Giá và số lượng không được âm!");
        return;
    }

    // Hiển thị loading toast
    const toastId = toast.loading('Đang xử lý...');

    try {
      if (isEditing) {
        await ProductStoreService.update(currentItem.id, formData);
        toast.success("Cập nhật thành công!", { id: toastId });
      } else {
        await ProductStoreService.add(formData);
        toast.success("Nhập kho thành công!", { id: toastId });
      }

      // Reload data
      const res = await ProductStoreService.getAll();
      setItems(res.data.data || []);
      handleCloseModal();

    } catch (error) {
      console.error(error);
      // Lấy thông báo lỗi từ backend nếu có
      const msg = error.response?.data?.message || "Đã có lỗi xảy ra!";
      toast.error(msg, { id: toastId });
    }
  };

  // --- 4. XỬ LÝ XÓA (DÙNG SWEETALERT2) ---
  const handleDelete = (id) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Dữ liệu phiếu nhập này sẽ bị xóa vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
            await ProductStoreService.delete(id);
            
            // Thông báo xóa thành công
            Swal.fire(
              'Đã xóa!',
              'Phiếu nhập kho đã được xóa.',
              'success'
            );

            // Reload data
            const res = await ProductStoreService.getAll();
            setItems(res.data.data || []);

        } catch (error) {
            Swal.fire(
                'Lỗi!',
                'Không thể xóa phiếu nhập này.',
                'error'
              );
        }
      }
    });
  };

  const formatMoney = (num) => new Intl.NumberFormat("vi-VN").format(num) + " đ";

  if (loading) return (
      <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* --- CẤU HÌNH TOASTER (Để hiển thị thông báo) --- */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Quản Lý Nhập Kho</h1>
            <p className="text-xs text-gray-500 mt-1">Quản lý số lượng và giá vốn sản phẩm</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all font-semibold flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nhập Hàng
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
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
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-gray-500 font-mono">#{item.id}</td>
                  <td className="p-4 font-semibold text-gray-800">
                    {item.product?.name || <span className="text-red-400 italic bg-red-50 px-2 py-1 rounded">Đã xóa SP</span>}
                  </td>
                  <td className="p-4">
                     {item.product?.thumbnail ? (
                        <img 
                            src={item.product.thumbnail.includes('http') ? item.product.thumbnail : `http://localhost:8000/storage/${item.product.thumbnail}`} 
                            alt="img" 
                            className="w-12 h-12 object-cover rounded-lg border shadow-sm"
                        />
                     ) : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">No img</div>}
                  </td>
                  <td className="p-4 text-right font-bold text-gray-700">
                    {formatMoney(item.price_root)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`py-1 px-3 rounded-full font-bold text-xs ${item.qty > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.qty}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.status === 1 ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Hoạt động
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-bold text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span> Ẩn
                        </span>
                    )}
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition tooltip"
                      title="Chỉnh sửa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                      title="Xóa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-500 flex flex-col items-center">
                   <span className="text-4xl mb-2">📦</span>
                   <span className="text-sm">Chưa có phiếu nhập kho nào.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL FORM ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? "✏️ Cập Nhật Kho Hàng" : "📦 Nhập Hàng Mới"}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-red-500 transition text-2xl leading-none">&times;</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sản phẩm <span className="text-red-500">*</span></label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-shadow disabled:bg-gray-100 disabled:text-gray-500"
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  required
                  disabled={isEditing}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá Nhập (VNĐ) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      value={formData.price_root}
                      onChange={(e) => setFormData({ ...formData, price_root: e.target.value })}
                      placeholder="0"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số lượng <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                      placeholder="0"
                      required
                      min="1"
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
                <select
                   className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   value={formData.status}
                   onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                    <option value="1">Hiện (Hoạt động)</option>
                    <option value="0">Ẩn (Tạm ngưng)</option>
                </select>
              </div>

              {/* Footer */}
              <div className="pt-4 flex justify-end gap-3 border-t mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
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