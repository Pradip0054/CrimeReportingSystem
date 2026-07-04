import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, AlertCircle, UserCheck, Shield } from "lucide-react";
import adminService from "../services/adminService";
import "./AllComplaints.css";

function AllComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * 1. Query all registered system complaints upon component mount.
   */
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminService.getAllComplaints();

        if (res.data && res.data.success) {
          setComplaints(res.data.data || []);
        } else {
          setError("Failed to load valid data from server.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Server connection failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  if (loading) return <div className="loader">Loading Registered Complaints Data Desk...</div>;

  return (
    <div className="smart-complaints-container">
      <header className="page-header" style={{ marginBottom: "25px" }}>
        <button className="back-btn" onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
          Back to Dashboard
        </button>
        <h1 style={{ marginTop: "12px", color: "#ffffff", fontSize: "28px" }}>Registered Complaints</h1>
        <p className="subtitle" style={{ color: "#64748b" }}>System overview of all citizen reports.</p>
      </header>

      {error ? (
        <div className="error-card">
          <AlertCircle size={40} className="text-red" />
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : complaints.length === 0 ? (
        <div className="empty-card">
          <ClipboardList size={48} className="text-muted" />
          <p>No complaints registered in the system yet.</p>
        </div>
      ) : (
        <div className="smart-table-card">
          <div className="smart-card-header">
            <ClipboardList size={22} style={{ color: "#ef4444" }} />
            <h3>Recent Submissions</h3>
          </div>
          
          <div className="smart-responsive-wrapper">
            {/**
             * 2. Render structured complaint entities using predefined CSS display-table properties.
             */}
            <table className="smart-crime-grid">
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>ID</th>
                  <th style={{ width: "35%" }}>Citizen Details</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Status</th>
                  <th style={{ width: "25%" }}>Station Jurisdiction</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => {
                  const normalizedStatus = (complaint.status || "pending").toLowerCase();
                  
                  /**
                   * 3. Evaluate matching status signatures to isolate assigned files.
                   */
                  const isAssigned = normalizedStatus === "assigned" || normalizedStatus === "under-investigation";
                  
                  return (
                    <tr key={complaint.id} className="smart-row-interaction">
                      <td className="smart-cell-id">#{complaint.id}</td>
                      
                      <td>
                        <p className="smart-citizen-title">{complaint.citizen_name || complaint.name}</p>
                        <p className="smart-complaint-subtitle">{complaint.type || "General Case"}</p>
                      </td>
                      
                      <td style={{ textAlign: "center" }}>
                        <span className={`smart-pill-matrix status-${normalizedStatus}`}>
                          {complaint.status}
                        </span>
                      </td>
                      
                      <td>
                        <div className="smart-jurisdiction-box">
                          <Shield size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                          <span>{complaint.station}</span>
                        </div>
                      </td>
                      
                      {/**
                       * 4. Toggle conditional button states based on case ownership.
                       */}
                      <td style={{ textAlign: "center" }}>
                        {isAssigned ? (
                          <button className="smart-btn-disabled" disabled>
                            Assigned
                          </button>
                        ) : (
                          <button 
                            className="smart-btn-emerald"
                            onClick={() => navigate(`/admin/assign/${complaint.id}`)}
                          >
                            <UserCheck size={14} /> Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllComplaints;