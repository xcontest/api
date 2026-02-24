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