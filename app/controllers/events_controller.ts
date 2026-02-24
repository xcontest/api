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

import { createEventValidator, updateEventValidator, storeAdministratorValidator, updateAdministratorValidator } from '#validators/event'
import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event/event'
import EventAdministrator from '#models/event/event_administrator'
import db from '@adonisjs/lucid/services/db'
import { EventAdminGuard } from '#utils/permissions'
import type { Mask , EventAdminPermissions } from '#utils/permissions'
import EventPolicy from '#policies/event_policy'
import { confirmationValidator } from '#validators/common'

export default class EventsController {
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {
    return Event.query().where('status', 'ACTIVE')
  }

  /**
   * Handle form submission for the creation action
   */
  async store({ auth, bouncer, request, response }: HttpContext) {
    await bouncer.with(EventPolicy).authorize('create')

    const payload = await request.validateUsing(createEventValidator)

    const event = await db.transaction(async (trx) => {
      const newEvent = await Event.create(payload, { client: trx })

      await newEvent.related('administrators').create({
        userId: auth.getUserOrFail().id,
        permissions: EventAdminGuard.allPermissions(),
      }, { client: trx })

      return newEvent
    })

    return response.created(event)
  }

  /**
   * Show individual record
   */
  async show({ bouncer, params }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.id)

    await bouncer.with(EventPolicy).authorize('view', event)

    return event
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, params, request }: HttpContext) {
    const payload = await request.validateUsing(updateEventValidator, {
      meta: { eventSlug: params.id },
    })

    const event = await Event.findByUuidOrSlug(params.id)
    await bouncer.with(EventPolicy).authorize('edit', event)

    event.merge(payload)
    await event.save()

    return event
  }

  /**
   * Delete record
   */
  async destroy({ bouncer, params, request, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.id)
    await request.validateUsing(confirmationValidator, {
      meta: {
        expectedConfirmation: event.slug,
        confirmationMeta: 'event slug',
      },
    })

    await bouncer.with(EventPolicy).authorize('edit', event)

    await event.delete()
    return response.noContent()
  }

  /**
   * List all administrators for an event
   */
  async indexAdministrators({ bouncer, params }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.id)
    await bouncer.with(EventPolicy).authorize('manageAdministrators', event)

    return event.related('administrators').query().preload('user')
  }

  /**
   * Assign a user as an administrator for an event
   */
  async storeAdministrator({ bouncer, params, request, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.id)
    await bouncer.with(EventPolicy).authorize('manageAdministrators', event)

    const payload = await request.validateUsing(storeAdministratorValidator)

    const existing = await EventAdministrator.query()
      .where('event_id', event.id)
      .where('user_id', payload.userId)
      .first()

    if (existing)
      return response.conflict({ message: 'User is already an administrator of this event.' })

    const admin = await event.related('administrators').create({
      userId: payload.userId,
      permissions: (payload.permissions ?? 0) as Mask<typeof EventAdminPermissions>,
    })

    return response.created(admin)
  }

  /**
   * Update permissions (bitmask) of an event administrator
   */
  async updateAdministrator({ bouncer, params, request, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.id)
    await bouncer.with(EventPolicy).authorize('manageAdministrators', event)

    const admin = await EventAdministrator.query()
      .where('event_id', event.id)
      .where('user_id', params.adminId)
      .first()

    if (!admin)
      return response.notFound({ message: 'User is not an administrator of this event.' })

    const { permissions } = await request.validateUsing(updateAdministratorValidator)

    admin.permissions = permissions as Mask<typeof EventAdminPermissions>
    await admin.save()

    return admin
  }

  /**
   * Revoke administrator access from a user for an event
   */
  async destroyAdministrator({ bouncer, params, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.id)
    await bouncer.with(EventPolicy).authorize('manageAdministrators', event)

    const admin = await EventAdministrator.query()
      .where('event_id', event.id)
      .where('user_id', params.adminId)
      .first()

    if (!admin)
      return response.notFound({ message: 'User is not an administrator of this event.' })

    await admin.delete()
    return response.noContent()
  }
}
