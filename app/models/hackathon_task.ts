import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Task from '#models/task'

export default class HackathonTask extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare taskId: string

  @column()
  declare requirementsDocumentUrl: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>

  @beforeCreate()
  static assignUuid(hackathonTask: HackathonTask) {
    hackathonTask.id = randomUUID()
  }
}
