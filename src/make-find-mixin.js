import { getServicePrefix, getServiceCapitalization } from './utils'

export default function makeFindMixin (options) {
  const { service, params, fetchQuery, queryWhen = true, local = false, qid = 'default', items } = options
  let { name, watch = [] } = options

  if (typeof watch === 'string') {
    watch = [watch]
  } else if (typeof watch === 'boolean' && watch) {
    watch = ['params']
  }

  if (!service || (typeof service !== 'string' && typeof service !== 'function')) {
    throw new Error(`The 'service' option is required in the FeathersVuex make-find-mixin and must be a string.`)
  }
  if (typeof service === 'function' && !name) {
    name = 'service'
  }

  const nameToUse = (name || service).replace('-', '_')
  const prefix = getServicePrefix(nameToUse)
  const capitalized = getServiceCapitalization(nameToUse)
  const SERVICE_NAME = `${prefix}ServiceName`
  let ITEMS = items || prefix
  if (typeof service === 'function' && name === 'service' && !items) {
    ITEMS = 'items'
  }
  const IS_FIND_PENDING = `isFind${capitalized}Pending`
  const PARAMS = `${prefix}Params`
  const FETCH_PARAMS = `${prefix}FetchParams`
  const WATCH = `${prefix}Watch`
  const QUERY_WHEN = `${prefix}QueryWhen`
  const FIND_ACTION = `find${capitalized}`
  const PAGINATION = `${prefix}PaginationData`
  const LOCAL = `${prefix}Local`
  const QID = `${prefix}Qid`
  const data = {
    [IS_FIND_PENDING]: false,
    [WATCH]: watch,
    [QID]: qid
  }

  const mixin = {
    data () {
      return data
    },
    computed: {
      [ITEMS] () {
        return this[PARAMS] ? this.$store.getters[`${this[SERVICE_NAME]}/find`](this[PARAMS]).data : []
      }
    },
    methods: {
      [FIND_ACTION] () {
        const paramsToUse = this[FETCH_PARAMS] || this[PARAMS]

        if (!this[LOCAL]) {
          if (typeof this[QUERY_WHEN] === 'function' ? this[QUERY_WHEN](paramsToUse) : this[QUERY_WHEN]) {
            this[IS_FIND_PENDING] = true

            if (paramsToUse) {
              paramsToUse.query = paramsToUse.query || {}

              if (qid) {
                paramsToUse.qid = qid
              }

              return this.$store.dispatch(`${this[SERVICE_NAME]}/find`, paramsToUse)
                .then(() => {
                  this[IS_FIND_PENDING] = false
                })
            }
          }
        }
      }
    },
    created () {
      if (this[PARAMS] || this[FETCH_PARAMS]) {
        watch.forEach(prop => {
          if (typeof prop !== 'string') {
            throw new Error(`Values in the 'watch' array must be strings.`)
          }
          prop = prop.replace('params', PARAMS)

          if (this[FETCH_PARAMS]) {
            if (prop.startsWith(PARAMS)) {
              prop.replace(PARAMS, FETCH_PARAMS)
            }
          }
          this.$watch(prop, this[FIND_ACTION])
        })

        return this[FIND_ACTION]()
      }
    }
  }

  if (qid) {
    mixin.computed[PAGINATION] = function () {
      return this.$store.state[this[SERVICE_NAME]].pagination[qid]
    }
  }

  setupAttribute(SERVICE_NAME, service, 'computed', true)
  setupAttribute(PARAMS, params)
  setupAttribute(FETCH_PARAMS, fetchQuery)
  setupAttribute(QUERY_WHEN, queryWhen, 'method')
  setupAttribute(LOCAL, local)

  function setupAttribute (NAME, value, computedOrMethod = 'computed', returnTheValue = false) {
    if (typeof value === 'boolean') {
      data[NAME] = !!value
    } else if (typeof value === 'string') {
      mixin.computed[NAME] = function () {
        // If the specified computed prop wasn't found, display an error.
        if (returnTheValue) {

        } else {
          if (!hasSomeAttribute(this, value, NAME)) {
            throw new Error(`Value for ${NAME} was not found on the component at '${value}'.`)
          }
        }
        return returnTheValue ? value : this[value]
      }
    } else if (typeof value === 'function') {
      mixin[computedOrMethod][NAME] = value
    }
  }

  function hasSomeAttribute (vm, ...attributes) {
    return attributes.some(a => {
      return vm.hasOwnProperty(a) || Object.getPrototypeOf(vm).hasOwnProperty(a)
    })
  }

  return mixin
}