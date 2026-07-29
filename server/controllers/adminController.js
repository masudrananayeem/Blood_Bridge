import admin from "../config/firebaseAdmin.js";
import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import notify from "../utils/notify.js";
import { deleteUserCascade } from "../utils/deleteUserData.js";

const loadUsers = async () => serializeDocs(await collections.users.get());
const loadRequests = async () => serializeDocs(await collections.requests.get());
const loadDonationHistory = async () => serializeDocs(await collections.donationHistory.get());

const sortByDateDesc = (items, field = "createdAt") =>
  [...items].sort((left, right) => new Date(right[field] || 0) - new Date(left[field] || 0));

// @route  GET /api/admin/analytics
// @desc   Aggregated data for the Reports & Analytics charts
export const getAnalytics = async (req, res, next) => {
  try {
    const [users, requests] = await Promise.all([loadUsers(), loadRequests()]);
    const bloodGroupCounts = users
      .filter((user) => user.role !== "admin")
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

    res.json({ success: true, bloodGroupDistribution, requestStatusBreakdown });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/admin/stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const [users, requests, donationHistory, organizations] = await Promise.all([
      loadUsers(),
      loadRequests(),
      loadDonationHistory(),
      serializeDocs(await collections.organizations.get()),
    ]);

    const visibleUsers = users.filter((user) => user.role !== "admin");
    const totalUsers = visibleUsers.length;
    const totalDonors = visibleUsers.filter((user) => user.activeMode === "donor").length;
    const totalSeekers = visibleUsers.filter((user) => user.activeMode === "seeker").length;
    const pendingRequests = requests.filter((request) => request.status === "pending").length;
    const completedDonations = donationHistory.length;
    const totalOrganizations = organizations.length;

    res.json({
      success: true,
      stats: { totalUsers, totalDonors, totalSeekers, pendingRequests, completedDonations, totalOrganizations },
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/admin/users?mode=donor&search=&page=1
export const getAllUsers = async (req, res, next) => {
  try {
    const { mode, search, page = 1, limit = 12 } = req.query;
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
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedUsers = sortedUsers.slice(startIndex, startIndex + Number(limit));

    res.json({ success: true, users: paginatedUsers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/admin/users/:id/verify
export const toggleVerifyUser = async (req, res, next) => {
  try {
    const userRef = collections.users.doc(req.params.id);
    const user = serializeDoc(await userRef.get());
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const isVerified = !user.isVerified;
    await userRef.update({ isVerified, updatedAt: FieldValue.serverTimestamp() });
    if (isVerified) {
      await notify(user.id, "verified", "আপনার প্রোফাইল অ্যাডমিন কর্তৃক ভেরিফাই করা হয়েছে।");
    }
    res.json({ success: true, isVerified });
  } catch (err) {
    next(err);
  }
};

// @route  DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const userRef = collections.users.doc(req.params.id);
    const user = serializeDoc(await userRef.get());
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    await deleteUserCascade(admin, user);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/admin/requests?status=pending
export const getAllRequests = async (req, res, next) => {
  try {
    const requests = (await loadRequests()).filter(
      (request) => !req.query.status || request.status === req.query.status
    );

    res.json({ success: true, requests: sortByDateDesc(requests) });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/admin/requests/:id/status
export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["pending", "accepted", "completed", "cancelled"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const requestRef = collections.requests.doc(req.params.id);
    const request = serializeDoc(await requestRef.get());
    if (!request) {
      res.status(404);
      throw new Error("Request not found");
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

    res.json({ success: true, request: serializeDoc(await requestRef.get()) });
  } catch (err) {
    next(err);
  }
};
