import prisma from "../../config/prisma.js";

const DEFAULT_CONTACT = {
  phone: "০১৭১২-৩৪৫৬৭৮",
  email: "contact@phulpurblood.org",
  whatsapp: "+8801712345678",
};

const getPlatformContact = async () => {
  let contact = await prisma.platformContact.findFirst({
    include: {
      updatedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!contact) {
    contact = await prisma.platformContact.create({
      data: DEFAULT_CONTACT,
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  return contact;
};

const updatePlatformContact = async (
  payload: { phone: string; email: string; whatsapp: string },
  adminUserId: string,
) => {
  const existing = await prisma.platformContact.findFirst();

  let contact;
  if (existing) {
    contact = await prisma.platformContact.update({
      where: { id: existing.id },
      data: {
        phone: payload.phone.trim(),
        email: payload.email.trim().toLowerCase(),
        whatsapp: payload.whatsapp.trim(),
        updatedById: adminUserId,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  } else {
    contact = await prisma.platformContact.create({
      data: {
        phone: payload.phone.trim(),
        email: payload.email.trim().toLowerCase(),
        whatsapp: payload.whatsapp.trim(),
        updatedById: adminUserId,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  return {
    ...contact,
    message: "Platform contact information updated successfully.",
  };
};

export const ContactService = {
  getPlatformContact,
  updatePlatformContact,
};

export default ContactService;
