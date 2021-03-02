import { ViewPlugin } from '@remixproject/engine-web'

import * as packageJson from '../../../../../package.json'
import React from 'react' // eslint-disable-line
import ReactDOM from 'react-dom'
import { Workspace } from '@remix-ui/workspace' // eslint-disable-line
var EventManager = require('../../lib/events')
var { RemixdHandle } = require('../files/remixd-handle.js')
var { GitHandle } = require('../files/git-handle.js')
var globalRegistry = require('../../global/registry')
var examples = require('../editor/examples')
var GistHandler = require('../../lib/gist-handler')
var QueryParams = require('../../lib/query-params')

/*
  Overview of APIs:
   * fileManager: @args fileProviders (browser, shared-folder, swarm, github, etc ...) & config & editor
      - listen on browser & localhost file provider (`fileRenamed` & `fileRemoved`)
      - update the tabs, switchFile
      - trigger `currentFileChanged`
      - set the current file in the config
   * fileProvider: currently browser, swarm, localhost, github, gist
      - link to backend
      - provide properties `type`, `readonly`
      - provide API `resolveDirectory`, `remove`, `exists`, `rename`, `get`, `set`
      - trigger `fileExternallyChanged`, `fileRemoved`, `fileRenamed`, `fileRenamedError`, `fileAdded`
   * file-explorer: treeview @args fileProvider
      - listen on events triggered by fileProvider
      - call fileProvider API
*/

const profile = {
  name: 'fileExplorers',
  displayName: 'File explorers',
  methods: ['createNewFile', 'uploadFile', 'getCurrentWorkspace', 'getWorkspaces', 'createWorkspace'],
  events: ['setWorkspace', 'renameWorkspace', 'deleteWorkspace'],
  icon: 'assets/img/fileManager.webp',
  description: ' - ',
  kind: 'fileexplorer',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/file_explorer.html',
  version: packageJson.version
}

module.exports = class Filepanel extends ViewPlugin {
  constructor (appManager) {
    super(profile)
    this.event = new EventManager() 
    this._components = {}
    this._components.registry = globalRegistry
    this._deps = {
      fileProviders: this._components.registry.get('fileproviders').api,
      fileManager: this._components.registry.get('filemanager').api
    }
    
    this.el = document.createElement('div')
    this.el.setAttribute('id', 'fileExplorerView')
   
    this.remixdHandle = new RemixdHandle(this.remixdExplorer, this._deps.fileProviders.localhost, appManager)
    this.gitHandle = new GitHandle()
    this.registeredMenuItems = []
    this.request = {}

    this.renderComponent()    
  }

  render () {
    return this.el
  }

  renderComponent() {
    ReactDOM.render(
      <Workspace 
        setWorkspace={this.setWorkspace.bind(this)}
        workspaceRenamed={this.workspaceRenamed.bind(this)}
        workspaceDeleted={this.workspaceDeleted.bind(this)}
        workspaceCreated={this.workspaceCreated.bind(this)}
        workspace={this._deps.fileProviders.workspace}
        browser={this._deps.fileProviders.browser}
        localhost={this._deps.fileProviders.localhost}
        fileManager={this._deps.fileManager}
        examples={examples}
        queryParams={new QueryParams()}
        gistHandler={new GistHandler()}
        registry={this._components.registry}
        plugin={this}
        request={this.request}
        registeredMenuItems={this.registeredMenuItems}
      />
      , this.el)   
  }

   /**
   * @param item { id: string, name: string, type?: string[], path?: string[], extension?: string[], pattern?: string[] }	
   * @param callback (...args) => void	
   */	
  registerContextMenuItem (item) {	
    if (!item) throw new Error('Invalid register context menu argument')	
    if (!item.name || !item.id) throw new Error('Item name and id is mandatory')	
    if (!item.type && !item.path && !item.extension && !item.pattern) throw new Error('Invalid file matching criteria provided')	

    this.registeredMenuItems = [...this.registeredMenuItems, item]
    this.renderComponent()
  }

  async getCurrentWorkspace () {
    return await this.request.getWorkspaces()
  }

  async getWorkspaces () {
    return await this.request.getWorkspaces()
  }

  async createNewFile () {
    return await this.request.createNewFile()
  }

  async uploadFile () {
    return await this.request.uploadFile()
  }  

  async createWorkspace () {
    return await this.request.createWorkspace()
  }

  /** these are called by the react component, action is already finished whent it's called */
  async setWorkspace (workspace) {
    this._deps.fileManager.removeTabsOf(this._deps.fileProviders.workspace)
    if (workspace.isLocalhost) {
      this.call('manager', 'activatePlugin', 'remixd')
    } else if (await this.call('manager', 'isActive', 'remixd')) {
      this.call('manager', 'deactivatePlugin', 'remixd')
    }
    this.emit('setWorkspace', workspace)
  }
  
  workspaceRenamed (workspace) {
    this.emit('renameWorkspace', workspace)
  }

  workspaceDeleted (workspace) {
    this.emit('deleteWorkspace', workspace)
  }

  workspaceCreated (workspace) {
    this.emit('createWorkspace', workspace)
  }
  /** end section */  
}
