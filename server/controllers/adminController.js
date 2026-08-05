import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import notify from "../utils/notify.js";
import { deleteUserCascade } from "../utils/deleteUserData.js";
import { readBody } from "../utils/request.js";
import { HttpError } from "../middlewares/errorHandler.js";

const loadUsers = async () => serializeDocs(await collections.users.get());
const loadRequests = async () => serializeDocs(await collections.requests.get());
const loadDonationHistory = async () => serializeDocs(await collections.donationHistory.get());

const sortByDateDesc = (items, field = "createdAt") =>
  [...items].sort((left, right) => new Date(right[field] || 0) - new Date(left[field] || 0));

// @route  GET /api/admin/analytics
// @desc   Aggregated data for the Reports & Analytics charts
export const getAnalytics = async (c) => {
  const [users, requests] = await Promise.all([loadUsers(), loadRequests()]);
  // Exclude admins AND accounts that never finished their profile.
  const bloodGroupCounts = users
    .filter((user) => user.role !== "admin" && user.profileComplete !== false && user.bloodGroup)
    .reduce((accumulator, user) => {
      accumulator[user.bloodGroup] = (accumulator[user.bloodGroup] || 0) + 1;
      return accumulator;
    }, {});
  const requestStatusCounts = requests.reduce((accumulator, request) => {
    accumulator[request.status] = (accumulator[request.status] || 0) + 1;
    return accumulator;
  }, {});

  const bloodGroupDistribution = Object.entries(bloodGroupCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bloodGroup, count]) => ({ bloodGroup, count }));
  const requestStatusBreakdown = Object.entries(requestStatusCounts).map(([status, count]) => ({ status, count }));

  return c.json({ success: true, bloodGroupDistribution, requestStatusBreakdown });
};

// @route  GET /api/admin/stats
export const getDashboardStats = async (c) => {
  const [users, requests, donationHistory, organizations] = await Promise.all([
    loadUsers(),
    loadRequests(),
    loadDonationHistory(),
    serializeDocs(await collections.organizations.get()),
  ]);

  const visibleUsers = users.filter((user) => user.role !== "admin");
  const completeUsers = visibleUsers.filter((user) => user.profileComplete !== false);
  const incompleteProfiles = visibleUsers.length - completeUsers.length;

  const stats = {
    totalUsers: completeUsers.length,
    totalDonors: completeUsers.filter((user) => user.activeMode === "donor").length,
    totalSeekers: completeUsers.filter((user) => user.activeMode === "seeker").length,
    pendingRequests: requests.filter((request) => request.status === "pending").length,
    completedDonations: donationHistory.length,
    totalOrganizations: organizations.length,
    incompleteProfiles,
  };

  return c.json({ success: true, stats });
};

// @route  GET /api/admin/users?mode=donor&search=&page=1
export const getAllUsers = async (c) => {
  const query = c.req.query();
  const { mode, search } = query;
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 12);

  const users = (await loadUsers())
    .filter((user) => user.role !== "admin")
    .filter((user) => !mode || user.activeMode === mode)
    .filter(
      (user) =>
        !search ||
        [user.fullName, user.email, user.phone].some((value) => value?.toLowerCase().includes(search.toLowerCase()))
    );

  const sortedUsers = sortByDateDesc(users);
  const total = sortedUsers.length;
  const startIndex = (page - 1) * limit;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + limit);

  return c.json({
    success: true,
    users: paginatedUsers,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
};

// @route  PATCH /api/admin/users/:id/verify
export const toggleVerifyUser = async (c) => {
  const userRef = collections.users.doc(c.req.param("id"));
  const user = serializeDoc(await userRef.get());
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.profileComplete === false) {
    throw new HttpError(409, "This account hasn't finished registration yet — it can't be verified.");
  }

  const isVerified = !user.isVerified;
  await userRef.update({ isVerified, updatedAt: FieldValue.serverTimestamp() });
  if (isVerified) {
    await notify(user.id, "verified", "আপনার প্রোফাইল অ্যাডমিন কর্তৃক ভেরিফাই করা হয়েছে।");
  }
  return c.json({ success: true, isVerified });
};

// @route  DELETE /api/admin/users/:id
export const deleteUser = async (c) => {
  const userRef = collections.users.doc(c.req.param("id"));
  const user = serializeDoc(await userRef.get());
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  await deleteUserCascade(user);
  return c.json({ success: true, message: "User deleted" });
};

// @route  GET /api/admin/requests?status=pending
export const getAllRequests = async (c) => {
  const requests = (await loadRequests()).filter(
    (request) => !c.req.query("status") || request.status === c.req.query("status")
  );

  return c.json({ success: true, requests: sortByDateDesc(requests) });
};

// @route  PATCH /api/admin/requests/:id/status
export const updateRequestStatus = async (c) => {
  const body = await readBody(c);
  const { status } = body;
  if (!["pending", "accepted", "completed", "cancelled", "rejected"].includes(status)) {
    throw new HttpError(400, "Invalid status");
  }

  const requestRef = collections.requests.doc(c.req.param("id"));
  const request = serializeDoc(await requestRef.get());
  if (!request) {
    throw new HttpError(404, "Request not found");
  }

  if (status === "completed" && request.acceptedDonorUid && !request.completedDonationRecorded) {
    const historyRef = await collections.donationHistory.add({
      donorUid: request.acceptedDonorUid,
      donorName: request.acceptedDonorName || "",
      bloodGroup: request.bloodGroup,
      units: request.units,
      hospital: request.hospital,
      district: request.district,
      donationDate: FieldValue.serverTimestamp(),
      requestId: request.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await Promise.all([
      collections.users.doc(request.acceptedDonorUid).update({
        lastDonationDate: FieldValue.serverTimestamp(),
        isAvailable: false,
        updatedAt: FieldValue.serverTimestamp(),
      }),
      requestRef.update({
        status,
        completedDonationRecorded: true,
        completedDonationHistoryId: historyRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);
  } else {
    await requestRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
  }

  return c.json({ success: true, request: serializeDoc(await requestRef.get()) });
};