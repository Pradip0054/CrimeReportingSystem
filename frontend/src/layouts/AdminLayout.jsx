import { useEffect } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  UserPlus, 
  ShieldAlert, 
  LogOut, 
  ShieldCheck 
} from "lucide-react";
import "../pages/AdminDashboard.css"; 

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <ShieldCheck className="logo-icon" size={28} />
          <span>Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>

          <NavLink to="/admin/manage-police" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <UserPlus size={20} /> Manage Police
          </NavLink>

          <NavLink to="/admin/complaints" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <ShieldAlert size={20} /> All Complaints
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar admin-avatar">A</div>
            <div>
              <p className="user-name">{user?.name || "Admin"}</p>
              <p className="user-email">Administrator</p>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout} style={{ cursor: "pointer" }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {/* 🎯 key={location.pathname} যুক্ত করার ফলে প্রতিবার পেজ সোয়্যাপে ফ্রেশ ডেটা রিকোয়েস্ট যাবে */}
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
}
 
export default AdminLayout;