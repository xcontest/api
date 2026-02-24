import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { UserGuard } from '#utils/permissions'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      nickname: faker.internet.username(),
      email: faker.internet.email(),
      password: faker.internet.password({length: 12, memorable: true}),
      permissions: UserGuard.build()
    }
  })
  .build()