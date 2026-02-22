import vine from '@vinejs/vine'

const organizationSchema = {
  name: vine.string().trim().minLength(3).maxLength(255),
  description: vine.string().trim().escape().maxLength(2000).optional(),
  logoUrl: vine.string().url().optional(),
  websiteUrl: vine.string().url().optional(),
}

/**
 * Validator to validate the payload when creating
 * a new organization.
 */
export const createOrganizationValidator = vine.compile(
  vine.object(organizationSchema)
)

/**
 * Validator to validate the payload when updating
 * an existing organization.
 */
export const updateOrganizationValidator = vine.compile(
  vine.object(organizationSchema)
)

export const createSponsorValidator = vine.compile(
  vine.object({
    taskId: vine.string().uuid(),
    organizationId: vine.string().uuid(),
  })
)