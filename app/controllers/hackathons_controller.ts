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

import HackathonTask from '#models/hackathon/hackathon_task'
import JuryMember from '#models/hackathon/jury_member'
import Organization from '#models/organization'
import Task from '#models/task/task'
import User from '#models/user'
import EventPolicy from '#policies/event_policy'
import TaskPolicy from '#policies/task_policy'
import { createJuryMemberValidator, updateJuryMemberValidator } from '#validators/jury_member'
import { updateHackathonTaskValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import { ApiOperation, ApiRequest, ApiResponse } from '#openapi/decorators'

export default class HackathonsController {
  @ApiOperation({ description: 'Get a specific hackathon task by its ID or slug' })
  @ApiResponse(200, { description: 'The requested hackathon task', data: HackathonTask })
  @ApiResponse(404, { description: 'Hackathon task not found' })
  @ApiResponse(403, { description: 'Missing permission to view this task' })
  async showTask({ bouncer, params }: HttpContext) {
    let hackathonTask = await HackathonTask.query()
      .where('id', params.id)
      .preload('task')
      .first()

    if (!hackathonTask) {
      const task = await Task.findByUuidOrSlug(params.id)
      hackathonTask = await HackathonTask.query()
        .where('task_id', task.id)
        .preload('task')
        .firstOrFail()
    }

    await bouncer.with(TaskPolicy).authorize('view', hackathonTask.task)

    return hackathonTask
  }

  @ApiOperation({ description: 'Update a hackathon task by its ID or slug' })
  @ApiRequest({ validator: updateHackathonTaskValidator, withResponse: true })
  @ApiResponse(200, { description: 'The updated hackathon task', data: HackathonTask })
  @ApiResponse(404, { description: 'Hackathon task not found' })
  @ApiResponse(403, { description: 'Missing permission to edit this task' })
  async updateTask({ bouncer, params, request }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.id)
    await bouncer.with(TaskPolicy).authorize('edit', task)

    const hackathonTask = await HackathonTask.findByOrFail('task_id', task.id)

    const payload = await request.validateUsing(updateHackathonTaskValidator)
    hackathonTask.merge(payload)
    await hackathonTask.save()

    return hackathonTask
  }

  @ApiOperation({ description: 'Get a list of jury members for a hackathon task' })
  @ApiResponse(200, { description: 'A list of jury members for the task', data: [JuryMember] })
  @ApiResponse(404, { description: 'Task not found' })
  async indexJuryMembers({ params }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.id)
    return task.related('juryMembers').query().preload('user')
  }

  @ApiOperation({ description: 'Create a new jury member for a hackathon task' })
  @ApiRequest({ validator: createJuryMemberValidator, withResponse: true })
  @ApiResponse(201, { description: 'The newly created jury member', data: JuryMember })
  @ApiResponse(404, { description: 'Task not found' })
  @ApiResponse(403, { description: 'Missing permission to manage jury members' })
  @ApiResponse(400, { description: 'Invalid request or jury members can only be assigned to hackathon tasks' })
  @ApiResponse(409, { description: 'User is already a jury member' })
  async storeJuryMember({ bouncer, params, request, response }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.id)
    const event = await task.related('event').query().firstOrFail()

    await bouncer.with(EventPolicy).authorize('manageJuryMembers', event)

    if (task.taskType !== 'HACKATHON')
      return response.badRequest({ message: 'Jury members can only be assigned to hackathon tasks' })

    const payload = await request.validateUsing(createJuryMemberValidator)
    const user = await User.findOrFail(payload.userId)

    const existing = await JuryMember.query()
      .where('task_id', task.id)
      .where('user_id', user.id)
      .first()

    if (existing)
      return response.conflict({ message: 'User is already a jury member' })

    if (!await Organization.belongsToEvent(payload.organizationId, event.id))
      return response.badRequest({ message: 'Organization does not belong to the event' })

    const juryMember = await task.related('juryMembers').create({
      userId: user.id,
      organizationId: payload.organizationId,
      description: payload.description,
    })

    return response.created(juryMember)
  }

  @ApiOperation({ description: 'Get a specific jury member by ID' })
  @ApiResponse(200, { description: 'The requested jury member', data: JuryMember })
  @ApiResponse(404, { description: 'Jury member not found' })
  @ApiResponse(403, { description: 'Missing permission to view this event' })
  async showJuryMember({ bouncer, params }: HttpContext) {
    const juryMember = await JuryMember.findOrFail(params.juryMemberId)
    const task = await juryMember.related('task').query().firstOrFail()
    const event = await task.related('event').query().firstOrFail()

    await bouncer.with(EventPolicy).authorize('view', event)

    return juryMember
  }

  @ApiOperation({ description: 'Update a jury member by ID' })
  @ApiRequest({ validator: updateJuryMemberValidator, withResponse: true })
  @ApiResponse(200, { description: 'The updated jury member', data: JuryMember })
  @ApiResponse(404, { description: 'Jury member not found' })
  @ApiResponse(403, { description: 'Missing permission to manage jury members' })
  async updateJuryMember({ bouncer, params, request, response }: HttpContext) {
    const juryMember = await JuryMember.findOrFail(params.juryMemberId)
    const task = await juryMember.related('task').query().firstOrFail()
    const event = await task.related('event').query().firstOrFail()

    await bouncer.with(EventPolicy).authorize('manageJuryMembers', event)

    const payload = await request.validateUsing(updateJuryMemberValidator)

    if (!await Organization.belongsToEvent(payload.organizationId, event.id))
      return response.badRequest({ message: 'Organization does not belong to the event' })

    juryMember.merge(payload)
    await juryMember.save()
    return juryMember
  }

  @ApiOperation({ description: 'Delete a jury member by ID' })
  @ApiResponse(204, { description: 'Jury member deleted successfully' })
  @ApiResponse(404, { description: 'Jury member not found' })
  @ApiResponse(403, { description: 'Missing permission to manage jury members' })
  async destroyJuryMember({ bouncer, params, response }: HttpContext) {
    const juryMember = await JuryMember.findOrFail(params.juryMemberId)
    const task = await juryMember.related('task').query().firstOrFail()
    const event = await task.related('event').query().firstOrFail()

    await bouncer.with(EventPolicy).authorize('manageJuryMembers', event)

    await juryMember.delete()
    return response.noContent()
  }
}
