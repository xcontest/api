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
import TaskRegistration from '#models/task/task_registration'
import HackathonTaskSubmission from '#models/hackathon/hackathon_task_submission'
import Media from '#models/media'
import Task from '#models/task/task'

export default class extends BaseSeeder {
  async run() {
    const visibleTask = await Task.findByUuidOrSlug('visible-task')
    if (!visibleTask) 
      throw new Error('Visible task not found. Please run TaskSeeder first.')

    const taskRegistration = await TaskRegistration.query()
      .where('task_id', visibleTask.id)
      .first()

    if (!taskRegistration)
      throw new Error('Task registration not found. Please run TaskRegistrationSeeder first.')

    const submission = await HackathonTaskSubmission.create({
      taskRegistrationId: taskRegistration.id,
      description: 'This is our submission description',
      repositoryUrl: 'https://github.com/xContest/xContest',
      demoUrl: 'https://xcontest.org',
      status: 'ACTIVE',
    })

    await Media.createMany([
      {
        relatedId: submission.id,
        mediaType: 'IMAGE',
        url: 'https://example.com/image1.png',
        description: 'Screenshot 1',
        galleryIndex: 1,
      },
      {
        relatedId: submission.id,
        mediaType: 'VIDEO',
        url: 'https://example.com/video2.png',
        description: 'Video Screenshot 2',
        galleryIndex: 2,
      },
    ])
  }
}