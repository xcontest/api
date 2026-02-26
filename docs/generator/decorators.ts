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

import 'reflect-metadata'
import type { VineValidator } from '@vinejs/vine'
import type { BaseModel } from '@adonisjs/lucid/orm'
import type { SchemaObjectFormat } from 'openapi3-ts/oas30'
import type { _Merged } from './tools.js'

const makeMetaDecorator = <Args extends any[]>(tag: string, transformArgs: (args: Args) => any = (a) => a[0], acceptClass: boolean = false) =>
  (...args: Args) => (target: any, propertyKey?: string | symbol) => {
    if (propertyKey)
      Reflect.defineMetadata(tag, transformArgs(args), target, propertyKey) // Method Decorator
    else
      if (acceptClass)
        Reflect.defineMetadata(tag, transformArgs(args), target) // Class Decorator
      else
        throw new Error(`Decorator ${tag} can only be applied to methods`)
  }

export const ApiTag = makeMetaDecorator<[string, string?]>('spec:tag', ([name, description]) => ({ name, description }), true)

export interface ApiOperationOptions {
  summary?: string
  description?: string
  deprecated?: boolean
}
export const ApiOperation = makeMetaDecorator<[ApiOperationOptions]>('spec:operation')

export type ApiRequestOptions = {
  validator: VineValidator<any, any>,
  withResponse?: boolean
} // TODO: Add support for custom request data if necessary in the future
export const ApiRequest = makeMetaDecorator<[ApiRequestOptions]>('spec:requestBody')

export type PrimitiveResponseDataType = typeof BaseModel | typeof _Merged | object
export type ResponseDataType = PrimitiveResponseDataType | [PrimitiveResponseDataType]

export type ApiResponseOptions = {
  description?: string,
  data?: ResponseDataType
}
export type ApiResponseData = ApiResponseOptions & { status: number }
export const ApiResponse = (status: number, options: ApiResponseOptions) =>
  (target: any, propertyKey: string | symbol) => {
    if (!propertyKey)
      throw new Error('Decorator ApiResponse can only be applied to methods')

    const current = Reflect.getMetadata('spec:responses', target, propertyKey) ?? []
    Reflect.defineMetadata('spec:responses', [...current, { status: status, ...options }], target, propertyKey)
  }

export type ApiColumnOptions = {
  format?: SchemaObjectFormat,
  example?: any,
  description?: string,
  required?: boolean,
  hidden?: boolean,
}
export const ApiColumn = makeMetaDecorator<[ResponseDataType, ApiColumnOptions?]>('spec:column', ([type, options]) => ({ type, ...options }))
