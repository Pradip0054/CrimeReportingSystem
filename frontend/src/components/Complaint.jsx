import "./complaint.css";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Shield, User, MapPin, AlertCircle, FileUp,
  RotateCcw, Send, CheckCircle
} from "lucide-react";

function ComplaintForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const aiDescription = location.state?.description || ""; 
  const aiLocation = location.state?.location || "";

  /**
   * 1. Establish the structured initial state configuration for the entire form fields.
   */
  const initialFormState = {
    name: "", phone: "", address: "", city: "", state: "", zip: "",
    accused_names: "", incident_date: "", incident_time: "",
    incident_location: aiLocation, 
    police_unit_id: "", police_station_id: "",
    complaint_type_id: "", description: aiDescription 
  };

  const [formData, setFormData] = useState(initialFormState);
  const [dropdowns, setDropdowns] = useState({ unitTypes: [], units: [], stations: [], types: [] });
  const [evidence, setEvidence] = useState(null);
  const [aiNotice, setAiNotice] = useState("");

  /**
   * 2. Synchronize external AI voice parsing artifacts with local form states safely.
   */
  useEffect(() => {
    if (aiDescription || aiLocation) {
      setFormData(prev => ({
        ...prev,
        description: aiDescription ? aiDescription : prev.description,
        incident_location: (aiLocation && aiLocation !== "Unknown" && aiLocation !== "Not Specified") 
          ? aiLocation 
          : prev.incident_location
      }));

      if (aiLocation && aiLocation !== "Unknown" && aiLocation !== "Not Specified") {
        setAiNotice(`✨ AI Voice Draft & Location (${aiLocation}) Imported Successfully!`);
      } else if (aiDescription) {
        setAiNotice("✨ AI Voice Draft Imported Successfully!");
      }
    }
  }, [aiDescription, aiLocation]);

  useEffect(() => {
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
        const [uTypes, cTypes] = await Promise.all([
          fetch("http://localhost:8000/api/police-unit-types", { headers }).then(r => r.json()),
          fetch("http://localhost:8000/api/complaint-types", { headers }).then(r => r.json())
        ]);
        setDropdowns(prev => ({ ...prev, unitTypes: uTypes, types: cTypes }));
      } catch {
        console.error("Dropdown load failed");
      }
    };
    loadData();
  }, [token, navigate]);

  /**
   * 3. Handle asynchronous hierarchical dropdown population relative to target jurisdictions.
   */
  const handleUnitTypeChange = async (e) => {
    const type = e.target.value;
    const res = await fetch(`http://localhost:8000/api/police-units/${type}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    });
    const data = await res.json();
    setDropdowns(prev => ({ ...prev, units: data, stations: [] }));
  };

  const handleUnitChange = async (e) => {
    const unitId = e.target.value;
    setFormData({ ...formData, police_unit_id: unitId });
    const res = await fetch(`http://localhost:8000/api/police-stations/${unitId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    });
    const data = await res.json();
    setDropdowns(prev => ({ ...prev, stations: data }));
  };

  /**
   * 4. Compile form boundaries into multi-part datasets and dispatch payload requests.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(k => data.append(k, formData[k]));
    if (evidence) data.append("evidence", evidence);

    try {
      const res = await fetch("http://localhost:8000/api/complaint", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: data
      });

      if (res.ok) {
        alert("Complaint submitted successfully!");
        navigate("/citizen-dashboard");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit complaint");
      }
    } catch {
      alert("Server response error");
    }
  };

  const handleReset = () => {
    if (window.confirm("Clear all form fields?")) {
      setFormData(initialFormState);
      setEvidence(null);
      setAiNotice("");
    }
  };

  return (
    <div className="form-page-wrapper">
      <div className="complaint-container">
        <header className="form-header">
          <div className="form-icon"><Shield size={32} color="white" fill="white" /></div>
          <h2>Official Complaint Filing</h2>
          <p>Please enter the required information below to file an official criminal complaint record.</p>
        </header>

        <form onSubmit={handleSubmit} className="styled-form fade-in">
          {aiNotice && (
            <div className="ai-notice-badge" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", color: "#10b981", padding: "12px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
              <CheckCircle size={18} /> {aiNotice}
            </div>
          )}

          <div className="form-section">
            <div className="section-title"><User size={18} /> Personal Info</div>
            <div className="input-grid">
              <input value={formData.name} placeholder="Full Name *" required onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <input value={formData.phone} placeholder="Phone *" required onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              <textarea className="full-width" value={formData.address} placeholder="Address *" required onChange={e => setFormData({ ...formData, address: e.target.value })} />
              <input value={formData.city} placeholder="City *" required onChange={e => setFormData({ ...formData, city: e.target.value })} />
              <input value={formData.state} placeholder="State *" required onChange={e => setFormData({ ...formData, state: e.target.value })} />
              <input value={formData.zip} placeholder="ZIP *" required onChange={e => setFormData({ ...formData, zip: e.target.value })} />
            </div>
          </div>

          <div className="form-section">
            <div className="section-title"><AlertCircle size={18} /> Incident Details</div>
            <div className="input-grid">
              <input type="date" required value={formData.incident_date} onChange={e => setFormData({ ...formData, incident_date: e.target.value })} />
              <input type="time" required value={formData.incident_time} onChange={e => setFormData({ ...formData, incident_time: e.target.value })} />
              <input className="full-width" placeholder="Location *" required value={formData.incident_location} onChange={e => setFormData({ ...formData, incident_location: e.target.value })} />
              <input className="full-width" placeholder="Accused Names" value={formData.accused_names} onChange={e => setFormData({ ...formData, accused_names: e.target.value })} />
            </div>
          </div>

          <div className="form-section">
            <div className="section-title"><MapPin size={18} /> Jurisdiction</div>
            <div className="input-grid">
              <select required onChange={handleUnitTypeChange}>
                <option value="">Select Unit Type *</option>
                {dropdowns.unitTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select required onChange={handleUnitChange}>
                <option value="">Select Unit *</option>
                {dropdowns.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select required value={formData.police_station_id} onChange={e => setFormData({ ...formData, police_station_id: e.target.value })}>
                <option value="">Select Station *</option>
                {dropdowns.stations.map(s => <option key={s.id} value={s.id}>{s.station_name}</option>)}
              </select>
              <select required value={formData.complaint_type_id} onChange={e => setFormData({ ...formData, complaint_type_id: e.target.value })}>
                <option value="">Select Complaint Type *</option>
                {dropdowns.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title">Description & Evidence</div>
            <textarea 
              className="full-width desc-area" 
              placeholder="Describe the crime or incident details in full depth..." 
              required 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
            />
            <div className="file-input-wrapper">
              <label className="custom-file-upload">
                <FileUp size={20} />
                {/* CHANGED: "Upload Evidence Document (Optional)" turned into a crisp mandatory target message */}
                {evidence ? evidence.name : "Upload Required Evidence Document"}
                {/* CHANGED: Added direct HTML5 browser form validation attribute 'required' */}
                <input type="file" required onChange={e => setEvidence(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleReset}><RotateCcw size={18} /> Reset Form</button>
            <button type="submit" className="btn-primary">Submit Official Complaint <Send size={18} /></button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComplaintForm;