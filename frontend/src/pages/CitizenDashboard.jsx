import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Search,
  Bell,
  LogOut,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Mic
} from "lucide-react";
import "./CitizenDashboard.css";

function CitizenDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    progress: 0,
    resolved: 0,
  });

  /**
   * Real-Time Portal Gateway Synchronizer
   * Fetches real-time case profiles and counter matrices from the backend API.
   */
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:8000/api/citizen/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      const resData = await response.json();
      
      if (resData && resData.success) {
        const complaintsList = resData.recent_complaints || resData.data || [];
        setComplaints(complaintsList);

        setStats({
          total: resData.stats?.total_filed || complaintsList.length,
          pending: resData.stats?.pending || 0,
          progress: resData.stats?.under_progress || 0, 
          resolved: resData.stats?.resolved || 0,
        });
      }
    } catch (error) {
      console.error("Failed to load complaints dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // 🎯 SECURITY ROLE GUARD: If an officer account tries to access this layout, kick them back
    if (user.role === "police" || user.role === "officer") {
      navigate("/police-dashboard");
      return;
    }

    // Initial data fetch on component mount
    fetchDashboardData();

    // Live synchronization listener: Fires whenever the user switches back to this tab
    window.addEventListener("focus", fetchDashboardData);

    // Automated Background Polling: Forces a background refresh every 5 seconds to match updates
    const liveInterval = setInterval(fetchDashboardData, 5000);

    // Clean up attachments on component unmount to prevent memory leakage
    return () => {
      window.removeEventListener("focus", fetchDashboardData);
      clearInterval(liveInterval);
    };
  }, [token, navigate, user.role]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return <div className="loader">Synchronizing Portal Core Parameters...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Shield className="logo-icon" size={24} />
          <span>Crime Reporting</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active" onClick={() => navigate("/citizen-dashboard")} style={{ cursor: "pointer" }}>
            <LayoutDashboard size={20} /> Dashboard
          </div>

          <div className="nav-item" onClick={() => navigate("/complaint-form")} style={{ cursor: "pointer" }}>
            <FileText size={20} /> File Complaint
          </div>

          <div className="nav-item" onClick={() => navigate("/voice-complaint")} style={{ cursor: "pointer", color: "#f87171" }}>
            <Mic size={20} /> Voice Complaint
          </div>

          <div className="nav-item" onClick={() => navigate("/track-status")} style={{ cursor: "pointer" }}>
            <Search size={20} /> Track Status
          </div>

          <div className="nav-item">
            <Bell size={20} /> Notifications
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <p className="user-name">{user?.name || "Citizen User"}</p>
              <p className="user-email">{user?.email || ""}</p>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout} style={{ cursor: "pointer" }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <h1>Citizen Portal</h1>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="new-btn" onClick={() => navigate("/voice-complaint")} style={{ cursor: "pointer", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid #ef4444" }}>
              <Mic size={18} /> Record Voice
            </button>
            <button className="new-btn" onClick={() => navigate("/complaint-form")} style={{ cursor: "pointer" }}>
              <Plus size={18} /> New Complaint
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card total"><div className="stat-info"><p>Total Filed</p><h2>{stats.total}</h2></div><div className="stat-icon"><FileText /></div></div>
          <div className="stat-card pending"><div className="stat-info"><p>Pending</p><h2>{stats.pending}</h2></div><div className="stat-icon"><Clock /></div></div>
          <div className="stat-card progress"><div className="stat-info"><p>Under Progress</p><h2>{stats.progress}</h2></div><div className="stat-icon"><AlertCircle /></div></div>
          <div className="stat-card resolved"><div className="stat-info"><p>Resolved</p><h2>{stats.resolved}</h2></div><div className="stat-icon"><CheckCircle /></div></div>
        </section>

        <section className="table-container">
          <div className="table-header"><h3>Recent Complaints</h3></div>
          {complaints.length === 0 ? (
            <div className="empty-state">No complaints submitted yet.</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Police Station</th>
                  <th>Status</th>
                  <th>Filed Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  // 🎯 DYNAMIC SANITIZATION ENGINE: Prevents casing conflicts from breaking visual logic
                  const statusStr = c.status ? String(c.status).trim() : "Pending";
                  const statusLower = statusStr.toLowerCase();
                  
                  let themeClass = "pending";
                  let displayStatus = statusStr;

                  if (
                    statusLower === "under investigation" || 
                    statusLower.includes("investig") || 
                    statusLower.includes("progress") || 
                    statusLower === "assigned" ||
                    statusLower.includes("assign")
                  ) {
                    themeClass = "progress"; 
                    displayStatus = "Under Progress";
                  } else if (
                    statusLower === "resolved" || 
                    statusLower.includes("resolv") || 
                    statusLower.includes("clos") || 
                    statusLower.includes("solv")
                  ) {
                    themeClass = "resolved";
                    displayStatus = "Resolved";
                  } else {
                    themeClass = "pending";
                    displayStatus = "Pending";
                  }

                  return (
                    <tr key={c.id}>
                      <td className="id-cell">#{c.id}</td>
                      <td>{c.type || "General Case"}</td>
                      <td>{c.station || "Sabang PS"}</td>
                      <td>
                        <span className={`status-pill ${themeClass}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "23/06/2026"}</td>
                      <td>
                        <button className="track-btn" onClick={() => navigate(`/track/${c.id}`)} style={{ cursor: "pointer" }}>Track</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default CitizenDashboard;