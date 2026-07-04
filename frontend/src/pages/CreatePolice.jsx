import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UserPlus, 
  Users, 
  Mail, 
  Phone, 
  Lock, 
  ArrowLeft,
  ShieldCheck,
  MapPin
} from "lucide-react";
import adminService from "../services/adminService";
import "./CreatePolice.css";

function CreatePolice() {
  const navigate = useNavigate();
  const [policeList, setPoliceList] = useState([]);
  const [stations, setStations] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    police_station_id: "" 
  });

  /**
   * 1. Asynchronously fetch existing police profiles and jurisdictional stations to hydrate local datasets.
   */
  const fetchPoliceAndStations = async () => {
    try {
      setLoading(true);
      
      try {
        const policeRes = await adminService.getPoliceList();
        if (policeRes && policeRes.data) {
          const rootData = policeRes.data.success ? policeRes.data.data : (policeRes.data || []);
          setPoliceList(Array.isArray(rootData) ? rootData : []);
        }
      } catch (pErr) {
        console.error("Error fetching police list:", pErr);
      }

      try {
        const stationRes = await adminService.getAllPoliceStations();
        if (stationRes && stationRes.data) {
          const rootStations = stationRes.data.success ? stationRes.data.data : (stationRes.data || []);
          setStations(Array.isArray(rootStations) ? rootStations : []);
        }
      } catch (sErr) {
        console.error("Error fetching stations dropdown:", sErr);
      }

    } catch (err) {
      console.error("Global error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoliceAndStations();
  }, []);

  /**
   * 2. Handle form submission constraints and payload processing routines for registering new personnel.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.police_station_id) return alert("Please select a Police Station jurisdiction!");

    try {
      setLoading(true);
      const res = await adminService.createPoliceOfficer(formData);
      
      if (res.data?.success || res.status === 200) {
        alert("Police Officer registered successfully!");
        setFormData({ name: "", email: "", mobile: "", password: "", police_station_id: "" });
        await fetchPoliceAndStations(); 
      }
    } catch (err) {
      console.error("Registration Error Details:", err.response?.data);
      alert(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-police-wrapper">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <h1>Manage Police Officers</h1>
      </header>

      <div className="manage-grid">
        <section className="form-section">
          <div className="glass-card">
            <div className="card-header">
              <UserPlus size={22} className="text-red" />
              <h3>Add New Officer</h3>
            </div>
            <form onSubmit={handleSubmit} className="police-form">
              <div className="input-group"><Users size={18} /><input placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
              <div className="input-group"><Mail size={18} /><input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
              <div className="input-group"><Phone size={18} /><input placeholder="Mobile Number" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} required /></div>
              <div className="input-group"><Lock size={18} /><input type="password" placeholder="Default Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required /></div>

              {/**
               * 3. Select container wrapper providing explicit dynamic station option bindings.
               */}
              <div className="input-group" style={{ position: "relative", zIndex: 10 }}>
                <MapPin size={18} style={{ color: "#ef4444" }} />
                <select
                  value={formData.police_station_id}
                  onChange={(e) => setFormData({...formData, police_station_id: e.target.value})}
                  style={{ background: "#1e293b", border: "1px solid #475569", color: "#ffffff", padding: "12px", width: "100%", outline: "none", borderRadius: "6px", cursor: "pointer" }}
                  required
                >
                  <option value="" style={{ color: "#94a3b8" }}>Select Jurisdiction Station</option>
                  {stations.map(station => (
                    <option key={station.id} value={station.id} style={{ background: "#0f172a", color: "#ffffff" }}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="submit-btn" style={{ cursor: "pointer" }}>Register Officer</button>
            </form>
          </div>
        </section>

        <section className="list-section">
          <div className="glass-card">
            <div className="card-header">
              <ShieldCheck size={22} className="text-red" />
              <h3>Existing Officers ({policeList.length})</h3>
            </div>
            <div className="table-responsive">
              {/**
               * 4. Structured tracking display matrix matching active structural properties to current data elements.
               */}
              <table className="police-table">
                <thead>
                  <tr><th>Name / Details</th><th>Assigned Jurisdiction</th><th>Contact</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" className="text-center" style={{ padding: "20px", color: "#94a3b8" }}>Loading Officer Data Desk...</td></tr>
                  ) : policeList.length === 0 ? (
                    <tr><td colSpan="3" className="text-center" style={{ padding: "20px", color: "#94a3b8" }}>No officers found</td></tr>
                  ) : (
                    policeList.map((officer) => (
                      <tr key={officer.id}>
                        <td>
                          <p className="off-name" style={{ margin: 0, fontWeight: "600", color: "#ffffff" }}>{officer.name}</p>
                          <p className="off-email" style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>{officer.email}</p>
                        </td>
                        <td>
                          <span className="status-badge under-investigation" style={{ textTransform: "capitalize" }}>
                            {officer.station_name || `Station ID: ${officer.police_station_id}`}
                          </span>
                        </td>
                        <td style={{ color: "#cbd5e1" }}>{officer.mobile || officer.contact || "No Contact"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CreatePolice;