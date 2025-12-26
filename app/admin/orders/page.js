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
  const [allOrders, setAllOrders] = useState([]); 
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
      setLoading(true);
      const [ordersRes, productsRes] = await Promise.all([
        fetchOrders(),
        api.get('/admin/products?limit=999') 
      ]);
      setAllOrders(ordersRes);
      // Xử lý trường hợp API products bọc trong data.data
      setProducts(productsRes.data.data || productsRes.data || []); 
    } catch (error) {
      toast.error('Lỗi tải dữ liệu đơn hàng hoặc sản phẩm');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchOrdersAndProducts(); }, []);
  
  // Logic Phân trang Client-side
  const paginatedOrders = useMemo(() => {
    const totalItems = allOrders.length;
    const pages = Math.ceil(totalItems / itemsPerPage) || 1;
    setTotalPages(pages);

    // Reset về trang 1 nếu trang hiện tại vượt quá tổng số trang mới
    if (currentPage > pages && pages > 0) {
        setCurrentPage(pages);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    return allOrders.slice(startIndex, startIndex + itemsPerPage);
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
    if (!selectedProductId || selectedQuantity <= 0) {
      return toast.error("Vui lòng chọn sản phẩm và số lượng hợp lệ.");
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
    setCreateErrors({});
    
    // Gom địa chỉ
    const provinceName = locations.provinces.find(p => p.code == address.province)?.name || '';
    const districtName = locations.districts.find(d => d.code == address.district)?.name || '';
    const wardName = locations.wards.find(w => w.code == address.ward)?.name || '';
    const fullShippingAddress = `${address.detail}, ${wardName}, ${districtName}, ${provinceName}`;

    if (!address.province || !address.detail || createFormData.details.length === 0) {
        toast.error("Vui lòng điền đủ địa chỉ và thêm ít nhất một sản phẩm.");
        return;
    }

    setIsCreating(true);
    const toastId = toast.loading('Đang tạo đơn hàng...');

    const payload = {
        customer_name: createFormData.customer_name,
        customer_email: createFormData.customer_email,
        customer_phone: createFormData.customer_phone,
        note: createFormData.note,
        payment_method: createFormData.payment_method,
        shipping_fee: parseFloat(createFormData.shipping_fee) || 0,
        subtotal: totals.subtotal,
        total_amount: totals.totalAmount,
        shipping_address: fullShippingAddress, 
        details: createFormData.details.map(d => ({
            product_id: d.product_id,
            quantity: d.quantity,
            price: d.price,
            variant: d.variant || null,
        }))
    };

    try {
      await createOrder(payload);
      toast.success('Tạo đơn hàng thành công!', { id: toastId });
      setShowCreateModal(false);
      setCurrentPage(1);
      fetchOrdersAndProducts(); 
    } catch (error) {
      const errors = error.response?.data?.errors || {};
      setCreateErrors(errors);
      const msg = error.response?.data?.message || 'Lỗi server (500). Vui lòng kiểm tra lại dữ liệu.';
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
      text: "Bạn có chắc chắn muốn xóa đơn hàng này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteOrder(orderId); 
          Swal.fire('Đã xóa!', 'Đơn hàng đã được xóa thành công.', 'success');
          fetchOrdersAndProducts();
        } catch (error) { 
          Swal.fire('Lỗi!', 'Không thể xóa đơn hàng này.', 'error');
        }
      }
    });
  };


  // Hàm render bảng đơn hàng
  const OrderTable = ({ data, onView, onDelete }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50/80 text-[10px] uppercase font-bold tracking-wider text-gray-500 border-b">
          <tr>
            <th className="p-4">Mã đơn</th>
            <th className="p-4">Khách hàng</th>
            <th className="p-4">Tổng tiền</th>
            <th className="p-4">Phương thức</th>
            <th className="p-4 text-center">Trạng thái</th>
            <th className="p-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y text-sm">
          {data.map(order => {
              const statusInfo = STATUS_OPTIONS.find(s => s.code === order.status_code);
              const colorBase = statusInfo?.color || 'gray';
              
              const statusClasses = {
                blue: 'bg-blue-50 text-blue-700 border-blue-200',
                yellow: 'bg-amber-50 text-amber-700 border-amber-200',
                indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                red: 'bg-rose-50 text-rose-700 border-rose-200',
                gray: 'bg-gray-50 text-gray-700 border-gray-200'
              };

              return (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4 font-mono text-gray-500 font-medium">#{order.id}</td>
                      <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{order.customer_name}</span>
                            <span className="text-[11px] text-gray-400">{order.user_info}</span>
                          </div>
                      </td>
                      <td className="p-4 font-bold text-indigo-600">{formatCurrency(order.total_amount)}</td>
                      <td className="p-4 text-gray-600 font-medium">{order.payment_method}</td>
                      <td className="p-4 text-center">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border shadow-sm ${statusClasses[colorBase]}`}>
                              {order.status_name}
                          </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap space-x-2">
                          <button onClick={() => onView(order.id)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm">Chi tiết</button>
                          <button onClick={() => onDelete(order.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg font-bold text-xs hover:bg-rose-600 hover:text-white transition-all shadow-sm">Xóa</button>
                      </td>
                  </tr>
              );
          })}
        </tbody>
      </table>
    </div>
  );


  if (loading) return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu đơn hàng...</p>
      </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <Toaster position="top-right" reverseOrder={false} />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Quản lý Đơn hàng</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider italic">Real-time Order Monitoring</span>
          </div>
        </div>
        <button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2">
          <span className="text-xl">+</span> <span className="uppercase text-sm tracking-wide">Tạo Đơn Admin</span>
        </button>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {allOrders.length === 0 && !loading ? (
              <div className="p-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl grayscale opacity-30">🛒</span>
                  </div>
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Không có dữ liệu đơn hàng</p>
              </div>
        ) : (
            <OrderTable data={paginatedOrders} onView={handleViewDetails} onDelete={handleDeleteOrder} />
        )}
      </div>
      
      {/* PAGINATION */}
      <div className="mt-8 flex justify-center">
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
        />
      </div>


      {/* --- MODAL TẠO ĐƠN HÀNG MỚI --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden max-h-[92vh] flex flex-col scale-100 transition-all border border-white/20">
            <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-xl tracking-tight uppercase italic">Khởi tạo vận đơn Admin</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1 opacity-70">Manual Order Creation System</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl transition-all">&times;</button>
            </div>
            
            <form onSubmit={handleCreateOrderSubmit} className="overflow-y-auto flex-1 p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    
                    {/* Cột 1: Thông tin Khách hàng */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                          <h4 className="font-black text-gray-800 uppercase text-xs tracking-widest">1. Thông tin khách hàng</h4>
                        </div>
                        
                        <div className="grid gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                            <div className="grid gap-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Họ tên người mua *</label>
                                <input type="text" className="w-full bg-white border-0 p-3 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition text-sm font-semibold" required 
                                    value={createFormData.customer_name} onChange={(e) => setCreateFormData({...createFormData, customer_name: e.target.value})} />
                                {createErrors.customer_name && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1 lowercase">{createErrors.customer_name[0]}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-1">
                                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Email</label>
                                  <input type="email" className="w-full bg-white border-0 p-3 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" 
                                      value={createFormData.customer_email} onChange={(e) => setCreateFormData({...createFormData, customer_email: e.target.value})} />
                              </div>
                              <div className="grid gap-1">
                                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Số điện thoại *</label>
                                  <input type="text" className="w-full bg-white border-0 p-3 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" required 
                                      value={createFormData.customer_phone} onChange={(e) => setCreateFormData({...createFormData, customer_phone: e.target.value})} />
                                  {createErrors.customer_phone && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1 lowercase">{createErrors.customer_phone[0]}</p>}
                              </div>
                            </div>
                            
                            <div className="grid gap-1 mt-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 italic border-b border-gray-200 pb-1 mb-2">Địa chỉ giao hàng (*)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <select className="bg-white border-0 p-3 rounded-2xl shadow-sm text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={address.province} onChange={handleProvinceChange}>
                                        <option value="">Tỉnh/Thành</option>
                                        {locations.provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                    <select className="bg-white border-0 p-3 rounded-2xl shadow-sm text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={address.district} onChange={handleDistrictChange} disabled={!address.province}>
                                        <option value="">Quận/Huyện</option>
                                        {locations.districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                    </select>
                                    <select className="bg-white border-0 p-3 rounded-2xl shadow-sm text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={address.ward} onChange={(e) => setAddress({...address, ward: e.target.value})} disabled={!address.district}>
                                        <option value="">Phường/Xã</option>
                                        {locations.wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div className="mt-2">
                                    <input 
                                        type="text" 
                                        className="w-full bg-white border-0 p-3 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"
                                        placeholder="Số nhà, tên đường cụ thể..."
                                        value={address.detail}
                                        onChange={(e) => setAddress({...address, detail: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Ghi chú vận chuyển</label>
                                <textarea className="w-full bg-white border-0 p-3 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold h-20"
                                    value={createFormData.note} onChange={(e) => setCreateFormData({...createFormData, note: e.target.value})}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Cột 2: Chi tiết Sản phẩm & Tổng kết */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4 py-1">
                          <h4 className="font-black text-gray-800 uppercase text-xs tracking-widest">2. Giỏ hàng sản phẩm</h4>
                        </div>
                        
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-5 bg-indigo-50/50 flex flex-wrap sm:flex-nowrap gap-2 items-end border-b border-indigo-100">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Chọn sản phẩm</label>
                                    <select className="w-full border-0 bg-white p-2.5 rounded-xl shadow-sm text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={selectedProductId} onChange={handleProductSelect}>
                                        <option value="">-- Tìm kiếm --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-16">
                                    <label className="text-[9px] font-black text-indigo-400 uppercase ml-1">SL</label>
                                    <input type="number" min="1" className="w-full border-0 bg-white p-2.5 rounded-xl shadow-sm text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={selectedQuantity} onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                                        disabled={!selectedProductId} />
                                </div>
                                <button type="button" onClick={handleAddProductToOrder} disabled={!selectedProductId} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black text-[10px] transition shadow-md shadow-indigo-100 active:scale-95 uppercase">Thêm</button>
                            </div>
                            
                            <div className="max-h-48 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-gray-50/30 shadow-inner">
                                {createFormData.details.length === 0 ? (
                                    <div className="py-10 text-center opacity-20 font-black italic uppercase text-3xl select-none">Cart is empty</div>
                                ) : createFormData.details.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-gray-800 text-xs">{item.product_name}</span>
                                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.quantity} × {formatCurrency(item.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-indigo-600 text-xs italic">{formatCurrency(item.price * item.quantity)}</span>
                                            <button type="button" onClick={() => handleRemoveProductFromOrder(index)} className="w-7 h-7 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center font-bold text-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm">&times;</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Financial Summary */}
                            <div className="p-6 bg-slate-900 text-white space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tổng tiền hàng</span>
                                    <span className="font-bold text-sm">{formatCurrency(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Phí vận chuyển (VND)</span>
                                    <input type="number" min="0" className="w-24 bg-white/10 border-0 p-1.5 rounded-lg text-right font-black text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none transition text-sm"
                                        value={createFormData.shipping_fee} 
                                        onChange={(e) => setCreateFormData({...createFormData, shipping_fee: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-black italic text-gray-400 uppercase tracking-tighter underline underline-offset-8 decoration-white/20">Tổng thanh toán:</span>
                                    <span className="text-3xl font-black text-white drop-shadow-md">{formatCurrency(totals.totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-3xl flex items-center gap-4 border border-indigo-100">
                          <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest shrink-0">Thanh toán:</label>
                          <select className="flex-1 bg-white border-0 p-2.5 rounded-xl text-xs font-black shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700"
                              value={createFormData.payment_method} 
                              onChange={(e) => setCreateFormData({...createFormData, payment_method: e.target.value})}
                          >
                              <option value="COD">💵 TIỀN MẶT (COD)</option>
                              <option value="BANKING">🏦 CHUYỂN KHOẢN</option>
                              <option value="MOMO">📱 VÍ MOMO</option>
                          </select>
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end gap-3 px-8 py-6 border-t bg-gray-50/50">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-2xl font-black text-xs uppercase transition tracking-widest">Hủy</button>
                    <button type="submit" disabled={isCreating} className="px-10 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all active:scale-95 disabled:bg-gray-300">
                        {isCreating ? 'Creating...' : 'Xác nhận tạo đơn'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG (LUXURY STYLE) --- */}
      {showDetailModal && currentOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col scale-100 border border-slate-100 transition-all">
            <div className="bg-slate-900 text-white p-8 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black italic shadow-lg shadow-indigo-600/30">#</div>
                <div>
                  <h3 className="font-black text-xl tracking-tighter uppercase italic">Vận đơn chi tiết</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Order ID: {currentOrder.id} • {currentOrder.created_at}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-3xl transition-all">&times;</button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
                
                {/* THÔNG TIN KHÁCH HÀNG & TÀI CHÍNH */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100">
                        <span className="absolute -top-3 -left-3 bg-indigo-600 text-white px-4 py-1 rounded-xl text-[9px] font-black italic shadow-lg shadow-indigo-100 uppercase tracking-widest">Người nhận</span>
                        <p className="font-black text-gray-800 text-base mb-1 mt-2">{currentOrder.customer_name}</p>
                        <p className="text-indigo-600 font-bold text-xs">{currentOrder.customer_phone}</p>
                        <p className="text-[11px] text-gray-400 font-medium lowercase tracking-tighter mt-1">{currentOrder.customer_email}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100">
                        <span className="absolute -top-3 -left-3 bg-emerald-500 text-white px-4 py-1 rounded-xl text-[9px] font-black italic shadow-lg shadow-emerald-100 uppercase tracking-widest">Địa chỉ</span>
                        <p className="text-xs leading-relaxed text-gray-600 font-medium mt-2 italic">"{currentOrder.shipping_address}"</p>
                        {currentOrder.note && <p className="text-[10px] text-amber-600 font-bold mt-3 bg-amber-50 p-2 rounded-xl border border-amber-100">💡 Ghi chú: {currentOrder.note}</p>}
                    </div>
                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden shadow-2xl shadow-indigo-200">
                        <div className="absolute top-0 right-0 p-10 opacity-10 font-black text-8xl italic select-none">$</div>
                        <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Giá trị đơn hàng</p>
                        <p className="text-4xl font-black italic drop-shadow-md">{formatCurrency(currentOrder.total_amount)}</p>
                        <div className="mt-4 flex gap-2">
                           <span className="bg-white/20 px-2 py-1 rounded-lg text-[9px] font-bold uppercase">Ship: {formatCurrency(currentOrder.shipping_fee)}</span>
                        </div>
                    </div>
                </div>

                {/* BẢNG CHI TIẾT SẢN PHẨM */}
                <div>
                  <h4 className="font-black text-gray-800 mb-4 text-xs uppercase tracking-widest border-l-4 border-indigo-500 pl-4">Sản phẩm đã đặt ({currentOrder.details.length})</h4>
                  <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                            <tr>
                                <th className="p-4">Mặt hàng</th>
                                <th className="p-4 text-center">Giá / SL</th>
                                <th className="p-4 text-right">Tổng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {currentOrder.details.map(detail => (
                                <tr key={detail.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800 text-sm">{detail.product_name}</p>
                                        {detail.variant && <p className="text-[10px] text-gray-400 italic">Phiên bản: {detail.variant}</p>}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-xs font-bold text-gray-500">{formatCurrency(detail.price)}</span>
                                        <span className="mx-2 text-gray-300">×</span>
                                        <span className="text-xs font-black text-gray-800">{detail.quantity}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-black text-indigo-600 text-xs italic">{formatCurrency(detail.total)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                </div>
                
                {/* KHU VỰC CẬP NHẬT TRẠNG THÁI */}
                <form onSubmit={handleUpdateStatus} className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-900 p-6 rounded-[2.5rem] shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none">Chỉnh sửa trạng thái đơn hàng:</label>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                      <select 
                          className="border-0 bg-slate-800 text-white p-3 rounded-2xl w-full sm:w-60 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          disabled={isUpdating}
                      >
                          {STATUS_OPTIONS.map(s => (
                              <option key={s.code} value={s.code} className="bg-slate-900">{s.name}</option>
                          ))}
                      </select>
                      <button type="submit" disabled={isUpdating} className="px-8 py-3 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95 disabled:bg-gray-700">
                          {isUpdating ? 'Updating...' : 'Lưu'}
                      </button>
                    </div>
                </form>

            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CSS FOR ANIMATIONS & SCROLLBAR */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}