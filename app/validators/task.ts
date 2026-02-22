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

const taskCoreSchema = {
  title: vine.string().trim().minLength(3).maxLength(255),
  description: vine.string().trim().escape(),
  taskType: vine.enum(['HACKATHON', 'CTF', 'ALGO'] as const),
  status: vine.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const),
  autoregister: vine.boolean(),
}

const taskDateFields = () => ({
  resultsPublishedAt: vine.date({ formats: { utc: true } }).nullable().optional(),
  registrationStartAt: vine.date({ formats: { utc: true } }).nullable().optional(),
  registrationEndAt: vine.date({ formats: { utc: true } }).afterField('registrationStartAt').nullable().optional(),
  detailsRevealAt: vine.date({ formats: { utc: true } }).nullable().optional(),
  submissionsStartAt: vine.date({ formats: { utc: true } }).nullable().optional(),
  submissionsEndAt: vine.date({ formats: { utc: true } }).afterField('submissionsStartAt').nullable().optional(),
})

export const createTaskValidator = vine.compile(
  vine.object({
    ...taskCoreSchema,
    status: vine.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const).optional(),
    autoregister: vine.boolean().optional(),
    slug: vine.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).use(notUUIDv4()).unique(async (db, value) => {
      const match = await db.from('tasks').where('slug', value).first()
      return !match
    }),
    ...taskDateFields(),
  })
)

export const updateTaskValidator = vine.compile(
  vine.object({
    ...partialSchema(taskCoreSchema),
    slug: vine.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).use(notUUIDv4()).unique(async (db, value, field) => {
      if (value === field.meta.taskSlug) return true
      const match = await db.from('tasks').where('slug', value).first()
      return !match
    }).optional(),
    ...taskDateFields(),
  })
)
