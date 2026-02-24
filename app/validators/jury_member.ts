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

const juryMemberSchema = {
  description: vine.string().trim().escape().maxLength(2000).optional(),
  organizationId: vine.string().uuid().nullable().optional(),
}

/**
 * Validator to validate the payload when creating
 * a new jury member.
 */
export const createJuryMemberValidator = vine.compile(
  vine.object({
    ...juryMemberSchema,
    userId: vine.number().positive(),
  }),
)

/**
 * Validator to validate the payload when updating
 * an existing jury member.
 */
export const updateJuryMemberValidator = vine.compile(
  vine.object(juryMemberSchema),
)
