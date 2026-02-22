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
import Event from '#models/event/event'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { EventAdminGuard, UserGuard } from '#utils/permissions'

export default class EventPolicy extends BasePolicy {
  // Whether user can create new event on a platform
  create(user: User): AuthorizerResponse {
    return UserGuard.can(user, 'CREATE_EVENT')
  }

  // Whether user can see details about an event
  @allowGuest()
  async view(user: User | null, event: Event): Promise<AuthorizerResponse> {
    if (event.status === 'ACTIVE')
      return true

    if (!user)
      return false

    if (UserGuard.can(user, 'MANAGE_ALL_EVENTS'))
      return true

    const eventAdmin = await event.related('administrators').query().where('user_id', user.id).first()
    if (!eventAdmin)
      return false

    return event.status === 'DRAFT' ? EventAdminGuard.can(eventAdmin, 'VIEW_DRAFT') : true
  }

  // Whether user can edit event information
  async edit(user: User, event: Event): Promise<AuthorizerResponse> {
    if (UserGuard.can(user, 'MANAGE_ALL_EVENTS'))
      return true

    const eventAdmin = await event.related('administrators').query().where('user_id', user.id).first()
    if (!eventAdmin)
      return false

    if (event.status == 'DRAFT' && !EventAdminGuard.can(eventAdmin, 'VIEW_DRAFT'))
      return false

    return EventAdminGuard.can(eventAdmin, 'MANAGE_EVENT')
  }

  // Whether user can manage (create/update/delete) organizations related to an event
  async manageOrganizations(user: User, event: Event): Promise<AuthorizerResponse> {
    if (UserGuard.can(user, 'MANAGE_ALL_EVENTS'))
      return true

    const eventAdmin = await event.related('administrators').query().where('user_id', user.id).first()
    if (!eventAdmin)
      return false

    return EventAdminGuard.can(eventAdmin, 'MANAGE_ORGANIZATIONS')
  }

  // Whether user can manage (assign/update/revoke) event administrators
  async manageAdministrators(user: User, event: Event): Promise<AuthorizerResponse> {

    if (UserGuard.can(user, 'MANAGE_ALL_EVENTS'))
      return true

    const eventAdmin = await event.related('administrators').query().where('user_id', user.id).first()
    if (!eventAdmin)
      return false

    return EventAdminGuard.can(eventAdmin, 'MANAGE_ADMINS')
  }
}
