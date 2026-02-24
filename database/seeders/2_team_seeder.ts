import Team from '#models/team/team'
import User from '#models/user'
import Event from '#models/event/event'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { TeamMemberGuard } from '#utils/permissions'

export default class extends BaseSeeder {
  async run() {
    const admin = await User.findBy('nickname', 'admin')
    if (!admin) 
      throw new Error('Admin user not found. Please run UserSeeder first.')

    const user = await User.findBy('nickname', 'user')
    if (!user) 
      throw new Error('User not found. Please run UserSeeder first.')

    const hackathonEvent = await Event.findByUuidOrSlug('hackathon-tasks')
    if(!hackathonEvent) 
      throw new Error('Hackathon event not found. Please run EventSeeder first.')

    const hackathonTeam = await Team.create({
      eventId: hackathonEvent.id,
      name: `User's team`
    })

    hackathonTeam.related('members').create({
      userId: user.id,
      permissions: TeamMemberGuard.allPermissions() // User is a team admin
    })
  }
}