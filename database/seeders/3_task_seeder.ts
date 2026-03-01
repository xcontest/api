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

import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Task from '#models/task/task'
import Event from '#models/event/event'
import HackathonTask from '#models/hackathon/hackathon_task'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const hackathonEvent = await Event.findBy('slug', 'hackathon-tasks')
    if (!hackathonEvent) 
      throw new Error('Hackathon event not found. Please run EventSeeder first.')

    const teamSizeEvent = await Event.findBy('slug', 'team-size-event')
    if (!teamSizeEvent) 
      throw new Error('Team size event not found. Please run EventSeeder first.')

    const tasks = await Task.createMany([
      {
        eventId: hackathonEvent.id,
        slug: 'hidden-task',
        title: 'Hidden Hackathon Task',
        description: 'This task is not yet visible to participants.',
        taskType: 'HACKATHON',
        status: 'DRAFT',
        detailsRevealAt: null,
        registrationStartAt: null,
        registrationEndAt: null,
      },
      {
        eventId: hackathonEvent.id,
        slug: 'visible-task',
        title: 'Visible Hackathon Task',
        description: 'This task is open for registration.',
        taskType: 'HACKATHON',
        status: 'ACTIVE',
        detailsRevealAt: DateTime.now().plus({ days: 1 }), // Details will be revealed in 1 day
        registrationStartAt: DateTime.now(),
        registrationEndAt: DateTime.now().plus({ days: 7 }), // 1 week from now
      },
      {
        eventId: hackathonEvent.id,
        slug: 'visible-task-2',
        title: 'Visible Hackathon Task 2',
        description: 'This task is open for registration and details are already revealed.',
        taskType: 'HACKATHON',
        status: 'ACTIVE',
        detailsRevealAt: DateTime.now().minus({ days: 1 }), // Details were revealed 1 day ago
        registrationStartAt: DateTime.now(),
        registrationEndAt: DateTime.now().plus({ days: 7 }), // 1 week from now
        submissionsStartAt: DateTime.now(),
      },
      {
        eventId: hackathonEvent.id,
        slug: 'registration-not-started',
        title: 'Hackathon Task with Registration Not Started',
        description: 'This task has not yet opened for registration.',
        taskType: 'HACKATHON',
        status: 'ACTIVE',
        detailsRevealAt: DateTime.now().plus({ days: 2 }), // Details will be revealed in 2 days
        registrationStartAt: DateTime.now().plus({ days: 1 }), // Registration will start in 1 day
        registrationEndAt: DateTime.now().plus({ days: 8 }), // Registration will end in 8 days
      },
      {
        eventId: hackathonEvent.id,
        slug: 'registration-closed',
        title: 'Hackathon Task with Registration Closed',
        description: 'This task has closed registration.',
        taskType: 'HACKATHON',
        status: 'ACTIVE',
        detailsRevealAt: DateTime.now().minus({ days: 2 }), // Details were revealed 2 days ago
        registrationStartAt: DateTime.now().minus({ days: 8 }), // Registration started 8 days ago
        registrationEndAt: DateTime.now().minus({ days: 1 }), // Registration ended 1 day ago
      },
      {
        eventId: hackathonEvent.id,
        slug: 'autoregister-task',
        title: 'Hackathon Task with Autoregistration',
        description: 'This task automatically registers all teams upon registration opening.',
        taskType: 'HACKATHON',
        status: 'ACTIVE',
        detailsRevealAt: DateTime.now().plus({ days: 1 }), // Details will be revealed in 1 day
        registrationStartAt: DateTime.now().plus({ days: 1 }), // Registration will start in 1 day
        registrationEndAt: DateTime.now().plus({ days: 7 }), // Registration will end in 7 days
        autoregister: true,
        submissionsStartAt: DateTime.now().plus({ days: 2 }), // Submissions will start in 2 days
        submissionsEndAt: DateTime.now().plus({ days: 9 }), // Submissions will end in 9 days
      },
      {
        eventId: teamSizeEvent.id,
        slug: 'team-size-task',
        title: 'Task with Team Size Limits',
        description: 'This task has team size limits defined by the event.',
        taskType: 'HACKATHON',
        status: 'ACTIVE',
        detailsRevealAt: DateTime.now().plus({ days: 1 }), // Details will be revealed in 1 day
        registrationStartAt: DateTime.now(),
        registrationEndAt: DateTime.now().plus({ days: 7 }), // 1 week from now
      },
    ])

    for (const task of tasks) 
      await HackathonTask.create({
        taskId: task.id,
        requirementsDocumentUrl: `http://localhost/requirements/${task.slug}`,
      })
  }
}