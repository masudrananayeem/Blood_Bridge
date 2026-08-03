import axiosInstance from "./axiosInstance.js";

export const sendFeedback = async (payload) => {
  const { data } = await axiosInstance.post("/feedback", payload);
  return data;
};

export const getMyFeedback = async () => {
  const { data } = await axiosInstance.get("/feedback/my");
  return data;
};

// Admin-only
export const getAllFeedback = async (filters = {}) => {
  const { data } = await axiosInstance.get("/feedback", { params: filters });
  return data;
};

export const updateFeedbackStatus = async (id, status) => {
  const { data } = await axiosInstance.patch(`/feedback/${id}/status`, { status });
  return data;
};
