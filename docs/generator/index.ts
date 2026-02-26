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

import app from '@adonisjs/core/services/app'
import type { HttpRouterService } from '@adonisjs/core/types'
import type { InfoObject, OperationObject, PathItemObject, ResponsesObject, SchemaObject, TagObject } from 'openapi3-ts/oas31'
import { OpenApiBuilder } from 'openapi3-ts/oas31'
import useColors from '@poppinss/colors'
import type {
  ApiColumnOptions,
  ApiOperationOptions,
  ApiRequestOptions,
  ApiResponseData,
  ResponseDataType,
} from './decorators.js'
import type { VineAny, VineValidator } from '@vinejs/vine'
import vine from '@vinejs/vine'
import { BaseModel } from '@adonisjs/lucid/orm'
import type { ColumnOptions } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'
import openapiConfig from '#config/openapi'
import { getHtmlDocument, type HtmlRenderingConfiguration } from '@scalar/core/libs/html-rendering'
import * as fs from 'node:fs/promises'

const colors = useColors.ansi()

type Route = ReturnType<HttpRouterService['toJSON']>['root'][number]
type RouteHandler = Route['handler']

type PartialOperation = Promise<Partial<OperationObject>>

let IS_SILENT = false
const log = (...args: any[]) => {
  if (!IS_SILENT)
    // eslint-disable-next-line no-console
    console.log(...args)
}
const warn = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(colors.yellow(`  ! ${message}`))
}

// Gets api tag for a route handler.
// It first checks for a tag on controller method, then controller class,
// and finally falls back to using the controller name without 'Controller' suffix.
const getApiTagFor = async (handler: RouteHandler): Promise<TagObject> => {
  if ('reference' in handler) {
    // @ts-ignore
    // eslint-disable-next-line @unicorn/no-await-expression-member
    const handlerClass = (await handler.reference[0]()).default
    return Reflect.getMetadata('spec:tag', handlerClass.prototype, handler.reference[1])
      ?? Reflect.getMetadata('spec:tag', handlerClass)
      ?? { name: handlerClass.name.split('Controller')[0], description: `Endpoints provided by ${handlerClass.name}` }
  } else
    return { name: 'Default', description: 'Default tag for all non-classified endpoints' }
}

// Gets meta tag for a route handler.
const getMetaTag = async <T>(handler: RouteHandler, key: string): Promise<T | null> => {
  if ('reference' in handler) {
    // @ts-ignore
    // eslint-disable-next-line @unicorn/no-await-expression-member
    const handlerClass = (await handler.reference[0]()).default
    return Reflect.getMetadata(key, handlerClass.prototype, handler.reference[1]) ?? null
  } else
    return null
}

// Gets operation id for a route handler.
// Operation id is a combination of the controller name and method name.
// If the above method fails, it generates operation id based on the route pattern.
const getOperationIdFor = (handler: RouteHandler, pattern: string): string => {
  if ('reference' in handler)
    // @ts-ignore
    return `${handler.reference[0].name}.${handler.reference[1]}`
  else
    return `global${pattern === '/' ? '.index' : pattern.replace('/', '.')}`
}

// Replaces an Adonis pattern with the OpenAPI path. (e.g. '/users/:id' -> '/users/{id}')
const convertPatternToPath = (pattern: string) =>
  pattern.replace(/:([a-zA-Z_]+)/g, '{$1}')

// Generate basic data for an operation.
// This includes summary, description, and deprecated status.
const generateOperationData = async (route: Route): PartialOperation => {
  const operation = await getMetaTag<ApiOperationOptions>(route.handler, 'spec:operation')
  return (operation ?? {}) as PartialOperation
}

// Generate request data for an operation.
// This includes parameters and request body schema.
const generateRequestData = async (route: Route): Promise<PartialOperation> => {
  const requestBodies = await getMetaTag<ApiRequestOptions[]>(route.handler, 'spec:requestBody')
  if (!requestBodies)
    return {}

  const data: Partial<OperationObject> = {
    parameters: [], // This function is called before parameters are generated.
  }

  for (const requestBody of requestBodies)
    if ('validator' in requestBody) {
      const validator = requestBody.validator as VineValidator<any, any>
      const properties = validator.schema.getProperties()

      // Take params from the validator
      const { params, qs, ...rest } = properties
      const paramsObj = params ? params.getProperties() : {}
      const qsObj = qs ? qs.getProperties() : {}

      // Path properties
      for (const [key, value] of Object.entries(paramsObj as Record<string, VineAny>))
        data.parameters!.push({
          name: key,
          in: 'path',
          required: true,
          schema: value.toJSONSchema() as SchemaObject,
        })

      // Query string
      for (const [key, value] of Object.entries(qsObj as Record<string, VineAny>))
        data.parameters!.push({
          name: key,
          in: 'query',
          required: false,
          schema: value.toJSONSchema() as SchemaObject,
        })

      // Body
      if (rest && Object.keys(rest).length > 0) {
        const restObj = vine.object(rest)

        data.requestBody = {
          content: {
            'application/json': {
              schema: restObj.toJSONSchema() as SchemaObject,
            },
          },
        }
      }
    }

  return data
}

// Generate SchemaObject from either a Vine validator or Lucid model
const generateSchemaForDataType = (schemas: { [key: string]: SchemaObject }, data: ApiResponseData['data']): SchemaObject | undefined => {
  if (!data)
    return undefined

  if (Array.isArray(data))
    return {
      type: 'array',
      items: generateSchemaForDataType(schemas, data[0]),
    }
  // @ts-ignore
  else if (data.prototype instanceof BaseModel) {
    // @ts-ignore
    const modelName = data.name
    if (schemas[modelName])
      return { $ref: `#/components/schemas/${modelName}` }
    // @ts-ignore
    const columnsDefinitions: Map<string, ColumnOptions> = data.$columnsDefinitions

    const requiredFields: string[] = []
    schemas[modelName] = {
      type: 'object',
      properties: Object.fromEntries(columnsDefinitions.entries().map(([column, options]) => {
        if (options.serializeAs === null)
          return null

        // @ts-ignore
        const columnData = Reflect.getMetadata('spec:column', data.prototype, column) as ApiColumnOptions & {
          type: ResponseDataType
        }
        if (columnData?.hidden)
          return null

        if (!columnData?.type) {
          // @ts-ignore
          warn(`Couldn't infer type for column ${column} on model for table ${data.table}. Please add @ApiColumn decorator to the column in question.`)
          return null
        }

        if ('type' in columnData?.type)
          // @ts-ignore
          warn(`Found field 'type' on column type. @ApiColumn takes two *separate* arguments: type and options. ${column}@${data.table}`)

        const baseType: Partial<SchemaObject>
          = generateSchemaForDataType(schemas, columnData.type) ?? {
            type: 'null',
            description: 'Failed to infer (override)',
          }

        if (columnData.required ?? true)
          requiredFields.push(column)

        return [
          column,
          {
            description: columnData?.description,
            format: columnData?.format,
            example: columnData?.example,
            ...baseType,
          },
        ]
      }).filter((obj) => !!obj)),
      required: requiredFields,
    }
    return { $ref: `#/components/schemas/${modelName}` }
  } else if (data instanceof _ApiWrappedData) {
    const values = data.values.map((value) => generateSchemaForDataType(schemas, value))

    if (values.some((value) => value === undefined || value === null))
      throw new Error('Invalid wrapped data. All values must be defined and non-null.')
    return data.wrapper(values as SchemaObject[])
  } else if ('toJSONSchema' in data && typeof data.toJSONSchema === 'function')
    return data.toJSONSchema() as SchemaObject
  else if (data === Number)
    return { type: 'number' }
  else if (data === String)
    return { type: 'string' }
  else if (data === Object)
    return { type: 'object' }
  else if (data === Boolean)
    return { type: 'boolean' }
  else if (data === Date)
    return { type: 'string', format: 'date' }
  else if (data === DateTime)
    return { type: 'string', format: 'date-time' }
  // @ts-ignore
  else if (!data.prototype) { // Some primitive object
    const requiredFields: string[] = []
    return {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          if (!key.startsWith('_')) // _name is optional
            requiredFields.push(key)
          return [
            key.replace(/^_/g, ''),
            generateSchemaForDataType(schemas, value) ?? {
              type: 'null',
              description: 'Failed to infer',
            },
          ]
        }),
      ),
      required: requiredFields,
    }
  } else
    throw new Error(`Unsupported data type for response body: ${typeof data}`)
}

