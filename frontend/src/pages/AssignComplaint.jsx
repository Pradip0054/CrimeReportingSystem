import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, ArrowLeft, Send, Briefcase, MapPin } from "lucide-react";
import adminService from "../services/adminService";
import "./AssignComplaint.css";

function AssignComplaint() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [policeList, setPoliceList] = useState([]);
    const [stationName, setStationName] = useState(""); 
    const [loading, setLoading] = useState(true);
    const [selectedPolice, setSelectedPolice] = useState("");

    /**
     * 1. Query location-bound police officers eligible for target case assignment dynamically.
     */
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const res = await adminService.getOfficersByComplaint(id);
                
                if (res && res.data) {
                    setStationName(res.data.station_name || "Sabang PS");
                    
                    let rawOfficers = res.data.data || res.data.officers || res.data;
                    
                    if (rawOfficers && rawOfficers.data && Array.isArray(rawOfficers.data)) {
                        rawOfficers = rawOfficers.data;
                    }

                    if (Array.isArray(rawOfficers)) {
                        setPoliceList(rawOfficers);
                    } else {
                        setPoliceList([]);
                    }
                }
            } catch (err) {
                console.error("Failed to load location-based police list:", err);
                setPoliceList([]);
                setStationName("Sabang PS");
            } finally {
                setLoading(false);
            }
        };
        
        if (id) {
            loadData();
        }
    }, [id]);

    /**
     * 2. Submit the verified case assignment data block to the operational backend.
     */
    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedPolice) return alert("Please select a police officer");

        try {
            setLoading(true);
            const payload = {
                officer_id: parseInt(selectedPolice) 
            };

            const res = await adminService.assignOfficer(id, payload);
            
            if (res.data.success || res.status === 200) {
                alert("Complaint assigned successfully!");
                navigate("/admin");
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        } catch (err) {
            console.error("Assignment Error Details:", err.response?.data);
            alert(err.response?.data?.message || "Assignment failed due to network reset.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loader">Preparing Assignment Scope Parameters...</div>;

    return (
        <div className="assign-wrapper" style={{ padding: "30px", width: "100%", boxSizing: "border-box" }}>
            <header className="page-header" style={{ marginBottom: "25px" }}>
                <button className="back-btn" onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <h1 style={{ marginTop: "12px", color: "#ffffff", fontSize: "26px" }}>Assign Officer to Complaint #{id}</h1>
                {stationName && (
                    <div className="station-badge" style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "6px 14px", borderRadius: "50px", fontSize: "13px", fontWeight: "600" }}>
                        <MapPin size={16} /> Jurisdiction: <strong>{stationName}</strong>
                    </div>
                )}
            </header>

            <div className="assign-grid" style={{ marginTop: "20px" }}>
                <div className="glass-card assignment-card" style={{ position: "relative", zIndex: 10, background: "#1e293b", padding: "25px", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                    <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #334155", paddingBottom: "12px" }}>
                        <Briefcase size={22} style={{ color: "#ef4444" }} />
                        <h3 style={{ margin: 0, color: "#ffffff", fontSize: "18px" }}>Select Officer from {stationName}</h3>
                    </div>
                    
                    {/**
                     * 3. Select trigger dropdown element synced to dynamic location array indexes.
                     */}
                    <form onSubmit={handleAssign} className="assign-form">
                        <div className="input-group" style={{ display: "flex", alignItems: "center", gap: "12px", background: "#0f172a", border: "1px solid #475569", padding: "4px 12px", borderRadius: "6px", marginBottom: "20px" }}>
                            <User size={18} style={{ color: "#94a3b8" }} />
                            <select 
                                value={selectedPolice} 
                                onChange={(e) => setSelectedPolice(e.target.value)}
                                className="officer-select"
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#ffffff",
                                    padding: "12px 0",
                                    width: "100%",
                                    outline: "none",
                                    cursor: "pointer",
                                    fontSize: "14px"
                                }}
                                required
                            >
                                <option value="" style={{ background: "#1e293b", color: "#94a3b8" }}>Choose an Officer</option>
                                {policeList.length === 0 ? (
                                    <option value="" disabled style={{ background: "#1e293b", color: "#ef4444", fontWeight: "600" }}>
                                        No officers registered under {stationName}
                                    </option>
                                ) : (
                                    policeList.map(off => (
                                        <option 
                                            key={off.id} 
                                            value={off.id}
                                            style={{ background: "#0f172a", color: "#ffffff", padding: "10px" }}
                                        >
                                            {off.name} ({off.mobile || "No Contact"})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            className="submit-btn assign-btn" 
                            style={{ 
                                cursor: "pointer", 
                                width: "100%", 
                                padding: "12px", 
                                background: "#10b981", 
                                color: "#ffffff", 
                                border: "none", 
                                borderRadius: "6px", 
                                fontWeight: "600", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                gap: "8px",
                                fontSize: "14px",
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                            }}
                        >
                            <Send size={18} /> Confirm Assignment
                        </button>
                    </form>
                </div>

                {/**
                 * 4. Descriptive instructions mapping structural validation criteria rules.
                 */}
                <div className="glass-card note-card" style={{ background: "#1e293b", padding: "25px", borderRadius: "12px", marginTop: "20px" }}>
                    <h3 style={{ margin: "0 0 15px 0", color: "#ffffff", fontSize: "16px" }}>Assignment Instructions</h3>
                    <ul className="instruction-list" style={{ color: "#94a3b8", paddingLeft: "20px", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                        <li style={{ marginBottom: "8px" }}>Only displaying officers currently active under <strong>{stationName}</strong>.</li>
                        <li style={{ marginBottom: "8px" }}>Ensure the officer is available for new cases.</li>
                        <li style={{ marginBottom: "8px" }}>After assignment, the officer will be notified via portal.</li>
                        <li>Citizen status will update to "Assigned / Under Investigation".</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AssignComplaint;