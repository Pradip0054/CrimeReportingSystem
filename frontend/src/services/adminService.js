import axios from "axios";

const API_URL = "http://localhost:8000/api";

/**
 * 1. Generate authentication headers with the stored Sanctum token.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
};

const adminService = {
  getDashboardStats: async () => {
    return await axios.get(`${API_URL}/admin/dashboard`, getAuthHeaders());
  },

  /**
   * 2. Retrieve all complaints filed within the system for administrative review.
   */
  getAllComplaints: async () => {
    return await axios.get(`${API_URL}/admin/all-complaints`, getAuthHeaders());
  },

  getPoliceList: async () => {
    return await axios.get(`${API_URL}/admin/police-list`, getAuthHeaders());
  },

  createPoliceOfficer: async (payload) => {
    return await axios.post(`${API_URL}/admin/create-police`, payload, getAuthHeaders());
  },

  /**
   * 3. Fetch specific officers eligible to be assigned to a particular complaint.
   */
  getOfficersByComplaint: async (complaintId) => {
    return await axios.get(
      `${API_URL}/admin/complaints/${complaintId}/eligible-officers`, 
      getAuthHeaders()
    );
  },

  assignOfficer: async (complaintId, payload) => {
    return await axios.post(
      `${API_URL}/admin/assign/${complaintId}`, 
      payload, 
      getAuthHeaders()
    );
  },

  /**
   * 4. Get a comprehensive list of all police stations for administrative dropdown fields.
   */
  getAllPoliceStations: async () => {
    return await axios.get(`${API_URL}/all-police-stations`, getAuthHeaders());
  }
};

export default adminService;