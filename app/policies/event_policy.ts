import User from '#models/user'
import Event from '#models/event'
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
    if (event.status == 'ACTIVE')
      return true

    if (!user)
      return false

    if (UserGuard.can(user, 'MANAGE_ALL_EVENTS'))
      return true

    const eventAdmin = await event.related('administrators').query().where('user_id', user.id).first()
    if (!eventAdmin)
      return false

    return event.status == 'DRAFT' ? EventAdminGuard.can(eventAdmin, 'VIEW_DRAFT') : true
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
}