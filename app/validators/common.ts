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