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
import { partialSchema } from '#utils/schema'
import { invitationValidity } from '#utils/teams'

const teamSchema = {
}

export const createTeamValidator = vine.compile(
  vine.object({
    ...teamSchema,
    name: vine.string().trim().unique(async (db, value, field) => {
      const eventId = field.meta.eventId
      const match = await db.from('teams').where('name', value).where('event_id', eventId).first()
      return !match
    }),
    accessCode: vine.string().optional(),
  }),
)

export const updateTeamValidator = vine.compile(
  vine.object({
    ...partialSchema(teamSchema),
    name: vine.string().trim().unique(async (db, value, field) => {
      if (value === field.meta.teamName)
        return true // Ignore name collision with self
      const eventId = field.meta.eventId
      const match = await db.from('teams').where('name', value).where('event_id', eventId).first()
      return !match
    }),
  }),
)

export const kickMemberValidator = vine.compile(
  vine.object({
    member: vine.string().uuid(),
    params: vine.object({
      id: vine.string().uuid(),
    }),
  }),
)

export const teamInvitationValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().optional(),
    validFor: vine.enum(Object.keys(invitationValidity)),
  }),
)

export const teamInvitationResponseValidator = vine.compile(
  vine.object({
    action: vine.enum(['ACCEPT', 'REJECT']).optional(),
    params: vine.object({
      id: vine.string().minLength(16).maxLength(45),
    }),
  }),
)

