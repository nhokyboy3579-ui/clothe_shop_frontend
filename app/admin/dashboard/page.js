'use client';
import { useEffect, useState } from 'react';
import { DashboardService } from '@/services/admin/DashboardService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatMoney = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await DashboardService.getDashboardStats();
        setData(stats);
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("Không thể tải dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <Toaster position="top-right" />
      
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Tổng quan hệ thống</h1>
        <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-1 italic">Real-time Analytics Dashboard 2025</p>
      </div>

      {/* 4 CARD THỐNG KÊ CHÍNH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard title="Tiền đã thu" value={formatMoney(data.stats.money_received)} color="emerald" icon="💸" sub="Đơn đã hoàn thành" />
        <StatCard title="Tiền chờ xử lý" value={formatMoney(data.stats.money_pending)} color="amber" icon="⏳" sub="Đơn đang vận chuyển" />
        <StatCard title="Tổng sản phẩm" value={data.stats.total_products} color="indigo" icon="📦" sub="Trong kho hàng" />
        <StatCard title="Khách hàng" value={data.stats.total_users} color="sky" icon="👤" sub="Tài khoản đăng ký" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* BIỂU ĐỒ DIỄN BIẾN NGÀY (7 NGÀY QUA) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-l-4 border-indigo-600 pl-4">Doanh thu tuần này</h3>
              <span className="text-[10px] font-bold text-slate-400 italic underline decoration-indigo-500/20 underline-offset-4">Đơn vị: VNĐ</span>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.daily}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px'}}
                    formatter={(value) => [formatMoney(value), "Doanh thu"]}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* BIỂU ĐỒ CỘT THÁNG (LUXURY DARK THEME) */}
        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-black uppercase text-xs tracking-widest text-indigo-400 border-l-4 border-indigo-400 pl-4 mb-1">
                  Hiệu suất tháng
                </h3>
                <p className="text-[10px] text-slate-500 font-bold ml-5 italic uppercase tracking-tighter">Yearly Revenue 2025</p>
              </div>
              <div className="bg-slate-800 p-2 rounded-xl border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.monthly} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 800 }}
                    interval={0}
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{payload[0].payload.month}</p>
                            <p className="text-sm font-black text-indigo-400">{formatMoney(payload[0].value)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 6, 6]} 
                    barSize={12}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">Hệ thống ổn định</span>
              <span className="text-[10px] font-black text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG MỚI NHẤT */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-l-4 border-slate-800 pl-4">Giao dịch gần đây</h3>
          <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-all active:scale-95">Xem chi tiết đơn hàng &rarr;</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-50">
              {data.latest_orders.map((order) => (
                <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="p-6">
                    <p className="font-black text-slate-800 text-sm tracking-tight">{order.customer}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">{order.created_at}</p>
                  </td>
                  <td className="p-6 text-right font-mono">
                    <p className="font-black text-indigo-600 text-sm italic">{formatMoney(order.total)}</p>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border inline-block w-32
                      ${order.status === 4 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {order.status === 4 ? 'Hoàn thành' : 'Đang xử lý'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Sub-component cho Stat Card
function StatCard({ title, value, color, icon, sub }) {
  const themes = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100",
    sky: "bg-sky-50 text-sky-600 border-sky-100 shadow-sky-100",
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2 group">
      <div className="flex justify-between items-start mb-6">
        <span className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${themes[color].split(' ').slice(0, 3).join(' ')} group-hover:scale-110 transition-transform`}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tighter mb-1">{value}</p>
        <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></span>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{sub}</p>
        </div>
      </div>
    </div>
  );
}