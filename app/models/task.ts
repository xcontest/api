//          ______            __            __
//    _  __/ ____/___  ____  / /____  _____/ /_
//   | |/_/ /   / __ \/ __ \/ __/ _ \/ ___/ __/
//  _>  </ /___/ /_/ / / / / /_/  __(__  ) /_
// /_/|_|\____/\____/_/ /_/\__/\___/____/\__/
//     Copyright (C) 2026 xContest Team

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see http://www.gnu.org/licenses/.

import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Event from '#models/event'
import HackathonTask from '#models/hackathon_task'
import ScoringCriterion from '#models/scoring_criterion'
import TaskRegistration from '#models/task_registration'
import JuryMember from '#models/jury_member'
import Sponsor from '#models/sponsor'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare eventId: string

  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare taskType: 'HACKATHON' | 'CTF' | 'ALGO'

  @column()
  declare status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

  @column()
  declare autoregister: boolean

  @column.dateTime()
  declare resultsPublishedAt: DateTime | null

  @column.dateTime()
  declare registrationStartAt: DateTime | null

  @column.dateTime()
  declare registrationEndAt: DateTime | null

  @column.dateTime()
  declare detailsRevealAt: DateTime | null

  @column.dateTime()
  declare submissionsStartAt: DateTime | null

  @column.dateTime()
  declare submissionsEndAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasOne(() => HackathonTask)
  declare hackathonTask: HasOne<typeof HackathonTask>

  @hasMany(() => ScoringCriterion)
  declare scoringCriteria: HasMany<typeof ScoringCriterion>

  @hasMany(() => TaskRegistration)
  declare registrations: HasMany<typeof TaskRegistration>

  @hasMany(() => JuryMember)
  declare juryMembers: HasMany<typeof JuryMember>

  @hasMany(() => Sponsor)
  declare sponsors: HasMany<typeof Sponsor>

  @beforeCreate()
  static assignUuid(task: Task) {
    task.id = randomUUID()
  }
}
