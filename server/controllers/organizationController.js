import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import { deleteCloudinaryImage } from "../utils/cloudinaryHelpers.js";

const sortByNewest = (items) =>
  [...items].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

// @route  GET /api/organizations
// @desc   Public-to-logged-in-users directory of blood donor organizations
//         / voluntary groups — so a donor or seeker can see which real
//         organizations run blood drives, and reach them directly.
export const getOrganizations = async (req, res, next) => {
  try {
    const { district, type, search } = req.query;
    let organizations = serializeDocs(await collections.organizations.get());

    organizations = organizations
      .filter((org) => !district || org.district === district)
      .filter((org) => !type || org.type === type)
      .filter(
        (org) =>
          !search ||
          org.name.toLowerCase().includes(search.toLowerCase()) ||
          org.description?.toLowerCase().includes(search.toLowerCase())
      );

    res.json({ success: true, organizations: sortByNewest(organizations) });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/organizations/:id
export const getOrganizationById = async (req, res, next) => {
  try {
    const organization = serializeDoc(await collections.organizations.doc(req.params.id).get());
    if (!organization) {
      res.status(404);
      throw new Error("Organization not found");
    }
    res.json({ success: true, organization });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/organizations  (admin only)
export const createOrganization = async (req, res, next) => {
  try {
    const { name, type, description, district, upazila, address, phone, email, website, logoURL } = req.body;

    if (!name || !district || !phone) {
      res.status(400);
      throw new Error("name, district, and phone are required");
    }

    const orgRef = await collections.organizations.add({
      name,
      type: type || "Voluntary Group", // "Voluntary Group" | "NGO" | "Blood Bank" | "Hospital"
      description: description || "",
      district,
      upazila: upazila || "",
      address: address || "",
      phone,
      email: email || "",
      website: website || "",
      logoURL: logoURL || "",
      isVerified: false,
      createdBy: req.user.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const organization = serializeDoc(await orgRef.get());
    res.status(201).json({ success: true, organization });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/organizations/:id  (admin only)
export const updateOrganization = async (req, res, next) => {
  try {
    const orgRef = collections.organizations.doc(req.params.id);
    const existing = serializeDoc(await orgRef.get());
    if (!existing) {
      res.status(404);
      throw new Error("Organization not found");
    }

    const editable = [
      "name",
      "type",
      "description",
      "district",
      "upazila",
      "address",
      "phone",
      "email",
      "website",
      "logoURL",
    ];
    const updates = { updatedAt: FieldValue.serverTimestamp() };
    editable.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const logoChanged = updates.logoURL !== undefined && updates.logoURL !== existing.logoURL;

    await orgRef.update(updates);
    if (logoChanged && existing.logoURL) deleteCloudinaryImage(existing.logoURL);

    const organization = serializeDoc(await orgRef.get());
    res.json({ success: true, organization });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/organizations/:id/verify  (admin only)
export const toggleVerifyOrganization = async (req, res, next) => {
  try {
    const orgRef = collections.organizations.doc(req.params.id);
    const existing = serializeDoc(await orgRef.get());
    if (!existing) {
      res.status(404);
      throw new Error("Organization not found");
    }
    await orgRef.update({ isVerified: !existing.isVerified, updatedAt: FieldValue.serverTimestamp() });
    const organization = serializeDoc(await orgRef.get());
    res.json({ success: true, organization });
  } catch (err) {
    next(err);
  }
};

// @route  DELETE /api/organizations/:id  (admin only)
export const deleteOrganization = async (req, res, next) => {
  try {
    const orgRef = collections.organizations.doc(req.params.id);
    const existing = serializeDoc(await orgRef.get());
    if (!existing) {
      res.status(404);
      throw new Error("Organization not found");
    }
    await orgRef.delete();
    if (existing.logoURL) deleteCloudinaryImage(existing.logoURL);
    res.json({ success: true, message: "Organization removed" });
  } catch (err) {
    next(err);
  }
};
