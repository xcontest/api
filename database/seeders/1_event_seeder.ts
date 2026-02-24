import User from '#models/user'
import Event from '#models/event/event'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { EventAdminGuard } from '#utils/permissions'

export default class extends BaseSeeder {
  async run() {
    const admin = await User.findBy('nickname', 'admin')
    if (!admin) 
      throw new Error('Admin user not found. Please run UserSeeder first.')

    const createdEvents = await Event.createMany([
      {
        slug: 'not-visible',
        title: 'Event that is a draft.',
        description: '#This is a test event created by EventSeeder. \n This event is a draft. It should not be visible to user',
        accessCode: null,
        status: 'DRAFT',
        minTeamSize: 1,
        maxTeamSize: 2,
      },
      {
        slug: 'no-tasks',
        title: 'Event with no tasks.',
        description: '#This is a test event created by EventSeeder. \n This event has no tasks.',
        accessCode: null,
        status: 'ACTIVE',
        minTeamSize: 1,
        maxTeamSize: 1,
      },
      {
        slug: 'hackathon-tasks',
        title: 'Event with Hackathon tasks.',
        description: '#This is a test event created by EventSeeder. \n This event has tasks that are a type of HACKATHON.',
        accessCode: null,
        status: 'ACTIVE',
        minTeamSize: 1,
        maxTeamSize: 5,
      },
    ])

    for (const event of createdEvents) 
      await event.related('administrators').create({
        userId: admin.id,
        permissions: EventAdminGuard.allPermissions(),
      })
    
  }
}