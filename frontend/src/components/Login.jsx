import React, { useState, useEffect } from 'react';
import axios from "../api";
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Mail, Smartphone, User, 
  KeyRound, ArrowRight, RefreshCcw, ChevronLeft 
} from 'lucide-react'; // Make sure to npm install lucide-react

const Login = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [successMsg, setSuccessMsg] = useState("");
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        otp: ''
    });

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async (isResend = false) => {
        if (!formData.email) return alert("Please enter your email address");
        setLoading(true);
        setSuccessMsg(""); 
        
        try {
            await axios.post('/send-otp', { email: formData.email });
            setTimer(60);
            setSuccessMsg("OTP sent successfully!"); 
            if (!isResend) {
                setTimeout(() => setStep(2), 1000);
            }
        } catch (error) {
            alert("Failed to send OTP. Please check your network.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (formData.otp.length < 4) return alert("Please enter the full code");
        setLoading(true);
        try {
            const res = await axios.post('/verify-otp', formData);
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'admin') navigate('/admin-dashboard');
            else if (user.role === 'police') navigate('/police-dashboard');
            else navigate('/citizen-dashboard');
        } catch (error) {
            alert("Verification failed. Invalid or expired OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.pageWrapper}>
            {/* Decorative background elements */}
            <div style={styles.bgGlow1}></div>
            <div style={styles.bgGlow2}></div>

            <div style={styles.cardContainer}>
                {/* Step Progress Dots */}
                <div style={styles.stepIndicator}>
                    <div style={{...styles.dot, backgroundColor: step >= 1 ? '#2563eb' : '#e2e8f0'}}></div>
                    <div style={{...styles.line, backgroundColor: step === 2 ? '#2563eb' : '#e2e8f0'}}></div>
                    <div style={{...styles.dot, backgroundColor: step === 2 ? '#2563eb' : '#e2e8f0'}}></div>
                </div>

                <div style={styles.headerStyle}>
                    <div style={styles.brandIconWrapper}>
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <h2 style={styles.brandTitle}>Secure Login</h2>
                    <p style={styles.brandSubtitle}>
                        {step === 1 ? "Enter details to receive your access code" : "We've sent a 6-digit code to your email"}
                    </p>
                </div>

                <div style={styles.formWrapper}>
                    {step === 1 ? (
                        <div style={styles.fadeIn}>
                            <div style={styles.inputGroup}>
                                <label style={styles.labelStyle}><User size={14} style={styles.labelIcon}/> Full Name</label>
                                <input name="name" value={formData.name} placeholder="John Doe" onChange={handleChange} style={styles.inputStyle} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.labelStyle}><Mail size={14} style={styles.labelIcon}/> Email Address</label>
                                <input name="email" value={formData.email} type="email" placeholder="name@official.com" onChange={handleChange} style={styles.inputStyle} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.labelStyle}><Smartphone size={14} style={styles.labelIcon}/> Mobile Number</label>
                                <input name="mobile" value={formData.mobile} placeholder="+1 (555) 000-0000" onChange={handleChange} style={styles.inputStyle} />
                            </div>

                            <button onClick={() => handleSendOtp(false)} disabled={loading} style={styles.primaryBtn}>
                                {loading ? "Processing..." : "Generate OTP"} <ArrowRight size={18} style={{marginLeft: '8px'}}/>
                            </button>
                            {successMsg && <p style={styles.successText}>{successMsg}</p>}
                        </div>
                    ) : (
                        <div style={styles.fadeIn}>
                            <div style={styles.notifyBox}>
                                <span>Email: <strong>{formData.email}</strong></span>
                                <button onClick={() => setStep(1)} style={styles.linkBtn}>Change</button>
                            </div>
                            
                            <div style={styles.inputGroup}>
                                <label style={styles.labelStyle}><KeyRound size={14} style={styles.labelIcon}/> Verification Code</label>
                                <input 
                                    name="otp" 
                                    value={formData.otp} 
                                    placeholder="· · · · · ·" 
                                    onChange={handleChange} 
                                    style={styles.otpInputStyle} 
                                    maxLength="6"
                                />
                            </div>

                            <button onClick={handleVerifyOtp} disabled={loading} style={styles.successBtn}>
                                {loading ? "Verifying..." : "Verify & Login"}
                            </button>

                            <div style={styles.footerRow}>
                                {timer > 0 ? (
                                    <span style={styles.timerStyle}>You can resend in <strong>{timer}s</strong></span>
                                ) : (
                                    <button onClick={() => handleSendOtp(true)} style={styles.linkBtn}>
                                        <RefreshCcw size={14} style={{marginRight: '5px'}}/> Resend Code
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Professional Styled Objects ---
const styles = {
    pageWrapper: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', width: '100vw', backgroundColor: '#f8fafc',
        position: 'fixed', top: 0, left: 0, fontFamily: "'Inter', sans-serif",
        overflow: 'hidden'
    },
    bgGlow1: {
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
        top: '-10%', left: '-10%', zIndex: 0
    },
    bgGlow2: {
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
        bottom: '-10%', right: '-10%', zIndex: 0
    },
    cardContainer: {
        width: '100%', maxWidth: '440px', backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '50px 40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)', zIndex: 1, border: '1px solid rgba(255,255,255,0.7)'
    },
    stepIndicator: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '30px'
    },
    dot: { width: '10px', height: '10px', borderRadius: '50%', transition: '0.3s' },
    line: { width: '40px', height: '2px', transition: '0.3s' },
    brandIconWrapper: {
        width: '64px', height: '64px', backgroundColor: '#2563eb', borderRadius: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
    },
    headerStyle: { textAlign: 'center', marginBottom: '35px' },
    brandTitle: { color: '#0f172a', margin: '0 0 10px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' },
    brandSubtitle: { color: '#64748b', fontSize: '15px', lineHeight: '1.5', margin: 0 },
    formWrapper: { display: 'flex', flexDirection: 'column' },
    inputGroup: { marginBottom: '20px' },
    labelStyle: { 
        display: 'flex', alignItems: 'center', fontSize: '13px', color: '#1e293b', 
        fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' 
    },
    labelIcon: { marginRight: '6px', color: '#2563eb' },
    inputStyle: {
        width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0',
        borderRadius: '14px', fontSize: '15px', outline: 'none', transition: '0.3s',
        boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#1e293b'
    },
    otpInputStyle: {
        width: '100%', padding: '14px', border: '2px solid #2563eb',
        borderRadius: '14px', fontSize: '22px', outline: 'none', textAlign: 'center',
        letterSpacing: '12px', fontWeight: '800', backgroundColor: '#eff6ff', color: '#1d4ed8',
        boxSizing: 'border-box'
    },
    primaryBtn: {
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#2563eb', color: '#fff', padding: '16px', border: 'none', 
        borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '16px',
        transition: '0.3s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
    },
    successBtn: {
        width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '16px',
        border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', 
        fontSize: '16px', marginTop: '10px'
    },
    notifyBox: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 18px', backgroundColor: '#f1f5f9', borderRadius: '12px',
        fontSize: '13px', marginBottom: '25px', color: '#475569', border: '1px solid #e2e8f0'
    },
    linkBtn: { 
        background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', 
        fontWeight: '700', fontSize: '14px', display: 'inline-flex', alignItems: 'center' 
    },
    successText: { color: '#10b981', fontSize: '13px', fontWeight: '600', textAlign: 'center', marginTop: '10px' },
    timerStyle: { color: '#94a3b8', fontSize: '13px' },
    footerRow: { textAlign: 'center', marginTop: '25px' },
    fadeIn: { animation: 'fadeIn 0.5s ease-in-out' }
};

export default Login;