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

export const providerParamValidator = vine.create(
  vine.object({
    params: vine.object({
      provider: vine.enum(['discord', 'github']),
    }),
  }),
)

export const registerValidator = vine.create(
  vine.object({
    nickname: vine.string().trim().minLength(3).maxLength(16),
    name: vine.string().trim().minLength(3).maxLength(32).optional(),
    surname: vine.string().trim().minLength(3).maxLength(32).optional(),
    email: vine.string().email().trim().unique(async (db, value) => {
      const user = await db.from('users').where('email', value).first()
      return !user
    }),
    password: vine.string().minLength(8).confirmed(),
  }),
)

export const loginValidator = vine.create(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string(),
  }),
)
