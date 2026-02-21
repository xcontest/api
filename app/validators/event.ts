import vine from '@vinejs/vine'

export const createEventValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    slug: vine.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).unique(async (db, value) => {
      const match = await db.from('events').where('slug', value).first()
      return !match
    }),
    description: vine.string().trim().escape(),
    status: vine.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const),
    accessCode: vine.string().trim().optional(),
    
    // TODO: ensure min < max
    minTeamSize: vine.number().min(1),
    maxTeamSize: vine.number().min(1),
  })
)