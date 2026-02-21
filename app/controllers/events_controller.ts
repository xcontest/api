import { createEventValidator } from '#validators/event'
import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import db from '@adonisjs/lucid/services/db'
import { EventAdminGuard } from '#utils/permissions'

export default class EventsController {
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ auth, bouncer, request, response }: HttpContext) {
    await bouncer.with('EventPolicy').authorize('create')

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
  async show({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request }: HttpContext) {
    const _ = request
  }

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {}
}