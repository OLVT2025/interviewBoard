import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  CircularProgress,
  Box,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Pagination,
} from "@mui/material";
import Logout from "../Logout";
import DownloadIcon from "@mui/icons-material/Download";
import selectImg from "../assests/select.png";
import rejectImg from "../assests/reject.png";

const CandidateList = ({ activeTeamId, setAuthenticated, activeTeamName }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openRejectionDialog, setOpenRejectionDialog] = useState(false); // For rejection comment dialog
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [rejectionComment, setRejectionComment] = useState(""); // To store the rejection comment
  const [searchQuery, setSearchQuery] = useState("");
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // const [pageSize, setPageSize] = useState(10); // Default page size

  const [timeSlots, setTimeSlots] = useState({});
  const [error, setError] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [allTimeSlots, setAllTimeSlots] = useState({}); // New state for storing all time slots

  console.log(timeSlots, "timeSlotsdsdsd", selectedDateTime);

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    fetchCandidates(newPage);
  };

  const fetchTimeSlots = async (candidateId) => {
    try {
      // setLoading(true);
      const response = await axios.get(
        `http://127.0.0.1:8000/candidates/get-interviewers/${candidateId}/time-slots/`
      );
      setTimeSlots(response.data.time_slots || {});
      setError(""); // Clear previous errors if any
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while fetching time slots."
      );
    } finally {
      // setLoading(false);
    }
  };

  // useEffect(() => {
  //   const fetchTimeSlots = async () => {
  //     try {
  //       // setLoading(true);
  //       const response = await axios.get(
  //         `http://127.0.0.1:8000/candidates/get-interviewers/${selectedCandidate?.id}/time-slots/`
  //       );
  //       setTimeSlots(response.data.time_slots || {});
  //       setError(""); // Clear previous errors if any
  //     } catch (err) {
  //       setError(
  //         err.response?.data?.message ||
  //           "An error occurred while fetching time slots."
  //       );
  //     } finally {
  //       // setLoading(false);
  //     }
  //   };

  //   if (selectedCandidate?.id) {
  //     fetchTimeSlots();
  //   }
  // }, [selectedCandidate?.id]);

  // New function to fetch time slots for all candidates
  const fetchAllTimeSlots = async (candidatesList) => {
    const slotsMap = {};
    for (const candidate of candidatesList) {
      slotsMap[candidate.id] = await fetchTimeSlots(candidate.id);
    }
    setAllTimeSlots(slotsMap);
  };

  const fetchCandidates = useCallback(
    async (page = 1, pageSize = 10) => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/candidates/get-interviewers/",
          {
            params: { activeTeamId, page, page_size: pageSize },
            withCredentials: true,
          }
        );
        setCandidates(response.data);
        setTotalPages(response.data.total_pages);
        setCurrentPage(response.data.current_page);

        // Fetch time slots for all candidates after getting the candidate list
        if (response.data.candidates) {
          await fetchAllTimeSlots(response.data.candidates);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        setLoading(false);
      }
    },
    [activeTeamId]
  ); // Dependency array

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Add visibilitychange listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab has become visible, refresh data
        fetchCandidates();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchCandidates]);

  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenModal(true);
  };

  const handleConfirmSchedule = async () => {
    // if (!selectedDateTime || selectedDateTime < new Date()) {
    //   alert("Please select a valid future date and time.");
    //   return;
    // }

    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.post(
        `https://candidate-management-backend-1.onrender.com/candidates/update_status/${selectedCandidate.id}/Interview Scheduled/`,
        { scheduled_time: selectedTimeSlot.toString(), activeTeamId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setOpenModal(false);
      setSelectedCandidate(null);
      setSelectedDateTime(new Date());
      fetchCandidates();
      if (response.status === 200) {
        // Send email notification to HR
        sendMailToHR(
          selectedCandidate.id,
          "Interview Scheduled",
          selectedCandidate.name
        );

        // Update the UI or state (if required)
        console.log(
          `Status updated to Rejected for candidate ${selectedCandidate.id}`
        );
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCandidate(null);
  };

  const handleReject = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenRejectionDialog(true); // Open rejection comment dialog
  };

  const handleRejectionSubmit = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/candidates/update_status/${selectedCandidate.id}/Rejected/`,
        { comment: rejectionComment, activeTeamId }, // Send the rejection comment to backend
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setOpenRejectionDialog(false); // Close the rejection comment dialog
      setRejectionComment(""); // Clear the comment input
      if (response.status === 200) {
        // Send email notification to HR
        sendMailToHR(selectedCandidate.id, "Rejected", selectedCandidate.name);

        // Update the UI or state (if required)
        console.log(
          `Status updated to Rejected for candidate ${selectedCandidate.id}`
        );
      } else {
        console.error("Failed to update status");
      }
      fetchCandidates(); // Fetch the updated candidates list
    } catch (error) {
      console.error("Error rejecting candidate:", error);
    }
  };

  const updateStatus = async (id, status, candidateName) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.post(
        `https://candidate-management-backend-1.onrender.com/candidates/update_status/${id}/${status}/`,
        { activeTeamId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        // Send email notification to HR
        sendMailToHR(id, status, candidateName);

        // Update the UI or state (if required)
        console.log(`Status updated to ${status} for candidate ${id}`);
      } else {
        console.error("Failed to update status");
      }
      fetchCandidates();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Function to send mail to HR
  const sendMailToHR = async (candidateId, newStatus, candidateName) => {
    try {
      const response = await axios.post(
        "https://candidate-management-backend-1.onrender.com/candidates/send-mail/",
        {
          candidateId,
          status: newStatus,
          activeTeamName,
          candidateName,
        }
      );

      if (response.status === 200) {
        console.log(
          `Mail sent to HR for candidate ${candidateId} with status ${newStatus}`
        );
      } else {
        console.error("Failed to send mail");
      }
    } catch (error) {
      console.error("Error sending mail:", error);
    }
  };

  const handleSlotChange = (selectedSlot) => {
    setSelectedTimeSlot(selectedSlot);
  };

  const confirmSchedule = () => {
    if (!selectedTimeSlot) {
      alert("Please select a time slot.");
      return;
    }
    handleConfirmSchedule(); // Pass the selected time slot to the parent handler
  };

  const requestTimeSlots = async (candidate) => {
    setTimeSlotsLoading(true);
    try {
      const response = await axios.post(
        "https://candidate-management-backend-1.onrender.com/candidates/request-time-slots/",
        {
          email: candidate.email,
          id: candidate.id,
        }
      );
      alert(response.data.message);
    } catch (error) {
      alert("Failed to send email. Please try again.");
      console.error(error);
    } finally {
      setTimeSlotsLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const filteredCandidates = candidates?.candidates?.filter(
    (candidate) =>
      candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate?.skillset?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate?.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    // Format components individually
    const day = new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(
      date
    );
    const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      date
    );
    const year = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(
      date
    );
    const weekday = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
    }).format(date);

    // Construct the desired format
    return `${day} ${month} ${year}, ${weekday}`;
  };
  return (
    <Box
      sx={{
        // height: "100vh",
        backgroundColor: "#F6F6F6",
        paddingLeft: "60px",
        paddingRight: "60px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{
            fontWeight: 700, // Bold text
            fontSize: "48px", // Font size
            textAlign: "center", // Center-align text
            background: "linear-gradient(to right, #FFB622, #ed6c02)", // Gradient color
            WebkitBackgroundClip: "text", // Clip the gradient to the text
            color: "transparent", // Makes the text itself transparent to show the gradient
            padding: "20px 0", // Padding for spacing above and below
            lineHeight: "60px", // Line height
          }}
        >
          OLVT Talent Sphere
        </Typography>
        <Logout setAuthenticated={setAuthenticated} />
      </div>
      <div style={{ margin: "20px 0" }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search"
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
          placeholder="Search by name, skillset, or status"
          sx={{
            borderRadius: 1, // Adds rounded corners
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px", // Smooth rounded corners
              backgroundColor: "white", // Set background to white
              "& fieldset": {
                borderColor: "transparent", // Remove default border
              },
              "&:hover fieldset": {
                borderColor: "transparent", // Remove hover border color
              },
              "&.Mui-focused fieldset": {
                borderColor: "transparent", // Remove blue border on focus
              },
            },
          }}
          InputProps={{
            style: {
              borderRadius: "12px", // Match the rounded corners
              boxShadow:
                "inset 4px 2px 4px 0 rgba(95, 157, 231, 0.48), inset -4px -4px 2px 0 rgba(183, 211, 244, 0.2)", // Box shadow styling
            },
          }}
        />
      </div>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow:
            "4px 2px 8px 0 rgba(95, 157, 231, 0.48), -4px -2px 4px 0 rgba(255, 255, 255, 0.3)", // Subtle white shadow
          borderRadius: "12px",
          border: "none",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography
                  sx={{ color: "#1D1D1D", fontSize: "16px", fontWeight: 700 }}
                >
                  Name
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  sx={{ color: "#1D1D1D", fontSize: "16px", fontWeight: 700 }}
                >
                  Vendor
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  sx={{ color: "#1D1D1D", fontSize: "16px", fontWeight: 700 }}
                >
                  Y.O.E
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  sx={{ color: "#1D1D1D", fontSize: "16px", fontWeight: 700 }}
                >
                  Skillset
                </Typography>
              </TableCell>

              <TableCell>
                <Typography
                  sx={{ color: "#1D1D1D", fontSize: "16px", fontWeight: 700 }}
                >
                  Available Time Slots
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  sx={{ color: "#1D1D1D", fontSize: "16px", fontWeight: 700 }}
                >
                  Action
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCandidates?.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell
                  sx={{ color: "#455C7A", fontSize: "16px", fontWeight: 700 }}
                >
                  {candidate.name}
                </TableCell>
                <TableCell
                  sx={{ color: "#6B6B6B", fontSize: "16px", fontWeight: 400 }}
                >
                  {candidate.email}
                </TableCell>
                <TableCell
                  sx={{ color: "#6B6B6B", fontSize: "16px", fontWeight: 400 }}
                >
                  {candidate.years_of_experience}
                </TableCell>
                <TableCell
                  sx={{ color: "#6B6B6B", fontSize: "16px", fontWeight: 400 }}
                >
                  {candidate.skillset}
                </TableCell>
                <TableCell>
                  <Box sx={{ minWidth: "200px" }}>
                    {Object.entries(timeSlots).length > 0 ? (
                      <>
                        {Object.entries(timeSlots)
                          .slice(0, 1)
                          .map(([date, slots]) => (
                            <div key={date} style={{ marginTop: "1rem" }}>
                              <h4 style={{ marginBottom: "0.5rem" }}>
                                {formatDate(date)}
                              </h4>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fit, minmax(100px, 1fr))",
                                  gap: "0.5rem",
                                }}
                              >
                                {slots.slice(0, 3).map((slot, index) => (
                                  <button
                                    key={index}
                                    onClick={() =>
                                      handleSlotChange(`${date} ${slot}`)
                                    }
                                    style={{
                                      padding: "10px",
                                      borderRadius: "12px",
                                      border: "none",
                                      boxShadow:
                                        "4px 2px 8px 0 rgba(95, 157, 231, 0.48), -4px -2px 4px 0 rgba(255, 255, 255, 0.3)",
                                      backgroundColor:
                                        selectedTimeSlot === `${date} ${slot}`
                                          ? "#F18C27"
                                          : "#fff",
                                      color:
                                        selectedTimeSlot === `${date} ${slot}`
                                          ? "#fff"
                                          : "#7E97B8",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {slot}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        {Object.entries(timeSlots).length > 1 && (
                          <Button
                            onClick={() => handleScheduleInterview(candidate)}
                            variant="text"
                            sx={{
                              color: "#FF8734",
                              fontSize: "14px",
                              mt: 1,
                              textTransform: "none",
                              fontWeight: 600,
                              "&:hover": {
                                backgroundColor: "transparent",
                                textDecoration: "underline",
                              },
                            }}
                          >
                            View {Object.entries(timeSlots).length - 1} more
                            days...
                          </Button>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No time slots available
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      sx={{
                        textTransform: "none",
                        borderRadius: "12px",
                        background: "white",
                        color: "#FF8734",
                        fontWeight: 700,
                        paddingTop: "10px",
                        paddingBottom: "10px",
                        paddingLeft: "12px",
                        paddingRight: "12px",
                      }}
                      onClick={() => handleScheduleInterview(candidate)}
                    >
                      Schedule Interview
                    </Button>
                    {candidate.status === "Interview Scheduled" && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          sx={{
                            textTransform: "none",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 400,
                            backgroundColor: "#FF8734",
                            display: "flex",
                            flexDirection: "column",
                            paddingTop: "9px",
                            paddingBottom: "9px",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                          }}
                          onClick={() =>
                            updateStatus(
                              candidate.id,
                              "Selected",
                              candidate.name
                            )
                          }
                        >
                          <img
                            src={selectImg}
                            alt="select-img"
                            style={{ height: "24px", width: "24px" }}
                          />
                          Select
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          sx={{
                            textTransform: "none",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 400,
                            background: "white",
                            color: "black",
                            display: "flex",
                            flexDirection: "column",
                            paddingTop: "9px",
                            paddingBottom: "9px",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                          }}
                          onClick={() => handleReject(candidate)}
                        >
                          <img
                            src={rejectImg}
                            alt="select-img"
                            style={{ height: "24px", width: "24px" }}
                          />
                          Reject
                        </Button>
                      </>
                    )}
                    {candidate.status === "Selected" && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          sx={{
                            textTransform: "none",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 400,
                            display: "flex",
                            flexDirection: "column",
                            paddingTop: "9px",
                            paddingBottom: "9px",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                          }}
                          onClick={() => updateStatus(candidate.id, "Selected")}
                          disabled
                        >
                          <img
                            src={selectImg}
                            alt="select-img"
                            style={{ height: "24px", width: "24px" }}
                          />
                          Select
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          sx={{
                            textTransform: "none",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 400,
                            background: "white",
                            color: "black",
                            display: "flex",
                            flexDirection: "column",
                            paddingTop: "9px",
                            paddingBottom: "9px",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                          }}
                          onClick={() => handleReject(candidate)}
                          disabled
                        >
                          <img
                            src={rejectImg}
                            alt="select-img"
                            style={{ height: "24px", width: "24px" }}
                          />
                          Reject
                        </Button>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        color="primary"
        sx={{
          "& .MuiPaginationItem-root": {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "8px",
            padding: "8px 12px",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              backgroundColor: "#F15D27",
              color: "#fff",
              transform: "scale(1.1)",
            },
          },
          "& .MuiPaginationItem-page.Mui-selected": {
            backgroundColor: "#FF8734",
            color: "white",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#FF8734",
            },
          },
          "& .MuiPaginationItem-previous, & .MuiPaginationItem-next": {
            backgroundColor: "#357ABD",
            color: "#fff",
            borderRadius: "50%",
            padding: "8px",
            "&:hover": {
              backgroundColor: "#285A8E",
            },
          },
        }}
      />

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        style={{ maxHeight: "80vh" }}
      >
        <DialogTitle
          style={{ color: "#7E97B8", fontSize: "20px", fontWeight: 700 }}
        >
          Schedule Interview
        </DialogTitle>
        <DialogContent
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          <div style={{ color: "#7E97B8", fontSize: "16px", fontWeight: 400 }}>
            Select earliest{" "}
            <span
              style={{ color: "#7E97B8", fontSize: "16px", fontWeight: 700 }}
            >
              ONE
            </span>{" "}
            timeslot for 1-hour Interview with{" "}
            <span
              style={{ color: "#7E97B8", fontSize: "16px", fontWeight: 700 }}
            >
              {selectedCandidate?.name}.
            </span>
          </div>

          {loading ? (
            <CircularProgress />
          ) : error ? (
            <p>
              No available time slots for the candidate{" "}
              {selectedCandidate?.name}.
              <Button
                variant="contained"
                color="warning"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: "12px",
                  background: "white",
                  color: "#FF8734",
                  fontWeight: 700,
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                }}
                onClick={() => requestTimeSlots(selectedCandidate)}
              >
                {timeSlotsLoading ? (
                  <CircularProgress size={24} sx={{ color: "orange" }} />
                ) : (
                  "Request For Time Slots"
                )}
              </Button>
            </p>
          ) : Object.keys(timeSlots).length === 0 ? (
            <>
              <p>No available time slots.</p>
              <Button
                variant="contained"
                color="warning"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: "12px",
                  background: "white",
                  color: "#FF8734",
                  fontWeight: 700,
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                }}
                onClick={() => requestTimeSlots(selectedCandidate)}
              >
                {timeSlotsLoading ? (
                  <CircularProgress size={24} sx={{ color: "orange" }} />
                ) : (
                  "Request For Time Slots"
                )}
              </Button>
            </>
          ) : (
            Object.entries(timeSlots).map(([date, slots]) => (
              <div key={date} style={{ marginTop: "1rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>{formatDate(date)}</h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {slots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlotChange(`${date} ${slot}`)}
                      style={{
                        padding: "10px",
                        borderRadius: "12px",
                        border: "none",
                        boxShadow:
                          "4px 2px 8px 0 rgba(95, 157, 231, 0.48), -4px -2px 4px 0 rgba(255, 255, 255, 0.3)",
                        backgroundColor:
                          selectedTimeSlot === `${date} ${slot}`
                            ? "#F18C27"
                            : "#fff",
                        color:
                          selectedTimeSlot === `${date} ${slot}`
                            ? "#fff"
                            : "#7E97B8",
                        cursor: "pointer",
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </DialogContent>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            padding: "20px",
          }}
        >
          <Button
            onClick={handleCloseModal}
            color="secondary"
            style={{
              padding: "12px 16px",
              boxShadow:
                "4px 2px 8px 0 rgba(95, 157, 231, 0.48), -4px -2px 4px 0 rgba(255, 255, 255, 0.3)",
              borderRadius: "12px",
              border: "none",
              width: "100%",
              color: "#7E97B8",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmSchedule}
            color="primary"
            style={{
              padding: "12px 16px 12px 16px",
              boxShadow:
                "4px 2px 8px 0 rgba(95, 157, 231, 0.48), -4px -2px 4px 0 rgba(255, 255, 255, 0.3)",
              borderRadius: "12px",
              border: "none",
              width: "100%",
              backgroundColor:
                Object.keys(timeSlots).length === 0 ? "#E0E0E0" : "#FF8734",
              color:
                Object.keys(timeSlots).length === 0 ? "#A0A0A0" : "#FBFCFE",
              fontSize: "16px",
              fontWeight: 700,
              cursor:
                Object.keys(timeSlots).length === 0 ? "not-allowed" : "pointer",
            }}
            disabled={Object.keys(timeSlots).length === 0}
          >
            Schedule
          </Button>
        </div>
      </Dialog>

      {/* Rejection Comment Modal */}
      <Dialog
        open={openRejectionDialog}
        onClose={() => setOpenRejectionDialog(false)}
      >
        <DialogTitle
          style={{ color: "#7E97B8", fontSize: "20px", fontWeight: 700 }}
        >
          Reject Candidate
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            style={{
              color: "#7E97B8",
              fontSize: "16px",
              fontWeight: 400,
              marginBottom: "16px",
            }}
          >
            Please provide a reason for rejecting{" "}
            <span
              style={{ color: "#7E97B8", fontSize: "16px", fontWeight: 700 }}
            >
              {selectedCandidate?.name}.
            </span>
          </DialogContentText>
          <TextField
            fullWidth
            label="Rejection Comment"
            value={rejectionComment}
            onChange={(e) => setRejectionComment(e.target.value)}
            multiline
            rows={4}
          />
        </DialogContent>
        {/* <DialogActions> */}
        <div
          style={{
            display: "flex",
            paddingLeft: "25px",
            paddingRight: "20px",
            paddingBottom: "20px",
            gap: "10px",
          }}
        >
          <Button
            onClick={() => setOpenRejectionDialog(false)}
            color="secondary"
            style={{
              width: "100%",
              color: "#FBFCFE",
              backgroundColor: "#F15D27",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectionSubmit}
            color="primary"
            style={{
              width: "100%",
              color: "#F15D27",
              borderRadius: "12px",
              boxShadow:
                "4px 2px 8px 0 rgba(95, 157, 231, 0.48), -4px -2px 4px 0 rgba(255, 255, 255, 0.3)",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Submit
          </Button>
        </div>
        {/* </DialogActions> */}
      </Dialog>
    </Box>
  );
};

export default CandidateList;
