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

  test('Lists event administrators', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.get('/events/no-tasks/administrators').loginAs(admin)

    response.assertOk()
    response.assertBodyContains([
      { userId: admin.id },
    ])
  })

  test('Adds an event administrator', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')
    const user = await User.findByOrFail('nickname', 'user')

    const response = await client.post('/events/no-tasks/administrators').json({
      userId: user.id,
      permissions: 0,
    }).loginAs(admin)

    response.assertCreated()
    response.assertBodyContains({ userId: user.id })
  })

  test('Updates an event administrator', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')
    const user = await User.findByOrFail('nickname', 'user')

    await client.post('/events/no-tasks/administrators').json({
      userId: user.id,
      permissions: 0,
    }).loginAs(admin)

    const response = await client.put(`/events/no-tasks/administrators/${user.id}`).json({
      permissions: 1,
    }).loginAs(admin)

    response.assertOk()
    response.assertBodyContains({ permissions: 1 })
  })

  test('Deletes an event administrator', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')
    const user = await User.findByOrFail('nickname', 'user')

    await client.post('/events/no-tasks/administrators').json({
      userId: user.id,
      permissions: 0,
    }).loginAs(admin)

    const response = await client.delete(`/events/no-tasks/administrators/${user.id}`).loginAs(admin)

    response.assertNoContent()
  })

  test('Does not expose draft events in listing', async ({ client, assert }) => {
    const response = await client.get('/events')

    response.assertOk()
    const slugs = response.body().map((e: any) => e.slug)
    assert.notInclude(slugs, 'not-visible')
  })

  test('Guest cannot view draft event details', async ({ client }) => {
    const response = await client.get('/events/not-visible')

    response.assertForbidden()
  })

  test('Admin can view draft event details', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.get('/events/not-visible').loginAs(admin)

    response.assertOk()
    response.assertBodyContains({ slug: 'not-visible' })
  })

  test('Fails to create event without authentication', async ({ client }) => {
    const response = await client.post('/events').json({
      slug: 'unauth-event',
      title: 'Unauth Event',
      description: 'Should fail.',
      status: 'DRAFT',
      minTeamSize: 1,
      maxTeamSize: 3,
    })

    response.assertUnauthorized()
  })

  test('Regular user without permission cannot create event', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')

    const response = await client.post('/events').json({
      slug: 'user-event',
      title: 'User Event',
      description: 'Should fail.',
      status: 'DRAFT',
      minTeamSize: 1,
      maxTeamSize: 3,
    }).loginAs(user)

    response.assertForbidden()
  })
  
  test('Fails to create event with duplicate slug', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/events').json({
      slug: 'no-tasks',
      title: 'Duplicate Slug Event',
      description: 'Should fail due to duplicate slug.',
      status: 'DRAFT',
      minTeamSize: 1,
      maxTeamSize: 3,
    }).loginAs(admin)

    response.assertUnprocessableEntity()
  })

  test('Fails to create event with missing required fields', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/events').json({
      slug: 'incomplete-event',
    }).loginAs(admin)

    response.assertUnprocessableEntity()
  })

  test('Fails to update event without authentication', async ({ client }) => {
    const response = await client.put('/events/no-tasks').json({
      title: 'Updated Without Auth',
    })

    response.assertUnauthorized()
  })

  test('Fails to delete event without authentication', async ({ client }) => {
    const response = await client.delete('/events/no-tasks').json({
      confirmation: 'no-tasks',
    })

    response.assertUnauthorized()
  })

  test('Fails to delete event with wrong confirmation', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.delete('/events/no-tasks').json({
      confirmation: 'wrong-slug',
    }).loginAs(admin)

    response.assertUnprocessableEntity()
  })

  test('Fails to access event administrators without authentication', async ({ client }) => {
    const response = await client.get('/events/no-tasks/administrators')

    response.assertUnauthorized()
  })

  test('Non-admin user cannot manage event administrators', async ({ client }) => {
    const user = await User.findByOrFail('nickname', 'user')

    const response = await client.get('/events/no-tasks/administrators').loginAs(user)

    response.assertForbidden()
  })

  test('Fails to add duplicate event administrator', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    // Admin is already an administrator of all seeded events
    const response = await client.post('/events/no-tasks/administrators').json({
      userId: admin.id,
      permissions: 0,
    }).loginAs(admin)

    response.assertStatus(409)
  })

  test('Fails when minTeamSize is greater than maxTeamSize', async ({ client }) => {
    const admin = await User.findByOrFail('nickname', 'admin')

    const response = await client.post('/events').json({
      slug: 'invalid-team-size',
      title: 'Invalid Team Size Event',
      description: 'Should fail due to invalid team size.',
      status: 'DRAFT',
      minTeamSize: 5,
      maxTeamSize: 3,
    }).loginAs(admin)

    response.assertUnprocessableEntity()
  })
})