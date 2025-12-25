'use client';
import { useEffect, useState, useMemo } from 'react';
// 1. IMPORT TOASTER & SWEETALERT
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2'; 

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/axios'; 
import { fetchOrders, fetchOrderDetail, createOrder, updateOrderStatus, deleteOrder } from '@/services/admin/OrderService'; 
import Pagination from '@/components/Pagination'; 

export default function AdminOrders() {
  const [allOrders, setAllOrders] = useState([]); // Lưu TẤT CẢ đơn hàng
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 
  const [totalPages, setTotalPages] = useState(1); 
  
  // --- STATE MODAL CHI TIẾT & CẬP NHẬT TRẠNG THÁI ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // --- STATE MODAL TẠO MỚI ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const initialCreateForm = {
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    note: '',
    payment_method: 'COD',
    shipping_fee: 0,
    details: [], 
  };
  const [createFormData, setCreateFormData] = useState(initialCreateForm);
  const [createErrors, setCreateErrors] = useState({});

  // Sản phẩm đang được chọn
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(0);


  // Định nghĩa các trạng thái cho Dropdown
  const STATUS_OPTIONS = [
    { code: 1, name: 'Mới / Chờ xác nhận', color: 'blue' },
    { code: 2, name: 'Đang xử lý', color: 'yellow' },
    { code: 3, name: 'Đang giao hàng', color: 'indigo' },
    { code: 4, name: 'Hoàn thành', color: 'green' },
    { code: 5, name: 'Đã hủy', color: 'red' },
  ];

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

  // Tính toán lại Subtotal và Total Amount
  const totals = useMemo(() => {
    const subtotal = createFormData.details.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = parseFloat(createFormData.shipping_fee) || 0;
    const totalAmount = subtotal + shippingFee;
    return { subtotal, totalAmount };
  }, [createFormData.details, createFormData.shipping_fee]);


  // 2. FETCH DATA ĐỊA CHỈ (API OPEN)
  const [address, setAddress] = useState({ province: '', district: '', ward: '', detail: '' });
  const [locations, setLocations] = useState({ provinces: [], districts: [], wards: [] }); 

  useEffect(() => {
      fetch('https://provinces.open-api.vn/api/?depth=1')
          .then(res => res.json())
          .then(data => setLocations(prev => ({ ...prev, provinces: data })))
          .catch(err => console.error("Lỗi tải Tỉnh/Thành:", err));
  }, []);

  const handleProvinceChange = (e) => {
      const code = e.target.value;
      setAddress({ ...address, province: code, district: '', ward: '' });
      setLocations(prev => ({ ...prev, districts: [], wards: [] }));
      if (code) {
          fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
              .then(res => res.json())
              .then(data => setLocations(prev => ({ ...prev, districts: data.districts })))
              .catch(err => console.error("Lỗi tải Quận/Huyện:", err));
      }
  };

  const handleDistrictChange = (e) => {
      const code = e.target.value;
      setAddress({ ...address, district: code, ward: '' });
      if (code) {
          fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
              .then(res => res.json())
              .then(data => setLocations(prev => ({ ...prev, wards: data.wards })))
              .catch(err => console.error("Lỗi tải Phường/Xã:", err));
      }
  };


  // 1. Load danh sách đơn hàng và Sản phẩm
  const fetchOrdersAndProducts = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetchOrders(),
        api.get('/admin/products') 
      ]);
      setAllOrders(ordersRes);
      setProducts(productsRes.data); 
    } catch (error) {
      toast.error(error.message || 'Lỗi tải dữ liệu đơn hàng hoặc sản phẩm');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchOrdersAndProducts(); }, []);
  
  // Logic Phân trang Client-side
  const { paginatedOrders, totalPages: calculatedTotalPages } = useMemo(() => {
    const totalItems = allOrders.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
        setCurrentPage(1);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = allOrders.slice(startIndex, startIndex + itemsPerPage);

    setTotalPages(totalPages); 
    return { paginatedOrders, totalPages };
  }, [allOrders, currentPage]);


  // --- HANDLERS TẠO ĐƠN HÀNG ---

  const handleOpenCreate = () => {
    setCreateFormData(initialCreateForm);
    setCreateErrors({});
    setSelectedProductId('');
    setSelectedQuantity(1);
    setSelectedPrice(0);
    setAddress({ province: '', district: '', ward: '', detail: '' }); 
    setShowCreateModal(true);
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    
    const product = products.find(p => String(p.id) === productId);
    if (product) {
      setSelectedPrice(product.price || 0);
      setSelectedQuantity(1);
    }
  };

  const handleAddProductToOrder = () => {
    if (!selectedProductId || selectedQuantity <= 0 || selectedPrice <= 0) {
      return toast.error("Vui lòng chọn sản phẩm, giá và số lượng hợp lệ.");
    }
    
    const product = products.find(p => String(p.id) === selectedProductId);
    if (!product) return;

    const newItem = {
      product_id: parseInt(selectedProductId),
      product_name: product.name,
      price: parseFloat(selectedPrice),
      quantity: parseInt(selectedQuantity),
      variant: null, 
    };

    setCreateFormData(prev => ({
      ...prev,
      details: [...prev.details, newItem]
    }));
    
    setSelectedProductId('');
    setSelectedQuantity(1);
    setSelectedPrice(0);
  };

  const handleRemoveProductFromOrder = (index) => {
    setCreateFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };


  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateErrors({});
    
    const provinceName = locations.provinces.find(p => p.code == address.province)?.name;
    const districtName = locations.districts.find(d => d.code == address.district)?.name;
    const wardName = locations.wards.find(w => w.code == address.ward)?.name;
    const fullShippingAddress = `${address.detail}, ${wardName}, ${districtName}, ${provinceName}`;


    if (!address.province || !address.detail || createFormData.details.length === 0) {
        toast.error("Vui lòng điền đủ địa chỉ và thêm ít nhất một sản phẩm.");
        setIsCreating(false);
        return;
    }

    const payload = {
        ...createFormData,
        shipping_fee: parseFloat(createFormData.shipping_fee) || 0,
        subtotal: totals.subtotal,
        total_amount: totals.totalAmount,
        shipping_address: fullShippingAddress, 
        details: createFormData.details.map(d => ({
            product_id: d.product_id,
            quantity: d.quantity,
            price: d.price,
            variant: d.variant,
        }))
    };

    // Hiển thị loading toast
    const toastId = toast.loading('Đang tạo đơn hàng...');

    try {
      await createOrder(payload);
      
      toast.success('Tạo đơn hàng thành công!', { id: toastId });
      setShowCreateModal(false);
      setCurrentPage(1);
      fetchOrdersAndProducts(); 

    } catch (error) {
      const errors = error.response?.data?.errors || {};
      setCreateErrors(errors);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn.';
      toast.error(msg, { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };


  // --- HANDLERS XEM CHI TIẾT VÀ CẬP NHẬT TRẠNG THÁI ---

  const handleViewDetails = async (orderId) => {
    try {
      const res = await fetchOrderDetail(orderId); 
      setCurrentOrder(res);
      setNewStatus(String(res.status));
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Không tìm thấy chi tiết đơn hàng.');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!currentOrder || !newStatus) return;
    
    setIsUpdating(true);
    const toastId = toast.loading('Đang cập nhật trạng thái...');

    try {
      await updateOrderStatus(currentOrder.id, newStatus); 

      toast.success('Cập nhật trạng thái thành công!', { id: toastId });
      setShowDetailModal(false);
      fetchOrdersAndProducts(); 

    } catch (error) {
      const msg = error.response?.data?.message || 'Cập nhật trạng thái thất bại.';
      toast.error(msg, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  // --- XỬ LÝ XÓA VỚI SWEETALERT2 ---
  const handleDeleteOrder = async (orderId) => {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Bạn có chắc chắn muốn xóa mềm đơn hàng này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteOrder(orderId); 
          
          Swal.fire(
            'Đã xóa!',
            'Đơn hàng đã được xóa thành công.',
            'success'
          );
          
          fetchOrdersAndProducts();
        } catch (error) { 
          Swal.fire(
            'Lỗi!',
            'Không thể xóa đơn hàng này.',
            'error'
          );
        }
      }
    });
  };


  // Hàm render bảng đơn hàng
  const OrderTable = ({ data, onView, onDelete }) => (
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
        <tr>
          <th className="p-4">ID</th>
          <th className="p-4">Khách hàng</th>
          <th className="p-4">Tổng tiền</th>
          <th className="p-4">Phương thức</th>
          <th className="p-4">Trạng thái</th>
          <th className="p-4">Ngày đặt</th>
          <th className="p-4 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-sm">
        {data.map(order => {
            const statusInfo = STATUS_OPTIONS.find(s => s.code === order.status_code);
            const statusColor = statusInfo ? `bg-${statusInfo.color}-100 text-${statusInfo.color}-800` : 'bg-gray-100 text-gray-800';

            return (
                <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono">{order.id}</td>
                    <td className="p-4">
                        <p className="font-bold">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.user_info}</p>
                    </td>
                    <td className="p-4 font-bold text-red-600">{formatCurrency(order.total_amount)}</td>
                    <td className="p-4">{order.payment_method}</td>
                    <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor}`}>
                            {order.status_name}
                        </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{order.created_at}</td>
                    <td className="p-4 text-center whitespace-nowrap">
                        <button onClick={() => onView(order.id)} className="text-blue-600 font-bold mr-3 hover:bg-blue-50 p-2 rounded transition">Chi tiết</button>
                        <button onClick={() => onDelete(order.id)} className="text-red-600 font-bold hover:bg-red-50 p-2 rounded transition">Xóa</button>
                    </td>
                </tr>
            );
        })}
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
        <h2 className="text-2xl font-bold text-gray-800 uppercase">Quản lý Đơn hàng</h2>
        <button onClick={handleOpenCreate} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 shadow flex items-center gap-2">
          <span>+</span> Tạo Đơn hàng mới (Admin)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-indigo-500 min-h-[200px]">
        {allOrders.length === 0 && !loading ? (
              <div className="p-10 text-center text-gray-500 italic flex flex-col items-center">
                  <span className="text-4xl mb-2">🛒</span>
                  <p>Không có đơn hàng nào.</p>
              </div>
        ) : (
            <OrderTable data={paginatedOrders} onView={handleViewDetails} onDelete={handleDeleteOrder} />
        )}
      </div>
      
      {/* KHU VỰC PHÂN TRANG */}
      <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
      />


      {/* --- MODAL TẠO ĐƠN HÀNG MỚI (FIXED WIDTH) --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden max-h-[95vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-green-700 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">Tạo Đơn hàng mới từ Admin</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-2xl hover:text-gray-200 transition">&times;</button>
            </div>
            
            <form onSubmit={handleCreateOrderSubmit}>
                {/* FIX: Bố cục lưới 2 cột */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Cột 1: Thông tin Khách hàng */}
                    <div className="md:col-span-1 border-r md:pr-6">
                        <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Thông tin Khách hàng</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-bold mb-1">Tên Khách hàng (*)</label>
                                <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none transition" required 
                                    value={createFormData.customer_name} onChange={(e) => setCreateFormData({...createFormData, customer_name: e.target.value})} />
                                {createErrors.customer_name && <p className="text-red-500 text-xs mt-1">{createErrors.customer_name[0]}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Email (Tùy chọn)</label>
                                <input type="email" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none transition" 
                                    value={createFormData.customer_email} onChange={(e) => setCreateFormData({...createFormData, customer_email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Điện thoại (*)</label>
                                <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none transition" required 
                                    value={createFormData.customer_phone} onChange={(e) => setCreateFormData({...createFormData, customer_phone: e.target.value})} />
                                {createErrors.customer_phone && <p className="text-red-500 text-xs mt-1">{createErrors.customer_phone[0]}</p>}
                            </div>
                            
                            {/* CASCADING DROPDOWNS ĐỊA CHỈ */}
                            <h5 className="text-sm font-bold pt-2">Địa chỉ giao hàng (*)</h5>
                            <div className="grid grid-cols-3 gap-2">
                                <select className="border border-gray-300 p-2 rounded text-sm focus:border-black focus:ring-1 focus:ring-black outline-none" value={address.province} onChange={handleProvinceChange}>
                                    <option value="">Tỉnh/Thành</option>
                                    {locations.provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                </select>
                                <select className="border border-gray-300 p-2 rounded text-sm focus:border-black focus:ring-1 focus:ring-black outline-none" value={address.district} onChange={handleDistrictChange} disabled={!address.province}>
                                    <option value="">Quận/Huyện</option>
                                    {locations.districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                </select>
                                <select className="border border-gray-300 p-2 rounded text-sm focus:border-black focus:ring-1 focus:ring-black outline-none" value={address.ward} onChange={(e) => setAddress({...address, ward: e.target.value})} disabled={!address.district}>
                                    <option value="">Phường/Xã</option>
                                    {locations.wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                </select>
                            </div>
                            {/* Địa chỉ cụ thể */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Địa chỉ cụ thể *</label>
                                <input 
                                    type="text" 
                                    className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none transition"
                                    placeholder="Số nhà, tên đường..."
                                    value={address.detail}
                                    onChange={(e) => setAddress({...address, detail: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Ghi chú</label>
                                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none transition" rows="2"
                                    value={createFormData.note} onChange={(e) => setCreateFormData({...createFormData, note: e.target.value})}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Cột 2: Chi tiết Sản phẩm & Tổng kết */}
                    <div className="md:col-span-1">
                        <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Sản phẩm & Tổng kết</h4>
                        
                        {/* Khu vực Chọn Sản phẩm */}
                        <div className="flex gap-2 items-end mb-4 bg-gray-50 p-3 rounded border">
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1">Chọn Sản phẩm</label>
                                <select className="w-full border p-2 rounded focus:ring-1 focus:ring-green-500 outline-none" value={selectedProductId} onChange={handleProductSelect}>
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price_buy || 0)})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-bold mb-1">Giá bán</label>
                                <input type="number" step="1000" min="0" className="w-full border p-2 rounded focus:ring-1 focus:ring-green-500 outline-none"
                                    value={selectedPrice} onChange={(e) => setSelectedPrice(parseFloat(e.target.value) || 0)}
                                    disabled={!selectedProductId} />
                            </div>
                            <div className="w-20">
                                <label className="block text-xs font-bold mb-1">SL</label>
                                <input type="number" min="1" className="w-full border p-2 rounded focus:ring-1 focus:ring-green-500 outline-none"
                                    value={selectedQuantity} onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                                    disabled={!selectedProductId} />
                            </div>
                            <button type="button" onClick={handleAddProductToOrder} disabled={!selectedProductId || selectedQuantity <= 0} className="bg-indigo-600 text-white p-2 rounded h-[42px] hover:bg-indigo-700 disabled:bg-indigo-300 transition shadow">
                                Thêm
                            </button>
                        </div>
                        {createErrors['details'] && <p className="text-red-500 text-sm italic mb-3">{createErrors['details'][0]}</p>}

                        {/* Bảng Chi tiết Đơn hàng (Giỏ hàng tạm) */}
                        <div className="max-h-48 overflow-y-auto border rounded mb-4 custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-200 sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left w-1/2">Sản phẩm</th>
                                        <th className="p-2 text-right">Giá</th>
                                        <th className="p-2 text-right">SL</th>
                                        <th className="p-2 text-right">Tổng</th>
                                        <th className="p-2 text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {createFormData.details.map((item, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-semibold">{item.product_name}</td>
                                            <td className="p-2 text-right text-sm">{formatCurrency(item.price)}</td>
                                            <td className="p-2 text-right">{item.quantity}</td>
                                            <td className="p-2 text-right font-bold text-red-600">{formatCurrency(item.price * item.quantity)}</td>
                                            <td className="p-2 text-center">
                                                <button type="button" onClick={() => handleRemoveProductFromOrder(index)} className="text-red-500 hover:text-red-700 font-bold px-2">
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {createFormData.details.length === 0 && (
                                        <tr><td colSpan="5" className="text-center p-4 text-gray-500 italic">Chưa có sản phẩm nào được thêm.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Tóm tắt Tài chính */}
                        <div className="p-3 border rounded bg-gray-100 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Tổng tiền hàng:</span>
                                <span className="font-bold">{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Phí vận chuyển:</span>
                                <input type="number" min="0" className="w-32 border p-1 rounded text-right font-bold text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                    value={createFormData.shipping_fee} 
                                    onChange={(e) => setCreateFormData({...createFormData, shipping_fee: parseFloat(e.target.value) || 0})}
                                />
                                
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                                <span className="text-lg font-extrabold">TỔNG THANH TOÁN:</span>
                                <span className="text-xl font-extrabold text-red-600">{formatCurrency(totals.totalAmount)}</span>
                            </div>
                            {createErrors.shipping_fee && <p className="text-red-500 text-xs mt-1">{createErrors.shipping_fee[0]}</p>}
                        </div>

                        <div className="mt-4 space-y-3">
                                <label className="block text-sm font-bold mb-1">Phương thức Thanh toán</label>
                            <select className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                value={createFormData.payment_method} 
                                onChange={(e) => setCreateFormData({...createFormData, payment_method: e.target.value})}
                            >
                                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                                <option value="BANKING">Chuyển khoản Ngân hàng</option>
                                <option value="MOMO">Ví Momo</option>
                            </select>
                            {createErrors.payment_method && <p className="text-red-500 text-xs mt-1">{createErrors.payment_method[0]}</p>}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t sticky bottom-0 bg-white shadow-inner">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-bold transition">Hủy</button>
                    <button type="submit" disabled={isCreating} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow disabled:bg-green-400 transition">
                        {isCreating ? 'Đang tạo...' : 'Xác nhận Tạo Đơn hàng'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG (Giữ nguyên) --- */}
      {showDetailModal && currentOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-indigo-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">Chi tiết đơn hàng #{currentOrder.id}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-2xl hover:text-gray-300 transition">&times;</button>
            </div>
            
            <div className="p-6">
                
                {/* THÔNG TIN KHÁCH HÀNG & TÀI CHÍNH */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-4 border-b">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Khách hàng</p>
                        <p className="font-semibold">{currentOrder.customer_name}</p>
                        <p className="text-sm">{currentOrder.customer_phone}</p>
                        <p className="text-xs text-gray-500">{currentOrder.customer_email}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Địa chỉ giao hàng</p>
                        <p className="text-sm">{currentOrder.shipping_address}</p>
                        <p className="text-xs text-gray-500 mt-2">Ghi chú: {currentOrder.note || 'Không'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase">Tổng thanh toán</p>
                        <p className="text-2xl font-extrabold text-red-600">{formatCurrency(currentOrder.total_amount)}</p>
                        <p className="text-xs text-gray-500">Phí ship: {formatCurrency(currentOrder.shipping_fee)}</p>
                    </div>
                </div>

                {/* BẢNG CHI TIẾT SẢN PHẨM */}
                <h4 className="font-bold text-gray-800 mb-3">Sản phẩm đã đặt ({currentOrder.details.length})</h4>
                <table className="w-full text-left mb-6 border rounded overflow-hidden">
                    <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-600">
                        <tr>
                            <th className="p-3 border-b">Sản phẩm</th>
                            <th className="p-3 border-b text-right">Giá / SL</th>
                            <th className="p-3 border-b text-right">Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrder.details.map(detail => (
                            <tr key={detail.id} className="border-b hover:bg-gray-50 last:border-b-0">
                                <td className="p-3">
                                    <p className="font-semibold">{detail.product_name}</p>
                                    <p className="text-xs text-gray-500">Variant: {detail.variant ? JSON.parse(detail.variant).Size : 'N/A'}</p>
                                </td>
                                <td className="p-3 text-right text-sm">
                                    {formatCurrency(detail.price)} x {detail.quantity}
                                </td>
                                <td className="p-3 text-right font-bold text-red-600">
                                    {formatCurrency(detail.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* KHU VỰC CẬP NHẬT TRẠNG THÁI */}
                <form onSubmit={handleUpdateStatus} className="flex justify-end items-center gap-3 pt-4 border-t bg-gray-50 p-4 rounded-b-lg -m-6 mt-0">
                    <label className="text-sm font-bold text-gray-700">Cập nhật trạng thái:</label>
                    <select 
                        className="border p-2 rounded w-48 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        disabled={isUpdating}
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s.code} value={s.code}>{s.name}</option>
                        ))}
                    </select>
                    <button type="submit" disabled={isUpdating} className="px-6 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow disabled:bg-gray-400 transition">
                        {isUpdating ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
                    </button>
                </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}