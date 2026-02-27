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

const mediaItemSchema = vine.object({
  description: vine.string().trim().escape().maxLength(500).optional(),
  mediaType: vine.enum(['IMAGE', 'VIDEO', 'DOCUMENT', 'LINK']),
  url: vine.string().url().maxLength(2048).optional(),
  file: vine.file({
    size: '20mb',
    extnames: ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'],
  }).optional(),
})

const hackathonSubmissionSchema = {
  description: vine.string().trim().escape().maxLength(5000).optional(),
  repositoryUrl: vine.string().url().maxLength(500).optional(),
  demoUrl: vine.string().url().maxLength(500).optional(),
  status: vine.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const),
  media: vine.array(mediaItemSchema).optional(),
}

/**
 * Validator to validate the payload when creating
 * a new hackathon submission.
 */
export const createHackathonSubmissionValidator = vine.create(
  vine.object({
    ...hackathonSubmissionSchema,
    taskRegistrationId: vine.string().uuid(),
  }),
)

/**
 * Validator to validate the payload when updating
 * an existing hackathon submission.
 */
export const updateHackathonSubmissionValidator = vine.create(
  vine.object(hackathonSubmissionSchema),
)