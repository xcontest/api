import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Task from '#models/task'
import Organization from '#models/organization'

export default class Sponsor extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare taskId: string

  @column()
  declare organizationId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @beforeCreate()
  static assignUuid(sponsor: Sponsor) {
    sponsor.id = randomUUID()
  }
}
