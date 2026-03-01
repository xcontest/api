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

import { UserFactory } from '#database/factories/user_factory'
import HackathonTaskSubmission from '#models/hackathon/hackathon_task_submission'
import Task from '#models/task/task'
import TaskRegistration from '#models/task/task_registration'
import Team from '#models/team/team'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Hackathon submissions', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('Success to list current user\'s submissions', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    
    const response = await client.get('/hackathon/submissions/user')
      .loginAs(user)

    response.assertOk()
    response.assertBodyContains([
      {
        description: 'This is our submission description',
        repositoryUrl: 'https://github.com/xContest/xContest',
        demoUrl: 'https://xcontest.org',
        status: 'ACTIVE',
        media: [
          {
            mediaType: 'IMAGE',
            url: 'https://example.com/image1.png',
            description: 'Screenshot 1',
            galleryIndex: 1,
          },
          {
            mediaType: 'VIDEO',
            url: 'https://example.com/video2.mp4',
            description: 'Video Screenshot 2',
            galleryIndex: 2,
          },
        ],
      },
    ])
  })

  test('Fail to list submissions if user is not authenticated', async ({ client }) => {
    const response = await client.get('/hackathon/submissions/user')

    response.assertUnauthorized()
  })

  test('Success to list submissions for a team', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const team = await Team.findByOrFail('name', 'User\'s team')

    const response = await client.get(`/hackathon/submissions/team/${team.id}`)
      .loginAs(user)

    response.assertOk()
    response.assertBodyContains([
      {
        description: 'This is our submission description',
        repositoryUrl: 'https://github.com/xContest/xContest',
        demoUrl: 'https://xcontest.org',
        status: 'ACTIVE',
        media: [
          {
            mediaType: 'IMAGE',
            url: 'https://example.com/image1.png',
            description: 'Screenshot 1',
            galleryIndex: 1,
          },
          {
            mediaType: 'VIDEO',
            url: 'https://example.com/video2.mp4',
            description: 'Video Screenshot 2',
            galleryIndex: 2,
          },
        ],
      },
    ])
  })

  test('Fail to list submissions for a team if not a team member', async ({ client }) => {
    const newUser = await UserFactory.create()
    const team = await Team.findByOrFail('name', 'User\'s team')

    const response = await client.get(`/hackathon/submissions/team/${team.id}`)
      .loginAs(newUser)

    response.assertForbidden()
  })

  test('Success to list submissions for a task', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')
    const task = await Task.findByUuidOrSlug('visible-task')

    const response = await client.get(`/hackathon/submissions/task/${task.id}`)
      .loginAs(admin)

    response.assertOk()
    response.assertBodyContains([
      {
        description: 'This is our submission description',
        repositoryUrl: 'https://github.com/xContest/xContest',
        demoUrl: 'https://xcontest.org',
        status: 'ACTIVE',
        media: [
          {
            mediaType: 'IMAGE',
            url: 'https://example.com/image1.png',
            description: 'Screenshot 1',
            galleryIndex: 1,
          },
          {
            mediaType: 'VIDEO',
            url: 'https://example.com/video2.mp4',
            description: 'Video Screenshot 2',
            galleryIndex: 2,
          },
        ],
      },
    ])
  })

  test('Fail to list submissions for a task if user does not have permission', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task')

    const response = await client.get(`/hackathon/submissions/task/${task.id}`)
      .loginAs(user)

    response.assertForbidden()
  })

  test('Success to get a single submission', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.get(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      
    response.assertOk()
    response.assertBodyContains({
      description: 'This is our submission description',
      repositoryUrl: 'https://github.com/xContest/xContest',
      demoUrl: 'https://xcontest.org',
      status: 'ACTIVE',
      media: [
        {
          mediaType: 'IMAGE',
          url: 'https://example.com/image1.png',
          description: 'Screenshot 1',
          galleryIndex: 1,
        },
        {
          mediaType: 'VIDEO',
          url: 'https://example.com/video2.mp4',
          description: 'Video Screenshot 2',
          galleryIndex: 2,
        },
      ],
    })
  })

  test('Fail to get a single submission if user does not have permission', async ({ client }) => {
    const user = await UserFactory.create()
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.get(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      
    response.assertForbidden()
  })

  test('Fail to get a single submission if not authenticated', async ({ client }) => {
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.get(`/hackathon/submissions/${submission.id}`)
      
    response.assertUnauthorized()
  })

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

  test('Fail when submissions are closed', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('autoregister-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()

    const response = await client.post('/hackathon/submissions')
      .loginAs(user)
      .field('taskRegistrationId', taskRegistration.id)
      .field('description', 'This is our submission description')
      .field('repositoryUrl', 'https://github.com/xContest/xContest')
      .field('demoUrl', 'https://xcontest.org')
      .field('status', 'ACTIVE')
      
    response.assertBadRequest()
  })

  test('Fail when user does not have permission to submit', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user2')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()

    const response = await client.post('/hackathon/submissions')
      .loginAs(user)
      .field('taskRegistrationId', taskRegistration.id)
      .field('description', 'This is our submission description')
      .field('repositoryUrl', 'https://github.com/xContest/xContest')
      .field('demoUrl', 'https://xcontest.org')
      .field('status', 'ACTIVE')

    response.assertForbidden()
  })

  test('Fail when user is not authenticated', async ({ client }) => {
    const task = await Task.findByUuidOrSlug('autoregister-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()

    const response = await client.post('/hackathon/submissions')
      .field('taskRegistrationId', taskRegistration.id)
      .field('description', 'This is our submission description')
      .field('repositoryUrl', 'https://github.com/xContest/xContest')
      .field('demoUrl', 'https://xcontest.org')
      .field('status', 'ACTIVE')
      
    response.assertUnauthorized()
  })

  test('Fail when team already has a submission for the task registration', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()

    const response = await client.post('/hackathon/submissions')
      .loginAs(user)
      .field('taskRegistrationId', taskRegistration.id)
      .field('description', 'This is our submission description')
      .field('repositoryUrl', 'https://github.com/xContest/xContest')
      .field('demoUrl', 'https://xcontest.org')
      .field('status', 'ACTIVE')
      
    response.assertBadRequest()
  })

  test('Reject if users tries to submit video file instead of URL', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('autoregister-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()

    const testImagePath = './tests/fixtures/test_image.png'

    const response = await client.post('/hackathon/submissions')
      .loginAs(user)
      .field('taskRegistrationId', taskRegistration.id)
      .field('description', 'This is our submission description')
      .field('repositoryUrl', 'https://github.com/xContest/xContest')
      .field('demoUrl', 'https://xcontest.org')
      .field('status', 'ACTIVE')
      .field('media[0][mediaType]', 'VIDEO')
      .field('media[0][description]', 'Test video')
      .field('media[0][galleryIndex]', '0')
      .file('media[0][file]', testImagePath)
      
    response.assertBadRequest()
  })

  test('Fail to update when changing from active to draft status', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.put(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      .field('status', 'DRAFT')
      
    response.assertBadRequest()
  })

  test('Fail to update when user does not have permission', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user2')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.put(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      .field('description', 'Updated description')
      .field('status', 'ARCHIVED')
      
    response.assertForbidden()
  })

  test('Fail to update when not authenticated', async ({ client }) => {
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.put(`/hackathon/submissions/${submission.id}`)
      .field('description', 'Updated description')
      .field('status', 'ARCHIVED')
      
    response.assertUnauthorized()
  })

  test('Update submission successfully', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.put(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      .field('description', 'Updated description')
      .field('status', 'ARCHIVED')
      
    response.assertOk()
    response.assertBodyContains({ status: 'ARCHIVED', description: 'Updated description' })
  })

  test('Fail to update if submission is archived', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    submission.status = 'ARCHIVED'
    await submission.save()

    const response = await client.put(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      .field('description', 'Trying to update description')
      .field('status', 'ARCHIVED')
      
    response.assertBadRequest()
  })

  test('Fail to delete if submission is archived', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    submission.status = 'ARCHIVED'
    await submission.save()

    const response = await client.delete(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      
    response.assertBadRequest()
  })

  test('Fail to delete when user does not have permission', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user2')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.delete(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      
    response.assertForbidden()
  })
  
  test('Fail to delete when not authenticated', async ({ client }) => {
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.delete(`/hackathon/submissions/${submission.id}`)
      
    response.assertUnauthorized()
  })

  test('Delete submission successfully', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')
    const task = await Task.findByUuidOrSlug('visible-task')
    const taskRegistration = await TaskRegistration.query()
      .where('taskId', task.id)
      .firstOrFail()
    const submission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .firstOrFail()

    const response = await client.delete(`/hackathon/submissions/${submission.id}`)
      .loginAs(user)
      
    response.assertNoContent()
  })
})