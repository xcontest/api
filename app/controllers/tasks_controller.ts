import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event/event'
import Task from '#models/task/task'
import TaskPolicy from '#policies/task_policy'
import { createTaskValidator, updateTaskValidator } from '#validators/task'

export default class TasksController {
  /**
   * Display a list of tasks for an event
   */
  async index({ bouncer, params }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.event_id)

    const canManage = await bouncer.with(TaskPolicy).allows('create', event)
    console.log('canManage', canManage)
    return Task.query()
      .where('event_id', event.id)
      .if(!canManage, (q) => q.where('status', 'ACTIVE'))
  }

  /**
   * Handle form submission for the creation action
   */
  async store({ bouncer, params, request, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.event_id)
    await bouncer.with(TaskPolicy).authorize('create', event)

    const payload = await request.validateUsing(createTaskValidator)

    const task = await event.related('tasks').create(Task.datesFromPayload({ status: 'DRAFT', autoregister: false, ...payload }))

    return response.created(task)
  }

  /**
   * Show individual record
   */
  async show({ bouncer, params }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.id)
    await bouncer.with(TaskPolicy).authorize('view', task)

    return task
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, params, request }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.id)
    await bouncer.with(TaskPolicy).authorize('edit', task)

    const payload = await request.validateUsing(updateTaskValidator, {
      meta: { taskSlug: task.slug }
    })

    task.merge(Task.datesFromPayload(payload))
    await task.save()

    return task
  }

  /**
   * Delete record
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.id)
    await bouncer.with(TaskPolicy).authorize('delete', task)

    await task.delete()
    return response.noContent()
  }
}