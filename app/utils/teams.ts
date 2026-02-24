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

import { DateTime } from 'luxon'
import { randomInt, randomBytes } from 'node:crypto'

export const invitationValidity = {
  '1 hour': () => DateTime.now().plus({ hours: 1 }),
  '4 hours': () => DateTime.now().plus({ hours: 4 }),
  '12 hours': () => DateTime.now().plus({ hours: 12 }),
  '1 day': () => DateTime.now().plus({ days: 1 }),
  '3 days': () => DateTime.now().plus({ days: 3 }),
  '1 week': () => DateTime.now().plus({ weeks: 1 }),
} as const

const adjectives = [
  'ACUTE', 'ADAPT', 'ADEPT', 'ALIVE', 'BASIC', 'BRAVE', 'BRIEF', 'BRISK',
  'BROAD', 'CHILL', 'CLEAN', 'CLEAR', 'CRISP', 'ELITE', 'EVERY', 'EXTRA',
  'FAINT', 'FANCY', 'FINAL', 'FRESH', 'GRAND', 'GREAT', 'GREEN', 'HAPPY',
  'HARDY', 'HEAVY', 'IDEAL', 'JOLLY', 'LARGE', 'LIGHT', 'LOOSE', 'LUCKY',
  'MIGHT', 'NOBLE', 'OUTER', 'POLAR', 'PROUD', 'QUICK', 'QUIET', 'RAPID',
  'READY', 'SHARP', 'SMALL', 'SMART', 'SOLID', 'STARK', 'SUPER', 'SWIFT',
  'TOUGH', 'VIVID',
] as const

const nouns = [
  'ALDER', 'AMBER', 'ARROW', 'ATLAS', 'BEACH', 'BISON', 'BLAST', 'BREEZ',
  'BROOK', 'CHASE', 'CLOUD', 'COAST', 'COMET', 'CRANE', 'CREST', 'DELTA',
  'DRAFT', 'DRAKE', 'EAGLE', 'EARTH', 'EMBER', 'FIELD', 'FLAME', 'FLINT',
  'FOCUS', 'FORCE', 'FROST', 'GLARE', 'GORGE', 'GROVE', 'HEART', 'LIGHT',
  'LUNAR', 'METRO', 'NORTH', 'OCEAN', 'ORBIT', 'PEARL', 'PILOT', 'PLANE',
  'PRISM', 'PULSE', 'RIVER', 'SHADE', 'SHARK', 'SOLAR', 'SPARK', 'STORM',
  'TIGER', 'VAPOR',
] as const


export function generateMemorableToken(): string {
  const adj = adjectives[randomInt(adjectives.length)]
  const noun = nouns[randomInt(nouns.length)]
  const code = randomInt(1000, 9999)

  return `${adj}-${noun}-${code}`
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url')
}
