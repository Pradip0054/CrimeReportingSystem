import React, { useEffect, useState } from "react";
import "./officer.css";
import { 
  Shield, FileText, CheckCircle, Clock, AlertTriangle, AlertCircle,
  Download, RefreshCw, MessageSquare, User, MapPin, Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

function OfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  
  const [newStatus, setNewStatus] = useState("");
  const [actionLog, setActionLog] = useState("");
  const [updating, setUpdating] = useState(false);

  /**
   * API Synchronization Gateway
   * Extracts valid session bearer tokens using multi-key local storage fallbacks.
   */
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const activeToken = localStorage.getItem("token") || 
                          localStorage.getItem("auth_token") || 
                          localStorage.getItem("access_token");

      if (!activeToken) {
        console.error("Authentication token missing inside localStorage!");
        setComplaints([]);
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:8000/api/officer/complaints", {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${activeToken}`, 
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      
      const data = res.status === 200 ? await res.json() : null;
      console.log("Raw Received Officer Data Sync:", data);
      
      if (data && data.success === true) {
        const list = data.complaints || data.data || [];
        setComplaints(list);
      } else {
        if (data && data.message) {
          alert(`🚨 ল্যারাভেল ডাটাবেজ এক্সেপশন:\n${data.message}`);
          console.error("Detailed Database Exception Summary:", data.message);
        }
        setComplaints([]);
      }
    } catch (err) {
      console.error("Error fetching complaints payload:", err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /**
   * Transactional Investigation Management
   * Safely modifies database status mappings and forces local context updates seamlessly.
   */
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus || !actionLog) {
      alert("Please select a status and enter an investigation log entry.");
      return;
    }

    setUpdating(true);
    try {
      const activeToken = localStorage.getItem("token") || 
                          localStorage.getItem("auth_token") || 
                          localStorage.getItem("access_token");

      const res = await fetch(`http://localhost:8000/api/officer/complaints/${selectedComplaint.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          status: newStatus,
          investigation_log: actionLog
        })
      });

      if (res.ok) {
        alert("Investigation updated successfully!");
        setActionLog("");
        
        // 🎯 FIX: Force clean formatting normalization so local state matches UI badges immediately
        const normalizedStateStatus = newStatus === "Resolved" ? "Resolved" : newStatus;

        // Dynamic Frontend Update Lock: Ensures immediate card list refresh without clashing
        setComplaints(prevComplaints => 
          prevComplaints.map(complaint => 
            complaint.id === selectedComplaint.id 
              ? { ...complaint, status: normalizedStateStatus } 
              : complaint
          )
        );

        setSelectedComplaint(prev => ({
          ...prev,
          status: normalizedStateStatus,
          investigation_logs: [...(prev.investigation_logs || []), {
            status_before: prev.status,
            status_after: normalizedStateStatus,
            log_entry: actionLog,
            created_at: new Date().toISOString()
          }]
        }));

        fetchComplaints(); 
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      alert("Server error updating investigation.");
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Certified Dossier Report Engine
   * Generates formatted layouts mapping structural incident metrics to storage pdf bundles.
   */
  const downloadPDF = (complaint) => {
    try {
      console.log("Initiating Safe jsPDF Engine for Case:", complaint.id);
      const doc = new jsPDF();
      
      doc.setFillColor(37, 99, 235); 
      doc.rect(0, 0, 210, 40, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("OFFICIAL CRIME COMPLAINT REPORT", 20, 26);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 48);
      doc.text(`Complaint ID Ref: #CC-${String(complaint.id || '')}`, 140, 48);
      
      doc.setDrawColor(220, 220, 220);
      doc.line(20, 52, 190, 52);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Current Investigation Status:", 20, 62);
      
      const currentStatus = complaint.status ? String(complaint.status).toLowerCase() : "pending";
      if (currentStatus === "pending") doc.setFillColor(239, 68, 68);
      else if (currentStatus === "under investigation" || currentStatus === "assigned") doc.setFillColor(245, 158, 11);
      else doc.setFillColor(16, 185, 129);
      
      doc.rect(85, 55, 45, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(String(complaint.status || "PENDING").toUpperCase(), 88, 61);

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      doc.text("1. Complainant Personal Profile", 20, 76);
      
      autoTable(doc, {
        startY: 80,
        theme: "striped",
        headStyles: { fillColor: [51, 65, 85] },
        body: [
          ["Full Registered Name", String(complaint.name || "N/A")],
          ["Verified Phone Number", String(complaint.phone || "N/A")],
          ["Primary Residential Address", String(complaint.address || "N/A")],
          ["City / State / ZIP", `${String(complaint.city || "")} ${String(complaint.state || "")} - ${String(complaint.zip || "")}`]
        ]
      });

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      doc.text("2. Event & Occurrence Summary", 20, doc.lastAutoTable.finalY + 12);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        theme: "grid",
        headStyles: { fillColor: [51, 65, 85] },
        body: [
          ["Date of Incident", String(complaint.incident_date || "N/A")],
          ["Time of Incident", String(complaint.incident_time || "N/A")],
          ["Geographic Location", String(complaint.incident_location || "N/A")],
          ["Named Accused Parties", String(complaint.accused_names || "Unspecified / Unknown")],
          ["Assigned Police Station", String(complaint.station || "Local Jurisdiction Section")]
        ]
      });

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      const descY = doc.lastAutoTable.finalY + 12;
      doc.text("3. Detailed Statement of Complaint", 20, descY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      
      const rawDescription = String(complaint.description || "No description provided.");
      const splitDescription = doc.splitTextToSize(rawDescription, 170);
      doc.text(splitDescription, 20, descY + 8);
      
      doc.save(`Complaint_Report_#CC-${complaint.id}.pdf`);
      console.log("PDF Downloaded Successfully!");

    } catch (pdfError) {
      console.error("CRITICAL PDF ENGINE ERROR:", pdfError);
      alert("PDF generation failed due to data parsing error.");
    }
  };

  /**
   * Structural Data Reduction Pipeline
   */
  const filteredComplaints = Array.isArray(complaints)
    ? complaints.filter(c => {
        if (!c.status) return false;
        const normalizedStatus = c.status.toLowerCase();

        if (statusFilter === "All") return true;
        if (statusFilter === "Pending") return normalizedStatus === "pending";
        if (statusFilter === "Under Investigation") {
          return normalizedStatus === "under investigation" || normalizedStatus === "assigned";
        }
        if (statusFilter === "Resolved") return normalizedStatus === "resolved";
        return false;
      })
    : [];

  return (
    <div className="officer-dashboard-layout">
      <aside className="officer-sidebar">
        <div className="sidebar-brand">
          <Shield size={28} />
          <h2>Law Enforcement Portal</h2>
        </div>
        <nav className="filter-nav">
          <h3>Filter by Status</h3>
          <button className={statusFilter === "All" ? "active" : ""} onClick={() => setStatusFilter("All")}>All Assigned Cases</button>
          <button className={statusFilter === "Pending" ? "active" : ""} onClick={() => setStatusFilter("Pending")}>Pending Verification</button>
          <button className={statusFilter === "Under Investigation" ? "active" : ""} onClick={() => setStatusFilter("Under Investigation")}>Active Investigations</button>
          <button className={statusFilter === "Resolved" ? "active" : ""} onClick={() => setStatusFilter("Resolved")}>Resolved Cases</button>
        </nav>
      </aside>

      <main className="dashboard-content">
        {loading ? (
          <div className="loader-overlay"><Loader2 className="spinning" size={48} /></div>
        ) : (
          <div className="workspace-grid">
            
            <div className="complaints-list-pane">
              <div className="pane-header">
                <h3>Assigned Case Docket ({filteredComplaints.length})</h3>
                <button className="refresh-btn" onClick={fetchComplaints}><RefreshCw size={16} /></button>
              </div>

              <div className="scrollable-cards">
                {filteredComplaints.length === 0 ? (
                  <p className="no-cases-msg">No active cases assigned in this scope.</p>
                ) : (
                  filteredComplaints.map(c => (
                    <div 
                      key={c.id} 
                      className={`complaint-summary-card ${selectedComplaint?.id === c.id ? "selected" : ""}`}
                      onClick={() => { 
                        setSelectedComplaint(c); 
                        setNewStatus(c.status === "ASSIGNED" || c.status === "Assigned" ? "Under Investigation" : c.status); 
                      }}
                    >
                      <div className="card-top">
                        <span className="case-id">#CC-{c.id}</span>
                        <span className={`status-badge ${c.status.toLowerCase().replace(/ /g, "-")}`}>{c.status}</span>
                      </div>
                      <h4>{c.name}</h4>
                      <p className="truncated-desc">{c.description}</p>
                      <div className="card-footer">
                        <span><Clock size={12} /> {c.incident_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="complaint-detail-pane">
              {selectedComplaint ? (
                <div className="detail-wrapper fade-in">
                  
                  <header className="detail-header" style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                      <h2>Case Docket Reference #CC-{selectedComplaint.id}</h2>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>Registered Timestamp: {new Date(selectedComplaint.created_at).toLocaleString()}</p>
                    </div>
                    <button 
                      type="button"
                      className="action-download-btn" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPDF(selectedComplaint);
                      }}
                      style={{
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        padding: "10px 16px",
                        borderRadius: "6px",
                        border: "none",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        position: "relative",
                        zIndex: 50
                      }}
                    >
                      <Download size={18} /> Download Signed PDF
                    </button>
                  </header>

                  <div className="detail-scroll-area">
                    <div className="info-block-grid">
                      <div className="info-card">
                        <h5><User size={16} /> Complainant Profile</h5>
                        <p><strong>Name:</strong> {selectedComplaint.name}</p>
                        <p><strong>Phone:</strong> {selectedComplaint.phone}</p>
                        <p><strong>Address:</strong> {selectedComplaint.address}, {selectedComplaint.city}</p>
                      </div>

                      <div className="info-card">
                        <h5><AlertCircle size={16} /> Occurrence Profile</h5>
                        <p><strong>Date/Time:</strong> {selectedComplaint.incident_date} | {selectedComplaint.incident_time}</p>
                        <p><strong>Incident Scene Location:</strong> {selectedComplaint.incident_location}</p>
                        <p><strong>Named Suspects:</strong> {selectedComplaint.accused_names || "None Provided"}</p>
                      </div>
                    </div>

                    <div className="statement-box">
                      <h5>Statement of Complaint</h5>
                      <p>{selectedComplaint.description}</p>
                    </div>

                    <div className="statement-box" style={{ marginTop: "20px", backgroundColor: "#f8fafc" }}>
                      <h5>Investigation History Timeline</h5>
                      {selectedComplaint.investigation_logs && selectedComplaint.investigation_logs.length > 0 ? (
                        <div style={{ paddingLeft: "10px", borderLeft: "2px solid #cbd5e1", marginTop: "12px" }}>
                          {selectedComplaint.investigation_logs.map((log, index) => (
                            <div key={log.id || index} style={{ marginBottom: "14px", position: "relative" }}>
                              <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>{new Date(log.created_at).toLocaleString()}</span>
                              <p style={{ margin: "2px 0", fontSize: "13px" }}>
                                Status Matrix: <span style={{ color: "#e11d48" }}>{log.status_before}</span> ➡️ <span style={{ color: "#16a34a" }}>{log.status_after}</span>
                              </p>
                              <p style={{ margin: 0, fontSize: "13px", color: "#334155" }}>📝 {log.log_entry}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "10px 0 0 0" }}>No progress history logged yet for this scope parameters.</p>
                      )}
                    </div>

                    <div className="investigation-management-panel" style={{ marginTop: "25px" }}>
                      <h5>Update Active Case Scope</h5>
                      <form onSubmit={handleUpdateStatus} className="status-update-form">
                        <div className="form-row">
                          <label>Disposition Matrix Status</label>
                          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required>
                            <option value="Pending">Pending Assignment</option>
                            <option value="Assigned">Assigned (Standard)</option>
                            <option value="ASSIGNED">Assigned (Capitalized)</option>
                            <option value="Under Investigation">Under Investigation (Active)</option>
                            <option value="Resolved">Resolved / Case Closed</option>
                          </select>
                        </div>

                        <div className="form-row">
                          <label>Operational Case Updates / Case Chronology Log</label>
                          <textarea 
                            value={actionLog} 
                            placeholder="Add clear progress notes..."
                            onChange={(e) => setActionLog(e.target.value)}
                            required
                          />
                        </div>

                        <button type="submit" disabled={updating} className="btn-execute-update">
                          {updating ? "Logging to Database..." : "Commit Update to Chronology"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <FileText size={64} />
                  <h4>No Case File Selected</h4>
                  <p>Select a complaint item context record from the primary list docket column array grid parameters.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default OfficerDashboard;