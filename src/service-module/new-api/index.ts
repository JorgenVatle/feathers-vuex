/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import prepareMakeServicePlugin from './make-service-plugin'
import makeModel from './make-model'
import prepareAddModel from './add-model'
import models from './global-models'

export interface FeathersVuexOptions {
  idField?: string
  nameStyle?: string
  serverAlias: string
}
const defaultOptions = {
  idField: 'id',
  nameStyle: 'short'
}

export default function feathersVuex(feathers, options: FeathersVuexOptions) {
  options = Object.assign({}, defaultOptions, options)
  const BaseModel = makeModel(options)
  const makeServicePlugin = prepareMakeServicePlugin(options)
  const addModel = prepareAddModel(options)

  return {
    makeServicePlugin,
    BaseModel,
    addModel,
    models
  }
}
