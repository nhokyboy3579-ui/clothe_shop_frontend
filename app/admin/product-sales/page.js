// app/admin/product-sales/page.js

'use client';
import React, { useEffect, useState } from 'react';
// 1. IMPORT TOASTER & SWEETALERT
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

import Pagination from '@/components/Pagination'; 
import { fetchSaleData, saveSale, deleteSale, fetchProductsForDropdown } from '@/services/admin/ProductSaleService'; 

export default function AdminProductSales() {
  const [sales, setSales] = useState([]);
  const [productsDropdown, setProductsDropdown] = useState([]); 
  const [allProducts, setAllProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState(''); 
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1); 
  const itemsPerPage = 10; 

  // --- STATE MODAL & FORM ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [currentSaleProduct, setCurrentSaleProduct] = useState(null);

  // --- HELPER DATE FUNCTIONS ---
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getNextWeekString = () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
  };
  const formatDateInput = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toISOString().split('T')[0];
  };
  const formatDateDisplay = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('vi-VN'); 
  };

  const initialForm = {
    product_id: '',
    price_sale: '',
    date_begin: getTodayString(),
    date_end: getNextWeekString(),
    status: '1', 
  };
  const [formData, setFormData] = useState(initialForm);

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // --- DEBOUNCE SEARCH ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if(searchTerm !== '') setCurrentPage(1);
    }, 600); 

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 1. Load dữ liệu
  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, allProductsRes] = await Promise.all([
          fetchSaleData({ page: currentPage, limit: itemsPerPage, search: debouncedSearchTerm }),
          fetchProductsForDropdown()
      ]);
      
      const salesData = salesRes.data || salesRes;
      setSales(salesData); 
      setLastPage(salesRes.last_page || 1);
      setAllProducts(allProductsRes);
      
      const existingProductIds = salesData.map(s => s.product_id);
      const availableProducts = allProductsRes.filter(p => !existingProductIds.includes(p.id));
      setProductsDropdown(availableProducts);

    } catch (error) {
      toast.error(error.message || 'Lỗi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchData(); 
  }, [currentPage, debouncedSearchTerm]);

  // --- HANDLERS ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setCurrentSaleProduct(null);
    setFormData(initialForm);
    setValidationErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (sale) => {
    setIsEditing(true);
    setEditId(sale.id);
    
    const fullProductInfo = allProducts.find(p => p.id === sale.product_id);
    setCurrentSaleProduct(fullProductInfo);

    setFormData({
      product_id: String(sale.product_id),
      price_sale: sale.price_sale,
      date_begin: formatDateInput(sale.date_begin),
      date_end: formatDateInput(sale.date_end),
      status: String(sale.status),
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});

    const payload = {
        product_id: parseInt(formData.product_id),
        price_sale: parseFloat(formData.price_sale),
        date_begin: formData.date_begin,
        date_end: formData.date_end,
        status: parseInt(formData.status),
    };

    let currentPrice;
    if (isEditing) {
        currentPrice = currentSaleProduct?.price_buy;
    } else {
        currentPrice = allProducts.find(p => String(p.id) === formData.product_id)?.price_buy;
    }
    
    if (currentPrice !== undefined && payload.price_sale >= currentPrice) {
        toast.error(`Giá giảm phải nhỏ hơn giá gốc (${formatCurrency(currentPrice)})`);
        setIsSubmitting(false);
        return;
    }

    // Hiển thị loading toast
    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm mới...');

    try {
      await saveSale(payload, isEditing ? editId : null);
      
      // Thông báo thành công
      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm mới thành công!', { id: toastId });
      
      setShowModal(false);
      if (!isEditing) setCurrentPage(1);
      fetchData(); 

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
      text: "Bạn muốn xóa chương trình giảm giá này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteSale(id); 
          
          Swal.fire(
            'Đã xóa!',
            'Chương trình giảm giá đã được xóa.',
            'success'
          );
          
          fetchData(); 
        } catch (error) { 
          Swal.fire(
            'Lỗi!',
            error.message || 'Không thể xóa.',
            'error'
          );
        }
      }
    });
  };

  const SaleTable = ({ data }) => (
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
        <tr>
          <th className="p-4">ID</th>
          <th className="p-4">Sản phẩm</th>
          <th className="p-4 text-right">Giá gốc</th>
          <th className="p-4 text-right">Giá giảm</th>
          <th className="p-4 text-center">Thời gian</th>
          <th className="p-4 text-center">Trạng thái</th>
          <th className="p-4 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-sm">
        {data.map(s => {
            const product = s.product;
            const currentPrice = product?.price_buy || 0;
            const now = new Date();
            const start = new Date(s.date_begin);
            const end = new Date(s.date_end);
            const isActiveTime = now >= start && now <= end;
            const isActive = s.status === 1 && isActiveTime;

            return (
                <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono">{s.id}</td>
                    <td className="p-4 font-bold text-gray-800">{product ? product.name : 'SP đã xóa'}</td>
                    <td className="p-4 text-right line-through text-gray-400">{formatCurrency(currentPrice)}</td>
                    <td className="p-4 text-right font-bold text-red-600">{formatCurrency(s.price_sale)}</td>
                    <td className="p-4 text-xs text-center text-gray-600">
                        {formatDateDisplay(s.date_begin)} - {formatDateDisplay(s.date_end)}
                    </td>
                    <td className="p-4 text-center">
                        {isActive 
                          ? <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded border border-green-200">Đang chạy</span> 
                          : <span className="text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded border border-gray-200">Hết hạn/Ẩn</span>
                        }
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                        <button type="button" onClick={() => handleOpenEdit(s)} className="text-blue-600 font-bold mr-3 hover:bg-blue-50 p-2 rounded transition">Sửa</button>
                        <button type="button" onClick={() => handleDelete(s.id)} className="text-red-600 font-bold hover:bg-red-50 p-2 rounded transition">Xóa</button>
                    </td>
                </tr>
            );
        })}
      </tbody>
    </table>
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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 uppercase">Quản lý Giảm giá</h2>
        <button onClick={handleOpenAdd} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 shadow flex items-center gap-2">
          <span>+</span> Thêm Giảm giá
        </button>
      </div>
      
      {/* KHU VỰC TÌM KIẾM */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <input
              type="text" 
              placeholder="Tìm kiếm theo tên sản phẩm..."
              className="w-full sm:w-80 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <div className="text-sm text-gray-600 font-medium">
              Tổng số: {sales.length} | Trang {currentPage} / {lastPage}
          </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-red-500 min-h-[200px]">
        {loading ? (
           <div className="p-10 text-center flex flex-col items-center justify-center h-48 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
              Đang tải dữ liệu...
           </div>
        ) : sales.length === 0 ? (
            <div className="p-10 text-center text-gray-500 italic flex flex-col items-center">
                <span className="text-4xl mb-2">🏷️</span>
                <p>Không tìm thấy chương trình giảm giá nào.</p>
            </div>
        ) : (
            <SaleTable data={sales} />
        )}
      </div>
      
      {/* PHÂN TRANG */}
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden transform transition-all max-h-[90vh] overflow-y-auto">
            
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0">
              <h3 className="font-bold text-lg uppercase">{isEditing ? 'Cập nhật giảm giá' : 'Thêm mới giảm giá'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-300 transition">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                
                {/* Product Dropdown */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Sản phẩm áp dụng (*)</label>
                  <select name="product_id" className="w-full border p-2.5 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none" required 
                    value={formData.product_id} 
                    onChange={(e) => {
                        setFormData({...formData, product_id: e.target.value});
                        if (validationErrors.product_id) setValidationErrors({});
                    }} 
                    disabled={isEditing} 
                  >
                    <option value="">-- Chọn Sản phẩm --</option>
                    
                    {isEditing && currentSaleProduct && (
                        <option key={currentSaleProduct.id} value={currentSaleProduct.id}>
                            {currentSaleProduct.name} (Giá gốc: {formatCurrency(currentSaleProduct.price_buy)})
                        </option>
                    )}
                    
                    {!isEditing && productsDropdown.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} (Giá gốc: {formatCurrency(p.price_buy)})
                        </option>
                    ))}
                  </select>
                  {validationErrors.product_id && <p className="text-red-500 text-xs mt-1">{validationErrors.product_id[0]}</p>}
                </div>
                
                {/* Sale Price */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Giá giảm (VND) (*)</label>
                  <input type="number" step="1000" min="0" name="price_sale" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none" required 
                    value={formData.price_sale} onChange={(e) => setFormData({...formData, price_sale: e.target.value})} placeholder="VD: 99000" />
                  {validationErrors.price_sale && <p className="text-red-500 text-xs mt-1">{validationErrors.price_sale[0]}</p>}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Ngày Bắt đầu</label>
                        <input type="date" name="date_begin" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none" required 
                            value={formData.date_begin} onChange={(e) => setFormData({...formData, date_begin: e.target.value})} />
                        {validationErrors.date_begin && <p className="text-red-500 text-xs mt-1">{validationErrors.date_begin[0]}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Ngày Kết thúc</label>
                        <input type="date" name="date_end" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none" required 
                            value={formData.date_end} onChange={(e) => setFormData({...formData, date_end: e.target.value})} />
                        {validationErrors.date_end && <p className="text-red-500 text-xs mt-1">{validationErrors.date_end[0]}</p>}
                    </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Trạng thái</label>
                  <select name="status" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="1">Active (Kích hoạt)</option>
                    <option value="0">Draft (Tạm ẩn)</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded font-bold transition">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-lg transition disabled:bg-gray-400">
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