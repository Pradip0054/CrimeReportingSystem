import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Search,
  Bell,
  LogOut,
  UserPlus,
  CheckCircle,
  Clock,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import adminService from "../services/adminService";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await adminService.getDashboardStats();
        setStats(response.data.stats);
        setComplaints(response.data.recent_complaints || []);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return <div className="loader">Loading Admin Portal...</div>;
  }

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <ShieldCheck className="logo-icon" size={24} />
          <span>Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active" onClick={() => navigate("/admin")}>
            <LayoutDashboard size={20} /> Overview
          </div>

          <div className="nav-item" onClick={() => navigate("/admin/manage-police")}>
            <UserPlus size={20} /> Manage Police
          </div>

          <div className="nav-item" onClick={() => navigate("/admin/complaints")}>
            <ShieldAlert size={20} /> All Complaints
          </div>

          <div className="nav-item">
            <Bell size={20} /> System Logs
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar admin-avatar">A</div>
            <div>
              <p className="user-name">{user?.name || "Admin User"}</p>
              <p className="user-email">System Administrator</p>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="main-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p className="subtitle">Welcome back, Control the system and safety.</p>
          </div>
          <div className="header-actions">
             <button className="manage-btn" onClick={() => navigate("/admin/manage-police")}>
                <Plus size={18} /> Add Police
             </button>
          </div>
        </header>

        {/* Stats Section */}
        <section className="stats-grid">
          <div className="stat-card total">
            <div className="stat-info">
              <p>Total Complaints</p>
              <h2>{stats?.total_complaints || 0}</h2>
            </div>
            <div className="stat-icon"><ShieldAlert /></div>
          </div>

          <div className="stat-card pending">
            <div className="stat-info">
              <p>Pending Assignment</p>
              <h2>{stats?.pending_assignment || 0}</h2>
            </div>
            <div className="stat-icon"><Clock /></div>
          </div>

          <div className="stat-card police">
            <div className="stat-info">
              <p>Police Officers</p>
              <h2>{stats?.total_police || 0}</h2>
            </div>
            <div className="stat-icon"><Briefcase /></div>
          </div>

          <div className="stat-card citizens">
            <div className="stat-info">
              <p>Total Citizens</p>
              <h2>{stats?.total_citizens || 0}</h2>
            </div>
            <div className="stat-icon"><Users /></div>
          </div>
        </section>

        {/* Recent Complaints Table */}
        <section className="table-container">
          <div className="table-header">
            <h3>Recent Complaints for Assignment</h3>
          </div>

          {complaints.length === 0 ? (
            <div className="empty-state">All complaints are currently assigned.</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Citizen Name</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td className="id-cell">#{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.complaint_type?.name || "General"}</td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-pill ${c.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                        {c.status || "unassigned"}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="assign-btn" 
                        onClick={() => navigate(`/admin/assign/${c.id}`)}
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

// Icon Helper
const Plus = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default AdminDashboard;