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

    const user2 = await User.findBy('nickname', 'user2')
    if (!user2)
      throw new Error('User not found. Please run UserSeeder first.')

    const hackathonEvent = await Event.findByUuidOrSlug('hackathon-tasks')
    if (!hackathonEvent)
      throw new Error('Hackathon event not found. Please run EventSeeder first.')

    const hackathonTeam = await Team.create({
      eventId: hackathonEvent.id,
      name: 'User\'s team',
    })

    await hackathonTeam.related('members').create({
      userId: user.id,
      permissions: TeamMemberGuard.allPermissions(), // User is a team admin
    })

    await hackathonTeam.related('members').create({
      userId: user2.id,
      permissions: TeamMemberGuard.build('MANAGE_MEMBERS'), // User is NOT a team admin
    })
  }
}
