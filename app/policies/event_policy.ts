import User from '#models/user'
import Event from '#models/event'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { EventAdminGuard, UserGuard } from '#utils/permissions'

export default class EventPolicy extends BasePolicy {
  // Whether user can create new event on a platform
  create(user: User): AuthorizerResponse {
    return UserGuard.can(user, 'CREATE_EVENT')
  }

  // Whether user can edit event information
  async edit(user: User, event: Event): Promise<AuthorizerResponse> {
    if (UserGuard.can(user, 'MANAGE_ALL_EVENTS'))
      return true;

    const eventAdmin = await event.related('administrators').query().where('user_id', user.id).first();
    if (!eventAdmin)
      return false;

    return EventAdminGuard.can(eventAdmin, 'MANAGE_EVENT');
  }
}