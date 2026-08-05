import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import { deleteCloudinaryImage } from "../utils/cloudinary.js";
import { readBody } from "../utils/request.js";
import { HttpError } from "../middlewares/errorHandler.js";

const sortByNewest = (items) =>
  [...items].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

// @route  GET /api/organizations
// @desc   Directory of blood donor organizations / voluntary groups.
export const getOrganizations = async (c) => {
  const query = c.req.query();
  const { district, type, search } = query;
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

  return c.json({ success: true, organizations: sortByNewest(organizations) });
};

// @route  GET /api/organizations/:id
export const getOrganizationById = async (c) => {
  const organization = serializeDoc(await collections.organizations.doc(c.req.param("id")).get());
  if (!organization) {
    throw new HttpError(404, "Organization not found");
  }
  return c.json({ success: true, organization });
};

// @route  POST /api/organizations  (admin only)
export const createOrganization = async (c) => {
  const body = await readBody(c);
  const { name, type, description, district, upazila, address, phone, email, website, logoURL } = body;

  if (!name || !district || !phone) {
    throw new HttpError(400, "name, district, and phone are required");
  }

  const user = c.get("user");
  const orgRef = await collections.organizations.add({
    name,
    type: type || "Voluntary Group",
    description: description || "",
    district,
    upazila: upazila || "",
    address: address || "",
    phone,
    email: email || "",
    website: website || "",
    logoURL: logoURL || "",
    isVerified: false,
    createdBy: user.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const organization = serializeDoc(await orgRef.get());
  return c.json({ success: true, organization }, 201);
};

// @route  PUT /api/organizations/:id  (admin only)
export const updateOrganization = async (c) => {
  const body = await readBody(c);
  const orgRef = collections.organizations.doc(c.req.param("id"));
  const existing = serializeDoc(await orgRef.get());
  if (!existing) {
    throw new HttpError(404, "Organization not found");
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
    if (body[field] !== undefined) updates[field] = body[field];
  });

  const logoChanged = updates.logoURL !== undefined && updates.logoURL !== existing.logoURL;

  await orgRef.update(updates);
  if (logoChanged && existing.logoURL) deleteCloudinaryImage(existing.logoURL);

  const organization = serializeDoc(await orgRef.get());
  return c.json({ success: true, organization });
};

// @route  PATCH /api/organizations/:id/verify  (admin only)
export const toggleVerifyOrganization = async (c) => {
  const orgRef = collections.organizations.doc(c.req.param("id"));
  const existing = serializeDoc(await orgRef.get());
  if (!existing) {
    throw new HttpError(404, "Organization not found");
  }
  await orgRef.update({ isVerified: !existing.isVerified, updatedAt: FieldValue.serverTimestamp() });
  const organization = serializeDoc(await orgRef.get());
  return c.json({ success: true, organization });
};

// @route  DELETE /api/organizations/:id  (admin only)
export const deleteOrganization = async (c) => {
  const orgRef = collections.organizations.doc(c.req.param("id"));
  const existing = serializeDoc(await orgRef.get());
  if (!existing) {
    throw new HttpError(404, "Organization not found");
  }
  await orgRef.delete();
  if (existing.logoURL) deleteCloudinaryImage(existing.logoURL);
  return c.json({ success: true, message: "Organization removed" });
};