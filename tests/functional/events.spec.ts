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

test.group('Events', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('Lists all events', async ({ client }) => {
    const response = await client.get('/events')

    response.assertOk()
    response.assertBodyContains([
      { slug: 'no-tasks' },
      { slug: 'hackathon-tasks' },
    ])
  })

  test('Creates an event', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/events').json({
      slug: 'new-event',
      title: 'New Test Event',
      description: 'A brand new event for testing.',
      status: 'DRAFT',
      minTeamSize: 1,
      maxTeamSize: 5,
    }).loginAs(admin)

    response.assertCreated()
    response.assertBodyContains({
      slug: 'new-event',
      title: 'New Test Event',
    })
  })

  test('Shows event details', async ({ client }) => {
    const response = await client.get('/events/no-tasks')

    response.assertOk()
    response.assertBodyContains({ slug: 'no-tasks' })
  })

  test('Updates an event', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.put('/events/no-tasks').json({
      title: 'Updated Event Title',
    }).loginAs(admin)

    response.assertOk()
    response.assertBodyContains({ title: 'Updated Event Title' })
  })

  test('Deletes an event', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.delete('/events/no-tasks').json({
      confirmation: 'no-tasks',
    }).loginAs(admin)

    response.assertNoContent()
  })
})