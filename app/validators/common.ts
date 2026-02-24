/*
 *          ______            __            __
 *    _  __/ ____/___  ____  / /____  _____/ /_
 *   | |/_/ /   / __ \/ __ \/ __/ _ \/ ___/ __/
 *  _>  </ /___/ /_/ / / / / /_/  __(__  ) /_
 * /_/|_|\____/\____/_/ /_/\__/\___/____/\__/
 *     Copyright (C) 2026 xContest Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 *
 */

import vine from '@vinejs/vine'
import { FieldContext } from '@vinejs/vine/types'

async function matchesConfirmation(value: unknown, _options: any, field: FieldContext) {
  if (typeof value !== 'string')
    return

  const expected = field.meta.expectedConfirmation

  if (value !== expected)
    field.report(
      `The confirmation text does not match the ${field.meta.confirmationMeta || "expected value"}.`,
      'matches',
      field
    )

}
const matchesConfirmationRule = vine.createRule(matchesConfirmation)

export const confirmationValidator = vine.compile(
  vine.object({
    confirmation: vine.string().use(matchesConfirmationRule()),
  })
)


export const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/im

export const notUUIDv4 = vine.createRule((value: unknown, _options: undefined, field: FieldContext) => {
  if (typeof value !== 'string')
    return true


  if(uuidV4Regex.test(value))
    field.report(`The ${field.name} cannot be a UUIDv4`, 'not_uuid_v4', field);

})

export const commonQuerySchema = vine.object({
  page: vine.number().positive().optional(),
  limit: vine.number().range([1, 100]).optional(),
  search: vine.string().trim().minLength(2).optional(),
  orderBy: vine.string().optional(),
  orderDirection: vine.enum(['asc', 'desc']).optional(),
  filter: vine
    .array(
      vine
        .string()
        .trim()
        .regex(/^[^:]+:[><=]?[^:]+$/)
    )
    .optional(),
})

export const commonQueryValidator = vine.compile(commonQuerySchema)

export const paramsIdValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.string().uuid()
    })
  })
)
