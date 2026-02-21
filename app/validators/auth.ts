import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    nickname: vine.string().trim().minLength(3).maxLength(16),
    name: vine.string().trim().minLength(3).maxLength(32).optional(),
    surname: vine.string().trim().minLength(3).maxLength(32).optional(),
    email: vine.string().email().trim().unique(async (db, value) => {
      const user = await db.from('users').where('email', value).first()
      return !user
    }),
    password: vine.string().minLength(8).confirmed()
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string()
  })
)