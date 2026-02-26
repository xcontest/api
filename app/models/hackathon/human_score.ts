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

import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import JuryMember from '#models/hackathon/jury_member'
import HackathonSubmissionResult from '#models/hackathon/hackathon_submission_result'
import ScoringCriterion from '#models/scoring_criterion'
import { ApiColumn } from '#openapi/decorators'

export default class HumanScore extends BaseModel {
  @column({ isPrimary: true })
  @ApiColumn(String, { example: 'd62a1715-6b7a-4b40-8bdd-4a10f2ceb08c' })
  declare id: string

  @column()
  @ApiColumn(String, { example: 'd62a1715-6b7a-4b40-8bdd-4a10f2ceb08c' })
  declare juryMemberId: string

  @column()
  @ApiColumn(String, { example: 'd62a1715-6b7a-4b40-8bdd-4a10f2ceb08c' })
  declare submissionResultId: string

  @column()
  @ApiColumn(String, { example: 'd62a1715-6b7a-4b40-8bdd-4a10f2ceb08c' })
  declare criterionId: string

  @column()
  @ApiColumn(Number, { example: 85 })
  declare score: number

  @column()
  @ApiColumn(String, { example: 'Great implementation with good code quality' })
  declare description: string

  @column.dateTime({ autoCreate: true })
  @ApiColumn(String, { format: 'date-time' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  @ApiColumn(String, { format: 'date-time' })
  declare updatedAt: DateTime | null

  @belongsTo(() => JuryMember)
  declare juryMember: BelongsTo<typeof JuryMember>

  @belongsTo(() => HackathonSubmissionResult, { foreignKey: 'submissionResultId' })
  declare submissionResult: BelongsTo<typeof HackathonSubmissionResult>

  @belongsTo(() => ScoringCriterion, { foreignKey: 'criterionId' })
  declare criterion: BelongsTo<typeof ScoringCriterion>

  @beforeCreate()
  static assignUuid(score: HumanScore) {
    score.id = randomUUID()
  }
}
