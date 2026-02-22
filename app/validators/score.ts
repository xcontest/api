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

import { partialSchema } from "#utils/schema"
import vine from "@vinejs/vine"

const scoringCriterionCoreSchema = {
  category: vine.string().trim().minLength(1).maxLength(255),
  maximumScore: vine.number().min(1).withoutDecimals(),
  weight: vine.number().positive().min(0.01).max(100),
}

export const createScoringCriterionValidator = vine.compile(
  vine.object({
    ...scoringCriterionCoreSchema,
    description: vine.string().trim().escape().nullable().optional(),
  })
)

export const updateScoringCriterionValidator = vine.compile(
  vine.object({
    ...partialSchema(scoringCriterionCoreSchema),
    description: vine.string().trim().escape().nullable().optional(),
  })
)