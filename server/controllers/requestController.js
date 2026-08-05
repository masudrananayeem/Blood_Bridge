import { collections, serializeDoc, serializeDocs, FieldValue, toTimestamp } from "../utils/firestore.js";
import { distanceBetweenDistricts } from "../utils/districtCoords.js";
import { isInCooldown, getDaysUntilEligible } from "../utils/donationEligibility.js";
import notify from "../utils/notify.js";
import { readBody } from "../utils/request.js";
import { HttpError } from "../middlewares/errorHandler.js";

const loadUsers = async () => serializeDocs(await collections.users.get());
const loadRequests = async () => serializeDocs(await collections.requests.get());

const EMERGENCY_DONOR_COUNT = 5;

const sortRequests = (items) =>
  [...items].sort((left, right) => {
    const urgencyOrder = { High: 3, Medium: 2, Low: 1 };
    const urgencyDelta = (urgencyOrder[right.urgency] || 0) - (urgencyOrder[left.urgency] || 0);
    if (urgencyDelta !== 0) return urgencyDelta;
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });

const availableDonors = (users, seekerId) =>
  users.filter(
    (candidate) =>
      candidate.id !== seekerId &&
      candidate.role !== "admin" &&
      candidate.activeMode === "donor" &&
      candidate.isAvailable &&
      candidate.fullName &&
      candidate.bloodGroup
  );

