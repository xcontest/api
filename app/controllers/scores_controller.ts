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

import ScoringCriterion from '#models/scoring_criterion'
import Task from '#models/task/task'
import TaskPolicy from '#policies/task_policy'
import { createScoringCriterionValidator, updateScoringCriterionValidator } from '#validators/score'
import type { HttpContext } from '@adonisjs/core/http'

export default class ScoresController {
  /**
   * Display a list of ScoringCriterion resources
   */
  async indexCriteria({ bouncer, params }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.task_id)
    await bouncer.with(TaskPolicy).authorize('view', task)

    return ScoringCriterion.query().where('task_id', task.id)
  }


  /**
   * Handle form submission for the create action of ScoringCriterion
   */
  async storeCriteria({ bouncer, params, request, response }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.task_id)
    await bouncer.with(TaskPolicy).authorize('edit', task)

    const payload = await request.validateUsing(createScoringCriterionValidator)

    const criterion = await task.related('scoringCriteria').create(payload)

    return response.created(criterion)
  }

  /**
   * Show an individual record of ScoringCriterion
   */
  async showCriteria({ bouncer, params }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.task_id)
    await bouncer.with(TaskPolicy).authorize('view', task)

    return await ScoringCriterion.query()
      .where('id', params.id)
      .where('task_id', task.id)
      .firstOrFail()
  }

  /**
   * Handle form submission for the edit action of a ScoringCriterion
   */
  async updateCriteria({ bouncer, params, request }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.task_id)
    await bouncer.with(TaskPolicy).authorize('edit', task)

    const criterion = await ScoringCriterion.query()
      .where('id', params.id)
      .where('task_id', task.id)
      .firstOrFail()

    const payload = await request.validateUsing(updateScoringCriterionValidator)

    criterion.merge(payload)
    await criterion.save()

    return criterion
  }

  /**
   * Delete a ScoringCriterion record
   */
  async destroyCriteria({ bouncer, params, response }: HttpContext) {
    const task = await Task.findByUuidOrSlug(params.task_id)
    await bouncer.with(TaskPolicy).authorize('edit', task)

    const criterion = await ScoringCriterion.query()
      .where('id', params.id)
      .where('task_id', task.id)
      .firstOrFail()

    await criterion.delete()

    return response.noContent()
  }
}
