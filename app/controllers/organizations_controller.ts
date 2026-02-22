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

import Organization from '#models/organization'
import EventPolicy from '#policies/event_policy'
import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event/event'
import { create } from 'domain'
import { createOrganizationValidator, updateOrganizationValidator } from '#validators/organization'

export default class OrganizationsController {
  /**
   * Display a list of resource
   */
  async index({bouncer, params}: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.event_id)

    await bouncer.with(EventPolicy).allows('view', event)

    const organizations = await event.related('organizations').query()
    return organizations
  }

  /**
   * Handle form submission for the create action
   */
  async store({ bouncer, request, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(request.param('event_id'))

    await bouncer.with(EventPolicy).authorize('manageOrganizations', event)

    const payload = await request.validateUsing(createOrganizationValidator)

    const organization = await event.related('organizations').create({
      ...payload,
      eventId: event.id,
    })

    return response.created(organization)
  }

  /**
   * Show individual record
   */
  async show({ bouncer, params }: HttpContext) {
    const organization = await Organization.firstOrFail(params.id)

    const event = await organization.related('event').query().firstOrFail()
    await bouncer.with(EventPolicy).authorize('view', event)

    return organization
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, params, request }: HttpContext) {
    const organization = await Organization.findOrFail(params.id)

    await bouncer.with(EventPolicy).authorize('manageOrganizations', organization.event)

    const payload = await request.validateUsing(updateOrganizationValidator)

    organization.merge(payload)
    await organization.save()

    return organization
  }

  /**
   * Delete record
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const organization = await Organization.findOrFail(params.id)

    await bouncer.with(EventPolicy).authorize('manageOrganizations', organization.event)

    await organization.delete()

    return response.noContent();
  }
}