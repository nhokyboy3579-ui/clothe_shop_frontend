'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { AuthService } from '@/services/AuthService';
import toast, { Toaster } from 'react-hot-toast';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); 
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(timer - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await AuthService.sendOtp(email);
            toast.success("Mã OTP đã được gửi!");
            setStep(2);
            setTimer(60);
        } catch (err) {
            toast.error(err.response?.data?.errors?.email?.[0] || "Lỗi gửi mã");
        } finally { setLoading(false); }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await AuthService.verifyAndReset({ 
                email, otp, password, password_confirmation: passwordConfirmation 
            });
            toast.success("Mật khẩu đã được cập nhật!");
            setTimeout(() => router.push('/login'), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Mã OTP sai hoặc hết hạn");
        } finally { setLoading(false); }
    };

    return (
        <main className="min-h-screen bg-white font-sans selection:bg-black selection:text-white">
            <Header />
            <Toaster position="top-center" />
            <div className="flex items-center justify-center py-20 bg-gray-50">
                <div className="bg-white p-10 shadow-2xl rounded-[2.5rem] w-full max-w-md border border-slate-100">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-serif italic text-slate-900 tracking-tighter uppercase">Khôi phục</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Reset Access</p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <input type="email" required placeholder="EMAIL CỦA BẠN"
                                className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black text-sm"
                                onChange={(e) => setEmail(e.target.value)} />
                            <button disabled={loading} className="w-full bg-black text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">
                                {loading ? "Đang gửi..." : "Gửi mã OTP"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="text-center text-[10px] font-bold mb-4">
                                {timer > 0 ? (
                                    <span className="text-emerald-500 uppercase tracking-widest italic">Mã hiệu lực: {timer}s</span>
                                ) : (
                                    <span className="text-red-500 uppercase tracking-widest italic">Mã đã hết hạn</span>
                                )}
                            </div>
                            <input placeholder="MÃ OTP 6 SỐ" required 
                                className="w-full bg-slate-50 p-4 rounded-2xl outline-none text-center font-bold tracking-[0.5em]"
                                onChange={(e) => setOtp(e.target.value)} />
                            <input type="password" placeholder="MẬT KHẨU MỚI" required 
                                className="w-full bg-slate-50 p-4 rounded-2xl outline-none"
                                onChange={(e) => setPassword(e.target.value)} />
                            <input type="password" placeholder="XÁC NHẬN MẬT KHẨU" required 
                                className="w-full bg-slate-50 p-4 rounded-2xl outline-none"
                                onChange={(e) => setPasswordConfirmation(e.target.value)} />
                            <button disabled={loading || timer === 0} className="w-full bg-black text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-30">
                                {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                            </button>
                        </form>
                    )}
                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-[10px] font-bold text-slate-400 hover:text-black uppercase tracking-widest underline underline-offset-8">Trở về đăng nhập</Link>
                    </div>
                </div>
            </div>
        </main>
    );
}