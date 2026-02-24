import User from '#models/user'
import { UserGuard } from '#utils/permissions'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([{
      nickname: 'admin',
      email: 'admin@local.host',
      password: 'adminpasswordstrong',
      permissions: UserGuard.allPermissions()
    }, {
      nickname: 'user',
      email: 'user@local.host',
      password: 'userpassword',
      permissions: UserGuard.build()
    }])
  }
}