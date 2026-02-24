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

import User from '#models/user'
import Task from '#models/task/task'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { EventAdminGuard, UserGuard } from '#utils/permissions'
import Event from '#models/event/event'
import EventPolicy from './event_policy.js'

export default class TaskPolicy extends BasePolicy {
  // Whether user can create a task under an event
  async create(user: User, event: Event): Promise<AuthorizerResponse> {
    if (UserGuard.can(user, 'MANAGE_ALL_TASKS'))
      return true

    const eventAdmin = await event.related('administrators').query().where('user_id', user.id).first()
    if (!eventAdmin)
      return false

    return EventAdminGuard.can(eventAdmin, 'CREATE_TASK') || EventAdminGuard.can(eventAdmin, 'MANAGE_ALL_TASKS')
  }

  // Whether user can view a task
  @allowGuest()
  async view(user: User | null, task: Task): Promise<AuthorizerResponse> {
    if (task.status === 'ACTIVE') {
      await task.load('event');
      // Check if the user can view the event
      if (await new EventPolicy().view(user, task.event)) {
        return true
      } else {
        return false
      }
    }

    if (!user)
      return false

    if (UserGuard.can(user, 'MANAGE_ALL_TASKS'))
      return true

    await task.load('event')
    const eventAdmin = await task.event.related('administrators').query().where('user_id', user.id).first()
    if (!eventAdmin)
      return false

    return task.status === 'DRAFT' ? EventAdminGuard.can(eventAdmin, 'VIEW_DRAFT') || EventAdminGuard.can(eventAdmin, 'MANAGE_ALL_TASKS') : true
  }

  // Whether user can edit a task
  async edit(user: User, task: Task): Promise<AuthorizerResponse> {
    if (UserGuard.can(user, 'MANAGE_ALL_TASKS'))
      return true

    await task.load('event')
    const eventAdmin = await task.event.related('administrators').query().where('user_id', user.id).first()
    if (!eventAdmin)
      return false

    return EventAdminGuard.can(eventAdmin, 'EDIT_TASK') || EventAdminGuard.can(eventAdmin, 'MANAGE_ALL_TASKS')
  }

  // Whether user can delete a task
  async delete(user: User, task: Task): Promise<AuthorizerResponse> {
    return this.edit(user, task)
  }
}