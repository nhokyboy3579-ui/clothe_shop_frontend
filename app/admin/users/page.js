'use client';
import { useEffect, useState, useMemo } from 'react';
// 1. IMPORT TOASTER & SWEETALERT
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2'; 

import Image from 'next/image';
import { fetchUsersData, saveUser, deleteUser } from '@/services/admin/UserService'; 

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // --- STATE MODAL & FORM ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form & File
  const initialForm = {
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    status: 1
  };
  const [formData, setFormData] = useState(initialForm);
  const [avatarFile, setAvatarFile] = useState(null); // File thực tế
  const [previewUrl, setPreviewUrl] = useState(null); // Link xem trước

  // 1. Load danh sách (Sử dụng Service)
  const fetchUsers = async () => {
    try {
      const data = await fetchUsersData();
      setUsers(data); 
    } catch (error) {
      toast.error(error.message || 'Lỗi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { fetchUsers(); }, []); 

  // Filter & Search (Client-side search)
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter(user => (
      user.name?.toLowerCase().includes(term) ||
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    ));
  }, [users, searchTerm]);
  
  const admins = filteredUsers.filter(u => u.role === 'admin');
  const customers = filteredUsers.filter(u => u.role !== 'admin');

  // --- HANDLERS ---

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData(initialForm);
    setAvatarFile(null);
    setPreviewUrl(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setEditId(user.id);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      status: user.status
    });
    setAvatarFile(null);
    setPreviewUrl(user.full_avatar_url || null);
    setShowModal(true);
  };

  // Xử lý chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('username', formData.username);
    data.append('email', formData.email);
    data.append('role', formData.role);
    data.append('status', formData.status);
    if (formData.phone) data.append('phone', formData.phone);
    if (formData.password) data.append('password', formData.password);
    if (avatarFile) data.append('avatar', avatarFile);

    // Hiển thị loading toast
    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm mới...');

    try {
      await saveUser(data, isEditing ? editId : null);
      
      // Thông báo thành công
      toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm mới thành công!', { id: toastId });
      
      setShowModal(false);
      fetchUsers(); 
      
    } catch (error) {
      const msg = error.response?.data?.errors 
        ? Object.values(error.response.data.errors)[0][0] 
        : 'Có lỗi xảy ra';
      
      toast.error(msg, { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- XỬ LÝ XÓA VỚI SWEETALERT2 ---
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Bạn muốn xóa người dùng này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteUser(id);
          
          Swal.fire(
            'Đã xóa!',
            'Người dùng đã được xóa thành công.',
            'success'
          );
          
          fetchUsers(); 
        } catch (error) { 
          Swal.fire(
            'Lỗi!',
            'Không thể xóa người dùng này.',
            'error'
          );
        }
      }
    });
  };

  if (loading) return (
      <div className="p-10 text-center flex flex-col items-center justify-center h-screen text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
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
        <h2 className="text-2xl font-bold text-gray-800 uppercase">Quản lý User</h2>
        <button onClick={handleOpenAdd} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 flex items-center gap-2 transition shadow">
          <span>+</span> Thêm User
        </button>
      </div>

      <div className="mb-8">
        <input
          type="text" 
          placeholder="Tìm kiếm user theo tên, username, email..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- BẢNG ADMIN --- */}
      <div className="mb-10">
        <h3 className="font-bold text-red-700 mb-2 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600"></span> Quản Trị Viên ({admins.length})
        </h3>
        <div className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-red-500">
          <UserTable users={admins} onEdit={handleOpenEdit} onDelete={handleDelete} />
        </div>
      </div>

      {/* --- BẢNG CUSTOMER --- */}
      <div className="mb-10">
        <h3 className="font-bold text-blue-700 mb-2 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Khách Hàng ({customers.length})
        </h3>
        <div className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-blue-500">
           <UserTable users={customers} onEdit={handleOpenEdit} onDelete={handleDelete} />
        </div>
      </div>
      
      {/* --- MODAL FORM --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg uppercase">{isEditing ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-300 transition">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {/* Avatar Upload */}
              <div className="flex justify-center mb-6">
                <div className="relative w-24 h-24 group">
                   {previewUrl ? (
                    <Image src={previewUrl} alt="Avatar" fill className="rounded-full object-cover border-4 border-gray-100 shadow-md" unoptimized />
                   ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">No Img</div>
                   )}
                   <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg border-2 border-white transition-transform hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      </svg>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                   </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Họ tên (*)</label>
                  <input type="text" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Username (*)</label>
                  <input type="text" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="nguyenvana" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Email (*)</label>
                  <input type="email" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Số điện thoại</label>
                  <input type="text" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="0901234567" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-1 text-gray-700">Mật khẩu <span className="text-gray-400 font-normal text-xs">(Để trống nếu không đổi)</span></label>
                <input type="password" className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" required={!isEditing} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="********" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Vai trò</label>
                  <select className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option value="customer">Khách hàng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Trạng thái</label>
                  <select className="w-full border p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="1">Active (Hoạt động)</option>
                    <option value="0">Locked (Khóa)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-bold transition">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg disabled:bg-gray-400 transition">
                    {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Component con hiển thị bảng
function UserTable({ users, onEdit, onDelete }) {
    if(users.length === 0) return <div className="p-8 text-center text-gray-500 italic">Không tìm thấy tài khoản nào.</div>
    return (
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
                <tr>
                    <th className="p-4 border-b">Avatar</th>
                    <th className="p-4 border-b">Thông tin</th>
                    <th className="p-4 border-b">Liên hệ</th>
                    <th className="p-4 border-b text-center">Status</th>
                    <th className="p-4 border-b text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                            <div className="relative w-10 h-10">
                                <Image 
                                    src={u.full_avatar_url || 'https://via.placeholder.com/150'} 
                                    alt="Avt" fill className="rounded-full object-cover border shadow-sm" 
                                    unoptimized
                                />
                            </div>
                        </td>
                        <td className="p-4">
                            <p className="font-bold text-gray-800">{u.name}</p>
                            <p className="text-xs text-blue-600 font-medium">@{u.username}</p>
                        </td>
                        <td className="p-4">
                            <p className="text-gray-700">{u.email}</p>
                            <p className="text-xs text-gray-500">{u.phone || 'Chưa có SĐT'}</p>
                        </td>
                        <td className="p-4 text-center">
                            {u.status == 1 
                                ? <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active</span> 
                                : <span className="inline-flex items-center gap-1 text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Locked</span>
                            }
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                            <button onClick={() => onEdit(u)} className="text-blue-600 font-bold mr-3 hover:bg-blue-50 p-2 rounded transition">Sửa</button>
                            <button onClick={() => onDelete(u.id)} className="text-red-600 font-bold hover:bg-red-50 p-2 rounded transition">Xóa</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}