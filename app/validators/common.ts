import vine from '@vinejs/vine'
import { FieldContext } from '@vinejs/vine/types'

async function matchesConfirmation(
  value: unknown,
  _options: any,
  field: FieldContext
) {
  if (typeof value !== 'string') return

  const expected = field.meta.expectedConfirmation

  if (value !== expected) {
    field.report(
      'The confirmation text does not match the event title',
      'matches',
      field
    )
  }
}
const matchesConfirmationRule = vine.createRule(matchesConfirmation)

export const confirmationValidator = vine.compile(
  vine.object({
    confirmation: vine.string().use(matchesConfirmationRule())
  })
)

export const notUUIDv4 = vine.createRule((value: unknown, _options: undefined, field: FieldContext) => {
  if (typeof value !== 'string') {
    return true 
  }

  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/im
  if(uuidV4Regex.test(value)) {
    field.report(`The ${field.name} cannot be a UUIDv4`, 'not_uuid_v4', field);
  }
})
