import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import "./AdminDashboard.css"; 

const AdminOverview = () => {
    const [stats, setStats] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    /**
     * 1. Fetch administrative overview metrics and recent records on initial component mount.
     */
    useEffect(() => {
        adminService.getDashboardStats()
            .then(res => {
                console.log("Overview Dashboard API Response:", res.data);
                
                /**
                 * 2. Normalize and bind metrics safely supporting unified or fallback response wrappers.
                 */
                if (res.data && res.data.success) {
                    setStats(res.data.stats);
                    setComplaints(res.data.recent_complaints || []);
                } else if (res.data) {
                    setStats(res.data);
                    setComplaints(res.data.recent_complaints || []);
                }
            })
            .catch(err => console.error("Error fetching overview data:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="loading-screen">Loading Admin Data Desk Overview...</div>;
    }

    return (
        <div className="admin-main">
            <header className="main-header">
                <h1>Dashboard Overview</h1>
            </header>
            
            <section className="stats-grid">
                <div className="stat-card">
                    <p>Total Complaints</p>
                    {/**
                     * 3. Fallback evaluation ensuring dynamic structural support across camelCase and snake_case API payloads.
                     */}
                    <h2>{stats?.total_complaints ?? stats?.totalComplaints ?? 0}</h2>
                </div>
                <div className="stat-card">
                    <p>Pending Assignment</p>
                    <h2>{stats?.pending_assignment ?? stats?.pendingAssignment ?? 0}</h2>
                </div>
                <div className="stat-card">
                    <p>Police Officers</p>
                    <h2>{stats?.total_police ?? stats?.totalPolice ?? stats?.police_officers ?? 0}</h2>
                </div>
            </section>

            <section className="table-container">
                <h3>Recent Complaints</h3>
                {complaints.length === 0 ? (
                    <div className="empty-state" style={{ padding: "20px", color: "#94a3b8" }}>
                        All complaints are currently assigned or queue is empty.
                    </div>
                ) : (
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Complaint ID</th>
                                <th>Citizen Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(c => (
                                <tr key={c.id}>
                                    <td className="id-cell">#{c.id}</td>
                                    <td>{c.citizen_name || c.name || "Anonymous Report"}</td>
                                    <td>
                                        <span className={`status-pill ${(c.status || "pending").toLowerCase()}`}>
                                            {c.status || "Pending"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};

export default AdminOverview;