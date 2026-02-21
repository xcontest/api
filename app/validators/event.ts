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

import { partialSchema } from '#utils/schema'
import vine from '@vinejs/vine'
import { notUUIDv4 } from './common.js'

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
    slug: vine.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).use(notUUIDv4()).unique(async (db, value) => {
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

export const storeAdministratorValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
    permissions: vine.number().min(0).optional(),
  })
)

export const updateAdministratorValidator = vine.compile(
  vine.object({
    permissions: vine.number().min(0),
  })
)
