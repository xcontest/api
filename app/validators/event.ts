import { partialSchema } from '#utils/schema'
import vine from '@vinejs/vine'

const eventSchema = {
  title: vine.string().trim().minLength(3).maxLength(255),
  description: vine.string().trim().escape(),
  status: vine.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const),
  
  // TODO: ensure min < max
  minTeamSize: vine.number().min(1),
  maxTeamSize: vine.number().min(1),
}

export const createEventValidator = vine.compile(
  vine.object({
    ...eventSchema,
    slug: vine.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).unique(async (db, value) => {
      const match = await db.from('events').where('slug', value).first()
      return !match
    }),
  })
)

export const updateEventValidator = vine.compile(
  vine.object({
    ...partialSchema(eventSchema), // Is there a standard way to get partial object in vine?
    slug: vine.string().unique(async (db, value, field) => {
        if (value === field.meta.eventSlug) 
          return true // Ignore slug collision with self
        const match = await db
          .from('events')
          .where('slug', value)
          .first()
        return !match
      }).optional(),
  })
)