// Generate response data for an operation.
// This includes status codes, headers, and content.
const generateResponseData = async (schemas: { [key: string]: SchemaObject }, route: Route): Promise<PartialOperation> => {
  const responses: ResponsesObject = {}
  const responseData = await getMetaTag<ApiResponseData[]>(route.handler, 'spec:responses')
  if (!responseData)
    return {}

  // Special case for ApiRequest with withResponse option on validator
  const request = await getMetaTag<ApiRequestOptions>(route.handler, 'spec:requestBody')
  if (request && 'validator' in request && request.withResponse) {
    if (!schemas['ValidationError'])
      schemas['ValidationError'] = vine
        .object({
          errors: vine.array(
            vine.object({
              message: vine.string(),
              rule: vine.string(),
              field: vine.string(),
            }),
          ),
        })
        .toJSONSchema() as SchemaObject
    responses[422] = {
      description: 'Provided request data did not pass validation',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ValidationError',
          },
        },
      },
    }
  }

  for (const response of responseData) {
    const { status, description, data } = response
    const responseSchema = generateSchemaForDataType(schemas, data)
    responses[status] = {
      description: description,
      content: responseSchema ? { 'application/json': responseSchema ? {
        schema: responseSchema,
      } : undefined } : undefined,
    }
  }

  return { responses }
}

export type ApiSpecGeneratorConfig = {
  hideDefaultTag?: boolean,
  info: InfoObject,
  output: {
    directory: string,
    emitHtml: boolean,
    htmlConfig?: Partial<HtmlRenderingConfiguration>
  }
}

// Automatically generate OpenApi3 spec from decorators on Adonis controllers.
export const generateApiSpec = async (config?: { silent?: boolean, makeServer?: boolean }) => {
  IS_SILENT = config?.silent ?? false
  log(colors.yellow('Generating OpenAPI spec...'))
  if (config?.makeServer) {
    const server = await app.container.make('server')
    await server.boot()
  }
  const router = await app.container.make('router')

  const tags: Record<string, TagObject> = {}
  const operations: { [key: string]: PathItemObject } = {}
  const schemas: { [key: string]: SchemaObject } = {}

  for (const route of router.toJSON().root) {
    log(colors.gray(`❯ Processing route ${route.pattern}`))
    const apiTag = await getApiTagFor(route.handler)
    if (openapiConfig.hideDefaultTag && apiTag.name === 'Default')
      continue

    tags[apiTag.name] = apiTag

    const path = convertPatternToPath(route.pattern)

    if (!operations[path])
      operations[path] = {}
    for (const method of route.methods.filter((m) => m !== 'HEAD')) {
      Object.assign(operations[path], {
        [method.toLowerCase()]: {
          operationId: getOperationIdFor(route.handler, route.pattern),
          tags: [apiTag.name],

          ...(await generateOperationData(route)),
          ...(await generateResponseData(schemas, route)),
          ...(await generateRequestData(route)),
        },
      })

      if (route.middleware.all().values().some((mwr) => mwr.name === 'auth')) {
        const pathObject = operations[path][method.toLowerCase() as keyof PathItemObject] as OperationObject
        pathObject.security = [{ session: [] }]
      }
    }

    log(colors.green('  ✔') + colors.gray(' Gathered data for route.'))
  }

  const builder = OpenApiBuilder.create()
  builder.addSecurityScheme('session', {
    type: 'apiKey',
    in: 'cookie',
    name: 'xcontest-session',
  })
  Object.values(tags).forEach((tag) => builder.addTag(tag))
  Object.entries(schemas).forEach(([name, schema]) => builder.addSchema(name, schema))
  Object.entries(operations).forEach(([path, operation]) => builder.addPath(path, operation))

  builder.addInfo(openapiConfig.info)

  log(colors.gray(`❯ Emitting output to ${openapiConfig.output.directory}`))
  await fs.writeFile(`${openapiConfig.output.directory}/openapi.json`, builder.getSpecAsJson(), 'utf-8')
  log(colors.green('  ✔') + colors.gray(' openapi.json generated.'))
  if (openapiConfig.output.emitHtml) {
    await fs.writeFile(
      `${openapiConfig.output.directory}/spec.html`,
      // @ts-ignore
      getHtmlDocument(openapiConfig.output.htmlConfig),
      'utf-8',
    )
    log(colors.green('  ✔') + colors.gray(' spec.html generated.'))
  }

  log(colors.green('OpenAPI spec generation complete!'))
  return builder
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class _ApiWrappedData {
  public values: ResponseDataType[]
  public wrapper: (values: SchemaObject[]) => SchemaObject

  constructor(values: ResponseDataType[], wrapper: (values: SchemaObject[]) => SchemaObject) {
    this.values = values
    this.wrapper = wrapper
  }
}
