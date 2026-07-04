import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const citizenService = {
  /**
   * 1. Retrieve individual citizen dashboard performance counters and report grids.
   */
  getCitizenStats: async () => {
    const token = localStorage.getItem('token'); 
    
    /**
     * 2. Execute cross-origin request securely bounded with Sanctum Bearer tokens.
     */
    return await axios.get(`${API_URL}/citizen/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};

export default citizenService;