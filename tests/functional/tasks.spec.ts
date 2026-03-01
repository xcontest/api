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

import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import User from '#models/user'

test.group('Tasks', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())  

  test('Lists all tasks', async ({ client }) => {
    const response = await client.get('/event/hackathon-tasks/tasks')

    response.assertOk()
    response.assertBodyContains([
      { task: { slug: 'visible-task' } },
      { task: { slug: 'visible-task-2' } },
    ])
  })

  test('Creates a task', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/event/hackathon-tasks/task').json({
      slug: 'new-task',
      title: 'New Hackathon Task',
      description: 'A new task for testing.',
      taskType: 'HACKATHON',
      requirementsDocumentUrl: 'http://local.host/requirements/new-task',
    }).loginAs(admin)

    response.assertCreated()
    response.assertBodyContains({
      slug: 'new-task',
      title: 'New Hackathon Task',
    })
  })

  test('Shows task details', async ({ client }) => {
    const response = await client.get('/tasks/visible-task')

    response.assertOk()
    response.assertBodyContains({ task: { slug: 'visible-task' } })
  })

  test('Updates a task', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.put('/tasks/visible-task').json({
      title: 'Updated Task Title',
    }).loginAs(admin)

    response.assertOk()
    response.assertBodyContains({ title: 'Updated Task Title' })
  })

  test('Deletes a task', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.delete('/tasks/visible-task').loginAs(admin)

    response.assertNoContent()
  })

  test('Admin can see draft tasks in listing', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.get('/event/hackathon-tasks/tasks').loginAs(admin)

    response.assertOk()
    response.assertBodyContains([
      { task: { slug: 'hidden-task' } },
    ])
  })

  test('Regular user cannot see draft tasks in listing', async ({ client, assert }) => {
    const user = await User.findByOrFail('nickname', 'user')

    const response = await client.get('/event/hackathon-tasks/tasks').loginAs(user)

    response.assertOk()
    const slugs = response.body().map((t: any) => t.task?.slug)
    assert.notInclude(slugs, 'hidden-task')
  })

  test('Listing tasks for a draft event is forbidden to guests', async ({ client }) => {
    const response = await client.get('/event/not-visible/tasks')

    response.assertForbidden()
  })

  test('Guest cannot view draft task details', async ({ client }) => {
    const response = await client.get('/tasks/hidden-task')

    response.assertForbidden()
  })

  test('Admin can view draft task details', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.get('/tasks/hidden-task').loginAs(admin)

    response.assertOk()
    response.assertBodyContains({ task: { slug: 'hidden-task' } })
  })

  test('Fails to create task without authentication', async ({ client }) => {
    const response = await client.post('/event/hackathon-tasks/task').json({
      slug: 'unauth-task',
      title: 'Unauth Task',
      description: 'Should fail.',
      taskType: 'HACKATHON',
      requirementsDocumentUrl: 'http://localhost/requirements/unauth-task',
    })

    response.assertUnauthorized()
  })

  test('Regular user without permission cannot create task', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')

    const response = await client.post('/event/hackathon-tasks/task').json({
      slug: 'user-task',
      title: 'User Task',
      description: 'Should fail.',
      taskType: 'HACKATHON',
      requirementsDocumentUrl: 'http://localhost/requirements/user-task',
    }).loginAs(user)

    response.assertForbidden()
  })

  test('Fails to create HACKATHON task without requirementsDocumentUrl', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/event/hackathon-tasks/task').json({
      slug: 'missing-requirements-task',
      title: 'Missing Requirements Task',
      description: 'Should fail.',
      taskType: 'HACKATHON',
    }).loginAs(admin)

    response.assertUnprocessableEntity()
  })

  test('Fails to create task with duplicate slug', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/event/hackathon-tasks/task').json({
      slug: 'visible-task',
      title: 'Duplicate Slug Task',
      description: 'Should fail due to duplicate slug.',
      taskType: 'HACKATHON',
      requirementsDocumentUrl: 'http://localhost/requirements/visible-task',
    }).loginAs(admin)

    response.assertUnprocessableEntity()
  })

  test('Fails to update task without authentication', async ({ client }) => {
    const response = await client.put('/tasks/visible-task').json({
      title: 'Updated Without Auth',
    })

    response.assertUnauthorized()
  })

  test('Fails to delete task without authentication', async ({ client }) => {
    const response = await client.delete('/tasks/visible-task')

    response.assertUnauthorized()
  })
})