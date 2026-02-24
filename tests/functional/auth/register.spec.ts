import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Auth register', (group) => {
  group.each.setup(() => testUtils.db().seed())
  group.each.teardown(() => testUtils.db().truncate())

  test('registers a new user successfully', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      nickname: 'user2',
      email: 'user2@local.host',
      password: 'password123',
      password_confirmation: 'password123',
    })

    response.assertStatus(201)
    assert.equal(response.body().message, 'Registration successful')
    assert.exists(response.body().user.id)
    assert.equal(response.body().user.email, 'user2@local.host')
  })

  test('fails when password is not strong enough', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      nickname: 'mysecondaccount',
      email: 'user2@local.host',
      password: 'notsafe',
      password_confirmation: 'notsafe',
    })

    response.assertStatus(422)
  })

  test('fails when email is already taken', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      nickname: 'mysecondaccount',
      email: 'user@local.host',
      password: 'safe123123123',
      password_confirmation: 'safe123123123',
    })

    response.assertStatus(422)
  })

  test('fails when required fields are missing', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      email: ''
    })

    response.assertStatus(422)
  })

  test('fails when passwords do not match', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      nickname: 'user2',
      email: 'user2@local.host',
      password: 'password123',
      password_confirmation: 'password456',
    })

    response.assertStatus(422)
  })
})