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
import { generateSecureToken } from '#utils/teams'
import { DateTime } from 'luxon'

test.group('Auth login', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('Logs in successfully with correct credentials', async ({ client, assert }) => {
    const response = await client.post('/auth/login').json({
      email: 'user@local.host',
      password: 'userpassword',
    })

    response.assertOk()
    assert.equal(response.body().message, 'Login successful')
    assert.exists(response.body().user)
    assert.exists(response.cookie('xcontest-session'))
  })

  test('Fails with incorrect password', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      email: 'user@local.host',
      password: 'wrongpassword',
    })

    response.assertStatus(400)
  })

  test('Fails with non-existent email', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      email: 'user@no.host',
      password: 'testtesttest',
    })

    response.assertStatus(400)
  })

  test('Fails when required fields are missing', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      email: '',
    })
    response.assertUnprocessableEntity()
  })

  test('User can request password change and receive token', async ({ client }) => {
    const response = await client.post('/auth/forgot-password').json({
      email: 'user@local.host',
    })

    response.assertOk()
  })

  test('User can change password using valid token', async ({ assert, client }) => {
    const user = await User.findByOrFail('email', 'user@local.host')
    user.passwordResetToken = generateSecureToken()
    user.passwordResetExpires = DateTime.now().plus({ hours: 1 })
    await user.save()

    const response = await client.post(`/auth/reset-password?token=${user.passwordResetToken}`).json({
      newPassword: 'abcdef#',
      newPasswordConfirm: 'abcdef#',
    })

    response.assertOk()
    const verified = await User.verifyCredentials(user.email, 'abcdef#')
    assert.exists(verified)
  })

  test('User cannot change password using invalid token', async ({ assert, client }) => {
    const user = await User.findByOrFail('email', 'user@local.host')
    user.passwordResetToken = generateSecureToken()
    user.passwordResetExpires = DateTime.now().plus({ hours: 1 })
    await user.save()

    const response = await client.post('/auth/reset-password?token=helloworld').json({
      newPassword: 'abcdef#',
      newPasswordConfirm: 'abcdef#',
    })

    response.assertBadRequest()
    await assert.rejects(() => User.verifyCredentials(user.email, 'abcdef#'))
  })

  test('User cannot change password using expired token', async ({ assert, client }) => {
    const user = await User.findByOrFail('email', 'user@local.host')
    user.passwordResetToken = generateSecureToken()
    user.passwordResetExpires = DateTime.now().minus({ minutes: 1 })
    await user.save()

    const response = await client.post(`/auth/reset-password?token=${user.passwordResetToken}`).json({
      newPassword: 'abcdef#',
      newPasswordConfirm: 'abcdef#',
    })

    response.assertBadRequest()
    await assert.rejects(() => User.verifyCredentials(user.email, 'abcdef#'))
  })
})