// @route  POST /api/requests
// @desc   Create a blood request. Three modes, based on what the seeker sent:
//         1. targetDonorUid set  -> a direct request to ONE specific donor.
//         2. isEmergency: true   -> broadcast to only the 5 CLOSEST available
//            donors of the matching blood group (by district distance).
//         3. neither             -> normal broadcast to every available donor
//            with the same blood group + district (previous behaviour).
export const createRequest = async (c) => {
  const body = await readBody(c);
  const {
    bloodGroup,
    units,
    hospital,
    district,
    upazila,
    urgency,
    reason,
    neededByDate,
    message,
    targetDonorUid,
    isEmergency,
  } = body;

  const user = c.get("user");
  const users = await loadUsers();
  let notifiedDonorUids = [];
  let resolvedTargetDonor = null;

  if (targetDonorUid) {
    resolvedTargetDonor = users.find((candidate) => candidate.id === targetDonorUid);
    if (
      !resolvedTargetDonor ||
      resolvedTargetDonor.role === "admin" ||
      resolvedTargetDonor.activeMode !== "donor" ||
      !resolvedTargetDonor.fullName
    ) {
      throw new HttpError(404, "Selected donor not found");
    }
    if (!resolvedTargetDonor.isAvailable) {
      throw new HttpError(
        409,
        isInCooldown(resolvedTargetDonor.lastDonationDate)
          ? `এই ডোনার সম্প্রতি রক্ত দিয়েছেন — আরও ${getDaysUntilEligible(
              resolvedTargetDonor.lastDonationDate
            )} দিন পর আবার Available হবেন।`
          : "This donor is currently unavailable"
      );
    }
    notifiedDonorUids = [resolvedTargetDonor.id];
  } else if (isEmergency) {
    notifiedDonorUids = availableDonors(users, user.id)
      .filter((donor) => donor.bloodGroup === bloodGroup)
      .map((donor) => ({ id: donor.id, distanceKm: distanceBetweenDistricts(district, donor.district) }))
      .sort((left, right) => {
        const leftDist = left.distanceKm ?? Number.POSITIVE_INFINITY;
        const rightDist = right.distanceKm ?? Number.POSITIVE_INFINITY;
        return leftDist - rightDist;
      })
      .slice(0, EMERGENCY_DONOR_COUNT)
      .map((donor) => donor.id);
  } else {
    notifiedDonorUids = availableDonors(users, user.id)
      .filter((donor) => donor.bloodGroup === bloodGroup && donor.district === district)
      .map((donor) => donor.id);
  }

  const requestData = {
    seekerUid: user.id,
    seekerName: user.fullName,
    seekerPhone: user.phone,
    bloodGroup,
    units,
    hospital,
    district,
    upazila,
    urgency,
    reason: reason || "",
    message: message || "",
    neededByDate: toTimestamp(neededByDate),
    status: "pending",
    isEmergency: !!isEmergency && !targetDonorUid,
    targetDonorUid: targetDonorUid || null,
    targetDonorName: resolvedTargetDonor ? resolvedTargetDonor.fullName : null,
    notifiedDonorUids,
    acceptedDonorUid: null,
    acceptedDonorName: null,
    acceptedDonorPhone: null,
    rejectedByUids: [],
    completedDonationRecorded: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const requestRef = await collections.requests.add(requestData);
  const request = serializeDoc(await requestRef.get());

  const notificationText = targetDonorUid
    ? `${user.fullName} সরাসরি আপনাকে ${bloodGroup} রক্তের অনুরোধ পাঠিয়েছেন — ${hospital}, ${district}।${
        message ? ` বার্তা: "${message}"` : ""
      }`
    : isEmergency
    ? `🚨 জরুরি! ${hospital} এ ${bloodGroup} রক্তের জরুরি প্রয়োজন — ${district}, ${upazila}। আপনি নিকটতম ডোনারদের একজন।`
    : `${hospital} এ ${bloodGroup} রক্তের জরুরি প্রয়োজন — ${district}, ${upazila}`;

  await Promise.all(
    notifiedDonorUids.map((donorId) => notify(donorId, "request", notificationText, request.id))
  );

  return c.json({ success: true, request }, 201);
};

// @route  GET /api/requests/my-requests?status=pending
// @desc   List the logged-in seeker's own requests, optionally filtered by status
export const getMyRequests = async (c) => {
  const user = c.get("user");
  const requests = (await loadRequests()).filter((request) => request.seekerUid === user.id);
  const filtered = c.req.query("status") ? requests.filter((request) => request.status === c.req.query("status")) : requests;
  return c.json({ success: true, requests: sortRequests(filtered) });
};

// @route  PATCH /api/requests/:id/cancel
export const cancelRequest = async (c) => {
  const user = c.get("user");
  const requestRef = collections.requests.doc(c.req.param("id"));
  const request = serializeDoc(await requestRef.get());

  if (!request || request.seekerUid !== user.id) {
    throw new HttpError(404, "Request not found");
  }

  await requestRef.update({ status: "cancelled", updatedAt: FieldValue.serverTimestamp() });
  return c.json({ success: true, request: serializeDoc(await requestRef.get()) });
};

// @route  GET /api/requests/incoming
// @desc   Donor's queue: every pending request that specifically notified
//         this donor — direct requests, emergency nearest-5 picks, and normal
//         blood-group+district broadcasts — minus ones already declined.
export const getIncomingRequests = async (c) => {
  const user = c.get("user");
  const requests = (await loadRequests()).filter(
    (request) =>
      request.status === "pending" &&
      request.seekerUid !== user.id &&
      (request.notifiedDonorUids || []).includes(user.id) &&
      !(request.rejectedByUids || []).includes(user.id)
  );

  return c.json({ success: true, requests: sortRequests(requests) });
};

// @route  GET /api/requests/nearby
// @desc   Broader browse feed: other pending requests in/near the donor's
//         district that didn't specifically notify them.
export const getNearbyRequests = async (c) => {
  const user = c.get("user");
  const requests = (await loadRequests())
    .filter(
      (request) =>
        request.status === "pending" &&
        request.seekerUid !== user.id &&
        !(request.notifiedDonorUids || []).includes(user.id) &&
        !(request.rejectedByUids || []).includes(user.id)
    )
    .map((request) => ({ ...request, distanceKm: distanceBetweenDistricts(user.district, request.district) }))
    .filter((request) => request.distanceKm === null || request.distanceKm <= 100 || request.district === user.district);

  return c.json({ success: true, requests: sortRequests(requests).slice(0, 20) });
};

// @route  PATCH /api/requests/:id/respond
// @desc   Donor accepts or rejects a request from their Incoming list.
//         On accept: the seeker's copy now carries the donor's real
//         phone/email, the seeker gets a notification, and any other donors
//         who had been notified about the same request are told it's filled.
export const respondToRequest = async (c) => {
  const body = await readBody(c);
  const { action } = body; // "accept" | "reject"
  if (!["accept", "reject"].includes(action)) {
    throw new HttpError(400, "action must be 'accept' or 'reject'");
  }

  const user = c.get("user");
  const requestRef = collections.requests.doc(c.req.param("id"));
  const request = serializeDoc(await requestRef.get());

  if (!request) {
    throw new HttpError(404, "Request not found");
  }
  if (request.status !== "pending") {
    throw new HttpError(409, "This request is no longer pending");
  }

  if (action === "accept") {
    await requestRef.update({
      status: "accepted",
      acceptedDonorUid: user.id,
      acceptedDonorName: user.fullName,
      acceptedDonorPhone: user.phone,
      acceptedDonorEmail: user.email,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await notify(
      request.seekerUid,
      "accepted",
      `${user.fullName} আপনার রক্তের রিকোয়েস্ট গ্রহণ করেছেন — এখন তার সম্পূর্ণ যোগাযোগের তথ্য "My Requests" এ দেখতে পাবেন।`,
      request.id
    );

    // Let any other notified donors know this request has been filled.
    const others = (request.notifiedDonorUids || []).filter((id) => id !== user.id);
    await Promise.all(
      others.map((donorId) =>
        notify(donorId, "filled", `${request.bloodGroup} রক্তের একটি রিকোয়েস্ট অন্য একজন ডোনার গ্রহণ করেছেন — এটি আর সক্রিয় নেই।`, request.id)
      )
    );
  } else {
    const rejectedByUids = Array.from(new Set([...(request.rejectedByUids || []), user.id]));
    const notifiedDonorUids = request.notifiedDonorUids || [];

    // If this was a direct request to just this one donor, or every donor
    // who was ever notified about a broadcast/emergency request has now
    // declined, there's nobody left who could still accept it — resolve it
    // to a terminal "rejected" state so it moves into Request History.
    const noOneLeft = notifiedDonorUids.length > 0 && notifiedDonorUids.every((id) => rejectedByUids.includes(id));
    const nextStatus = noOneLeft ? "rejected" : "pending";

    await requestRef.update({ rejectedByUids, status: nextStatus, updatedAt: FieldValue.serverTimestamp() });

    await notify(
      request.seekerUid,
      "rejected",
      noOneLeft
        ? `আপনার ${request.bloodGroup} রক্তের রিকোয়েস্টটি ডোনার(রা) গ্রহণ করেননি — এটি এখন আপনার Request History তে পাবেন।`
        : `একজন ডোনার আপনার রিকোয়েস্ট প্রত্যাখ্যান করেছেন — অন্য ডোনাররা এখনো দেখতে পাচ্ছেন।`,
      request.id
    );
  }

  return c.json({ success: true, request: serializeDoc(await requestRef.get()) });
};