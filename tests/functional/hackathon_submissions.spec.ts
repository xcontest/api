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

import Task from '#models/task/task'
import TaskRegistration from '#models/task/task_registration'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Hackathon submissions', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('Make a successful hackathon task submission with file', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task-2')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
      
    const testImagePath = './tests/fixtures/test_image.png'

    const response = await client.post('/hackathon/submissions')
      .loginAs(user)
      .field('taskRegistrationId', taskRegistration.id.toString())
      .field('description', 'This is our submission description')
      .field('repositoryUrl', 'https://github.com/xContest/xContest')
      .field('demoUrl', 'https://xcontest.org')
      .field('status', 'ACTIVE')
      .field('media[0][mediaType]', 'IMAGE')
      .field('media[0][description]', 'Test image')
      .field('media[0][galleryIndex]', '0')
      .file('media[0][file]', testImagePath)
      .field('media[1][mediaType]', 'VIDEO')
      .field('media[1][description]', 'Some video')
      .field('media[1][galleryIndex]', '1')
      .field('media[1][url]', 'https://example.com/video2.png')

    response.assertCreated()
    response.assertBodyContains({
      description: 'This is our submission description',
      repositoryUrl: 'https://github.com/xContest/xContest',
      demoUrl: 'https://xcontest.org',
      status: 'ACTIVE',
      media: [
        {
          mediaType: 'IMAGE',
          description: 'Test image',
          galleryIndex: 0,
        },
        {
          mediaType: 'VIDEO',
          description: 'Some video',
          galleryIndex: 1,
        },
      ],
    })
  })
})