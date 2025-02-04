// Logout.js
import React from "react";
import axios from "axios";

const Logout = ({ setAuthenticated }) => {
  const handleLogout = async () => {
    try {
      // Make a POST request to the backend to handle the logout
      const response = await axios.post(
        "https://candidate-management-backend-1.onrender.com/candidates/logout/",
        {},
        {
          withCredentials: true, // Ensure the session cookie is sent with the request
        }
      );

      // Clear the JWT token from localStorage (if you're using JWT for authentication)
      localStorage.removeItem("access_token");

      // Update the state to reflect that the user is logged out
      setAuthenticated(false);

      console.log(response.data.message); // Optionally, show logout success message
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        borderRadius: "12px",
        border: "2px solid white",
        padding: "12px 16px", // Combines padding-top, padding-right, padding-bottom, padding-left.
        background:'white',
        color:"#FF8734",
        fontWeight:700,
        fontSize:'16px',
        cursor:'pointer'
      }}
    >
      Logout
    </button>
  );
};

export default Logout;
