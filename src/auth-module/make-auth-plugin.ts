/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { ActionTree, GetterTree, MutationTree } from 'vuex'
import { FeathersVuexOptions } from '../service-module/types'
import setupState from './auth-module.state'
import setupGetters from './auth-module.getters'
import setupMutations from './auth-module.mutations'
import setupActions from './auth-module.actions'

interface AuthPluginState {
  accessToken: string;
  entityIdField: string;
  errorOnAuthenticate: null | string;
  errorOnLogout: null | string;
  isAuthenticatePending: boolean;
  isLogoutPending: boolean;
  payload: any;
  user: any;
  userService: string;
  serverAlias: string;
}

interface MakeAuthPluginOptions<T> {
  namespace: string;
  serverAlias: string;
  userService: string;
  debug: boolean;
  state: T;
  getters: GetterTree<AuthPluginState & T, any>
  mutations: MutationTree<AuthPluginState & T>;
  actions: ActionTree<AuthPluginState & T, any>;
}

const defaults: MakeAuthPluginOptions<{}> = {
  namespace: 'auth',
  userService: '', // Set this to automatically populate the user (using an additional request) on login success.
  serverAlias: 'api',
  debug: false,
  state: {}, // for custom state
  getters: {}, // for custom getters
  mutations: {}, // for custom mutations
  actions: {} // for custom actions
}

export default function authPluginInit(
  feathersClient,
  globalOptions: FeathersVuexOptions
) {
  if (!feathersClient || !feathersClient.service) {
    throw new Error('You must pass a Feathers Client instance to feathers-vuex')
  }

  return function makeAuthPlugin<T>(options: MakeAuthPluginOptions<T>) {
    options = Object.assign(
      {},
      defaults,
      { serverAlias: globalOptions.serverAlias },
      options
    )

    if (!feathersClient.authenticate) {
      throw new Error(
        'You must register the @feathersjs/authentication-client plugin before using the feathers-vuex auth module'
      )
    }
    if (options.debug && options.userService && !options.serverAlias) {
      console.warn(
        'A userService was provided, but no serverAlias was provided. To make sure the user record is an instance of the User model, a serverAlias must be provided.'
      )
    }

    const defaultState = setupState(options)
    const defaultGetters = setupGetters(options)
    const defaultMutations = setupMutations()
    const defaultActions = setupActions(feathersClient)

    return function setupStore(store) {
      const { namespace } = options

      store.registerModule(namespace, {
        namespaced: true,
        state: Object.assign({}, defaultState, options.state),
        getters: Object.assign({}, defaultGetters, options.getters),
        mutations: Object.assign({}, defaultMutations, options.mutations),
        actions: Object.assign({}, defaultActions, options.actions)
      })
    }
  }
}
