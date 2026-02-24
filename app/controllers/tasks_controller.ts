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

import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Event from '#models/event/event'
import Task from '#models/task/task'
import HackathonTask from '#models/hackathon/hackathon_task'
import TaskPolicy from '#policies/task_policy'
import { createTaskValidator, updateTaskValidator } from '#validators/task'
import { errors as vineErrors } from '@vinejs/vine'
import { getTaskByType } from '#utils/tasks'
import { createTaskRegistrationValidator } from '#validators/task_registration'
import Team from '#models/team/team'
import TeamPolicy from '#policies/team_policy'
import { DateTime } from 'luxon'
import TaskRegistration from '#models/task/task_registration'
import EventPolicy from '#policies/event_policy'

export default class TasksController {
  /**
   * Display a list of tasks for an event
   */
  async index({ bouncer, params }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.event_id)

    await bouncer.with(EventPolicy).authorize('view', event)

    const canManage = await bouncer.with(TaskPolicy).allows('create', event)

    var tasks = await Task.query()
      .where('event_id', event.id)
      .if(!canManage, (q) => q.where('status', 'ACTIVE'))

    return Promise.all(tasks.map(async (task) => getTaskByType(task)))
  }

  /**
   * Handle form submission for the creation action
   */
  async store({ bouncer, params, request, response }: HttpContext) {
    const event = await Event.findByUuidOrSlug(params.event_id)
    await bouncer.with(TaskPolicy).authorize('create', event)

    const payload = await request.validateUsing(createTaskValidator)

    const { requirementsDocumentUrl, ...taskPayload } = payload

    const task = await db.transaction(async (trx) => {
      const newTask = await event.related('tasks').create(
        Task.datesFromPayload({ status: 'DRAFT', autoregister: false, ...taskPayload }),
        { client: trx },
      )

      switch (newTask.taskType) {
        case 'HACKATHON': {
          if (!requirementsDocumentUrl)
            throw new vineErrors.E_VALIDATION_ERROR([{
              field: 'requirementsDocumentUrl',
              message: 'requirementsDocumentUrl is required for HACKATHON tasks',
              rule: 'required',
            }])

          await HackathonTask.create(
            { taskId: newTask.id, requirementsDocumentUrl: requirementsDocumentUrl },
            { client: trx },
          )
          break
        }
        // Future task types go here
      }

      // Autoregister all teams to new task that is set to autoregister
      if (newTask.autoregister) {
        const eventTeams = await event.related('teams').query()

        for (const team of eventTeams)
          await newTask.related('registrations').create({
            teamId: team.id,
          }, { client: trx })
      }

      return newTask
    })

    return response.created(task)
  }

  /**
   * Show individual record
   */
  async show({ bouncer, params }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.id)
    await bouncer.with(TaskPolicy).authorize('view', task)

    return getTaskByType(task)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, params, request }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.id)
    await bouncer.with(TaskPolicy).authorize('edit', task)

    const payload = await request.validateUsing(updateTaskValidator, {
      meta: { taskSlug: task.slug },
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

    await task.delete() // Will delete related Type specific tasks due to cascade delete.
    return response.noContent()
  }

  /**
   * Handle form submission for the create action of task registration
   */
  async storeTaskRegistration({ bouncer, params, request, response }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.taskId)

    const payload = await request.validateUsing(createTaskRegistrationValidator)

    const team = await Team.findOrFail(payload.teamId)

    // 1. Check if user has permission to register the team to the task
    await bouncer.with(TeamPolicy).authorize('registerToTask', team)

    // 2. Check if team belongs to the same event as the task
    if (team.eventId !== task.eventId)
      return response.badRequest({ message: 'Team does not belong to the same event as the task' })

    // 4. Check if registration is open for the task
    const now = DateTime.now()

    if (task.registrationStartAt && now < task.registrationStartAt)
      return response.badRequest({ message: 'Registration for the task has not started yet' })

    if (task.registrationEndAt && now > task.registrationEndAt)
      return response.badRequest({ message: 'Registration for the task has already ended' })

    // 5. Check if team size is within limits for the event
    const event = await task.related('event').query().firstOrFail()
    await team.loadCount('members')
    const memberCount = team.$extras.members_count

    if (memberCount < event.minTeamSize || memberCount > event.maxTeamSize)
      return response.badRequest({ message: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}` })

    // 6. Check if task is set to autoregister and if so, prevent manual registration
    if (task.autoregister)
      return response.badRequest({ message: 'Task is set to autoregister, manual registration is not allowed' })

    // 7. Check if team is already registered to the task
    const existing = await team
      .related('taskRegistrations')
      .query()
      .where('task_id', task.id)
      .first()

    if (existing)
      return response.conflict({ message: 'Team is already registered to the task' })

    const taskRegistration = await team.related('taskRegistrations').create({
      taskId: task.id,
    })

    return response.created(taskRegistration)
  }

  /**
   * Delete record of Task Registration
   */
  async destroyTaskRegistration({ bouncer, params, response }: HttpContext) {
    const taskRegistration = await TaskRegistration.findOrFail(params.id)

    await taskRegistration.load('team')
    const team = taskRegistration.team

    await bouncer.with(TeamPolicy).authorize('registerToTask', team)

    await taskRegistration.delete()
    return response.noContent()
  }
}
