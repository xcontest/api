import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'

export default class Media extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare relatedId: string

  @column()
  declare description: string

  @column()
  declare mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LINK'

  @column()
  declare url: string

  @column()
  declare galleryIndex: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static assignUuid(media: Media) {
    media.id = randomUUID()
  }
}
