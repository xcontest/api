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
})