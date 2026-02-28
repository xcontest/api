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
import { createHackathonSubmissionValidator, updateHackathonSubmissionValidator } from '#validators/hackathon_submission'
import HackathonTaskSubmission from '#models/hackathon/hackathon_task_submission'
import TaskRegistration from '#models/task/task_registration'
import TeamPolicy from '#policies/team_policy'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import Media from '#models/media'
import drive from '@adonisjs/drive/services/main'

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

  @ApiOperation({ description: 'Create a new submission for a hackathon task' })
  @ApiRequest({ validator: createHackathonSubmissionValidator, withResponse: true })
  @ApiResponse(201, { description: 'The newly created hackathon submission', data: HackathonTaskSubmission })
  @ApiResponse(400, { description: 'Submissions are closed or invalid request or already exists' })
  @ApiResponse(403, { description: 'Missing permission to submit for this task' })
  @ApiResponse(404, { description: 'Task registration not found' })
  async storeHackathonSubmission({ bouncer, request, response }: HttpContext) {
    const payload = await request.validateUsing(createHackathonSubmissionValidator)
    const taskRegistration = await TaskRegistration.query()
      .where('id', payload.taskRegistrationId)
      .preload('team', (q) => q.preload('members'))
      .firstOrFail()

    await bouncer.with(TeamPolicy).authorize('manageSubmissions', taskRegistration.team)

    const task = await Task.findByUuidOrSlug(taskRegistration.taskId)

    const now = DateTime.now()

    if (task.submissionsEndAt && task.submissionsEndAt < now)
      return response.badRequest({ message: 'Submissions are closed for this task' })

    if (task.submissionsStartAt && task.submissionsStartAt > now)
      return response.badRequest({ message: 'Submissions are not open yet for this task' })

    const existingSubmission = await HackathonTaskSubmission.query()
      .where('task_registration_id', taskRegistration.id)
      .first()

    if (existingSubmission)
      return response.badRequest({ message: 'A submission already exists for this task registration' })

    const submission = await HackathonTaskSubmission.create({
      taskRegistrationId: taskRegistration.id,
      description: payload.description,
      repositoryUrl: payload.repositoryUrl,
      demoUrl: payload.demoUrl,
      status: payload.status,
    })

    if (payload.media && payload.media.length > 0)
      for (const [index, mediaItem] of payload.media.entries()) {
        let mediaUrl: string = ''

        if (mediaItem.file) {
          if (mediaItem.mediaType === 'VIDEO')
            return response.badRequest({ message: 'You cannot upload video files, please use a URL instead' })

          const filename = `${randomUUID()}.${mediaItem.file.extname}`
          const path = `hackathon-submissions/${submission.id}/${filename}`
          await mediaItem.file.moveToDisk(path, { disk: 's3' } )
          mediaUrl = await drive.use('s3').getUrl(path)
        } else if (mediaItem.url)
          mediaUrl = mediaItem.url

        await Media.create({
          relatedId: submission.id,
          description: mediaItem.description ?? '',
          mediaType: mediaItem.mediaType ?? 'IMAGE',
          url: mediaUrl,
          galleryIndex: index,
        })
      }

    await submission.load('media')

    return response.created(submission)
  }

  @ApiOperation({ description: 'Get a list of submissions for a hackathon task registration' })
  @ApiResponse(200, { description: 'A list of hackathon submissions', data: [HackathonTaskSubmission] })
  @ApiResponse(403, { description: 'Missing permission to view submissions for this task registration' })
  @ApiResponse(404, { description: 'Task registration not found' })
  async indexHackathonSubmissions({ bouncer, params }: HttpContext) {
    const taskRegistration = await TaskRegistration.query()
      .where('id', params.taskRegistrationId)
      .preload('team', (q) => q.preload('members'))
      .firstOrFail()

    await bouncer.with(TeamPolicy).authorize('viewSubmissions', taskRegistration.team)

    return taskRegistration.related('hackathonSubmissions').query().preload('media')
  }

  @ApiOperation({ description: 'Get a specific hackathon submission by ID' })
  @ApiResponse(200, { description: 'The requested hackathon submission', data: HackathonTaskSubmission })
  @ApiResponse(403, { description: 'Missing permission to view this submission' })
  @ApiResponse(404, { description: 'Hackathon submission not found' })
  async showHackathonSubmission({ bouncer, params }: HttpContext) {
    const submission = await HackathonTaskSubmission.query()
      .where('id', params.id)
      .preload('taskRegistration', (q) => q.preload('team', (r) => r.preload('members')))
      .preload('media')
      .firstOrFail()
   
    await bouncer.with(TeamPolicy).authorize('viewSubmissions', submission.taskRegistration.team)

    return submission
  }

  @ApiOperation({ description: 'Update a hackathon submission by ID' })
  @ApiRequest({ validator: updateHackathonSubmissionValidator, withResponse: true })
  @ApiResponse(200, { description: 'The updated hackathon submission', data: HackathonTaskSubmission })
  @ApiResponse(400, { description: 'Invalid request or submission status transition not allowed' })
  @ApiResponse(403, { description: 'Missing permission to manage this submission' })
  @ApiResponse(404, { description: 'Hackathon submission not found' })
  async updateHackathonSubmission({ bouncer, response, params, request }: HttpContext) {
    const submission = await HackathonTaskSubmission.query()
      .where('id', params.id)
      .preload('taskRegistration', (q) => q.preload('team', (r) => r.preload('members')))
      .firstOrFail()

    await bouncer.with(TeamPolicy).authorize('manageSubmissions', submission.taskRegistration.team)

    const payload = await request.validateUsing(updateHackathonSubmissionValidator)

    if (submission.status === 'ARCHIVED' && payload.status !== 'ARCHIVED')
      return response.badRequest({ message: 'Cannot update an archived submission' })

    if (submission.status === 'ACTIVE' && payload.status === 'DRAFT')
      return response.badRequest({ message: 'Cannot change status of an active submission to draft' })

    submission.merge(payload)
    await submission.save()
    return submission
  }

  @ApiOperation({ description: 'Delete a hackathon submission by ID' })
  @ApiResponse(204, { description: 'Hackathon submission deleted successfully' })
  @ApiResponse(403, { description: 'Missing permission to manage this submission' })
  @ApiResponse(404, { description: 'Hackathon submission not found' })
  async destroyHackathonSubmission({ bouncer, response, params }: HttpContext) {
    const submission = await HackathonTaskSubmission.query()
      .where('id', params.id)
      .preload('taskRegistration', (q) => q.preload('team', (r) => r.preload('members')))
      .firstOrFail()

    await bouncer.with(TeamPolicy).authorize('manageSubmissions', submission.taskRegistration.team)

    await submission.delete()
    return response.noContent()
  }
}
