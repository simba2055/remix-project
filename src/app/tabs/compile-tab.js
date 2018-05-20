var yo = require('yo-yo')
var csjs = require('csjs-inject')

var TreeView = require('../ui/TreeView')
var modalDialog = require('../ui/modaldialog')
var copyToClipboard = require('../ui/copy-to-clipboard')
var modalDialogCustom = require('../ui/modal-dialog-custom')
var styleGuide = require('../ui/styles-guide/theme-chooser')
var parseContracts = require('../contract/contractParser')
var publishOnSwarm = require('../contract/publishOnSwarm')

var styles = styleGuide.chooser()

module.exports = class CompileTab {
  constructor (api = {}, events = {}, opts = {}) {
    const self = this
    self._opts = opts
    self._api = api
    self._events = events
    self._view = {
      el: null,
      autoCompile: null,
      compileButton: null,
      warnCompilationSlow: null,
      compileIcon: null
    }
    self.data = {
      autoCompile: self._opts.config.get('autoCompile'),
      compileTimeout: null,
      contractsDetails: {},
      maxTime: 1000,
      timeout: 300
    }

    self._events.editor.register('contentChanged', scheduleCompilation)
    self._events.editor.register('sessionSwitched', scheduleCompilation)
    function scheduleCompilation () {
      if (!self._opts.config.get('autoCompile')) return
      if (self.data.compileTimeout) window.clearTimeout(self.data.compileTimeout)
      self.data.compileTimeout = window.setTimeout(() => self._api.runCompiler(), self.data.timeout)
    }
    self._events.compiler.register('compilationDuration', function tabHighlighting (speed) {
      if (!self._view.warnCompilationSlow) return
      if (speed > self.data.maxTime) {
        var msg = `Last compilation took ${speed}ms. We suggest to turn off autocompilation.`
        self._view.warnCompilationSlow.setAttribute('title', msg)
        self._view.warnCompilationSlow.style.display = 'inline-block'
      } else {
        self._view.warnCompilationSlow.style.display = 'none'
      }
    })
    self._events.editor.register('contentChanged', function changedFile () {
      if (!self._view.compileIcon) return
      var compileTab = document.querySelector('.compileView') // @TODO: compileView tab
      compileTab.style.color = styles.colors.red // @TODO: compileView tab
      self._view.compileIcon.classList.add(`${css.bouncingIcon}`) // @TODO: compileView tab
    })
    self._events.compiler.register('loadingCompiler', function start () {
      if (!self._view.compileIcon) return
      self._view.compileIcon.classList.add(`${css.spinningIcon}`)
      self._view.warnCompilationSlow.style.display = 'none'
      self._view.compileIcon.setAttribute('title', 'compiler is loading, please wait a few moments.')
    })
    self._events.compiler.register('compilationStarted', function start () {
      if (!self._view.compileIcon) return
      errorContainer.innerHTML = ''
      self._view.compileIcon.classList.remove(`${css.bouncingIcon}`)
      self._view.compileIcon.classList.add(`${css.spinningIcon}`)
      self._view.compileIcon.setAttribute('title', 'compiling...')
    })
    self._events.compiler.register('compilerLoaded', function loaded () {
      if (!self._view.compileIcon) return
      self._view.compileIcon.classList.remove(`${css.spinningIcon}`)
      self._view.compileIcon.setAttribute('title', '')
    })
    self._events.compiler.register('compilationFinished', function finish (success, data, source) {
      if (self._view.compileIcon) {
        var compileTab = document.querySelector('.compileView')
        compileTab.style.color = styles.colors.black
        self._view.compileIcon.style.color = styles.colors.black
        self._view.compileIcon.classList.remove(`${css.spinningIcon}`)
        self._view.compileIcon.classList.remove(`${css.bouncingIcon}`)
        self._view.compileIcon.setAttribute('title', 'idle')
      }
      // reset the contractMetadata list (used by the publish action)
      self.data.contractsDetails = {}
      // refill the dropdown list
      getContractNames(success, data)
      // hightlight the tab if error
      if (success) {
        document.querySelector('.compileView').style.color = ''
      } else {
        document.querySelector('.compileView').style.color = styles.colors.red
      }
      // display warning error if any
      var error = false
      if (data['error']) {
        error = true
        self._opts.renderer.error(data['error'].formattedMessage, errorContainer, {type: data['error'].severity})
      }
      if (data['errors']) {
        if (data['errors'].length) error = true
        data['errors'].forEach(function (err) {
          self._opts.renderer.error(err.formattedMessage, errorContainer, {type: err.severity})
        })
      }
      if (!error) {
        if (data.contracts) {
          self._opts.compiler.visitContracts((contract) => {
            self._opts.renderer.error(contract.name, errorContainer, {type: 'success'})
          })
        }
      }
    })
    self._events.staticAnalysis.register('staticAnaysisWarning', (count) => {
      if (count) {
        self._opts.renderer.error(`Static Analysis raised ${count} warning(s) that requires your attention.`, errorContainer, {
          type: 'warning',
          click: () => self._api.switchTab('staticanalysisView')
        })
      }
    })

    // Containers
    self._view.warnCompilationSlow = yo`<i title="Copy Address" style="display:none" class="${css.warnCompilationSlow} fa fa-exclamation-triangle" aria-hidden="true"></i>`
    self._view.compileIcon = yo`<i class="fa fa-refresh ${css.icon}" aria-hidden="true"></i>`
    self._view.compileButton = yo`<div class="${css.compileButton} onclick=${compile} "id="compile" title="Compile source code">${self._view.compileIcon} Start to compile</div>`
    self._view.autoCompile = yo`<input class="${css.autocompile}" onchange=${updateAutoCompile} id="autoCompile" type="checkbox" title="Auto compile">`
    if (self.data.autoCompile) self._view.autoCompile.setAttribute('checked', '')
    var compileContainer = yo`
      <div class="${css.compileContainer}">
        <div class="${css.compileButtons}">
          ${self._view.compileButton}
          <div class="${css.autocompileContainer}">
            ${self._view.autoCompile}
            <span class="${css.autocompileText}">Auto compile</span>
          </div>
          ${self._view.warnCompilationSlow}
        </div>
      </div>`
    var errorContainer = yo`<div class='error'></div>`
    var contractNames = yo`<select class="${css.contractNames}" disabled></select>`
    var contractEl = yo`
      <div class="${css.container}">
        ${contractNames}
        <div class="${css.contractButtons}">
          <div title="Display Contract Details" class="${css.details}" onclick=${details}>Details</div>
          <div title="Publish on Swarm" class="${css.publish}" onclick=${publish}>Publish on Swarm</div>
        </div>
      </div>`
    var el = yo`
      <div class="${css.compileTabView}" id="compileTabView">
        ${compileContainer}
        ${contractEl}
        ${errorContainer}
      </div>`
    function updateAutoCompile (event) { self._opts.config.set('autoCompile', self._view.autoCompile.checked) }
    function compile (event) { self._api.runCompiler() }
    function getContractNames (success, data) {
      contractNames.innerHTML = ''
      if (success) {
        contractNames.removeAttribute('disabled')
        opts.compiler.visitContracts((contract) => {
          self.data.contractsDetails[contract.name] = parseContracts(contract.name, contract.object, opts.compiler.getSource(contract.file))
          var contractName = yo`<option>${contract.name}</option>`
          contractNames.appendChild(contractName)
        })
        self._api.resetDapp(self.data.contractsDetails)
      } else {
        contractNames.setAttribute('disabled', true)
        self._api.resetDapp({})
      }
    }
    function details () {
      var select = contractNames
      if (select.children.length > 0 && select.selectedIndex >= 0) {
        var contractName = select.children[select.selectedIndex].innerHTML
        var contractProperties = self.data.contractsDetails[contractName]
        var log = yo`<div class="${css.detailsJSON}"></div>`
        Object.keys(contractProperties).map(propertyName => {
          var copyDetails = yo`<span class="${css.copyDetails}">
            ${copyToClipboard(() => contractProperties[propertyName])}
          </span>`
          var questionMark = yo`<span class="${css.questionMark}"><i title="${detailsHelpSection()[propertyName]}" class="fa fa-question-circle" aria-hidden="true"></i></span>`
          log.appendChild(yo`
            <div class=${css.log}>
            <div class="${css.key}">${propertyName} ${copyDetails} ${questionMark}</div>
            ${insertValue(contractProperties, propertyName)}
          </div>`)
        })
        modalDialog(contractName, log, {label: ''}, {label: 'Close'})
      }
    }
    function detailsHelpSection () {
      return {
        'Assembly': 'Assembly opcodes describing the contract including corresponding solidity source code',
        'Opcodes': 'Assembly opcodes describing the contract',
        'Runtime Bytecode': 'Bytecode storing the state and being executed during normal contract call',
        'bytecode': 'Bytecode being executed during contract creation',
        'functionHashes': 'List of declared function and their corresponding hash',
        'gasEstimates': 'Gas estimation for each function call',
        'metadata': 'Contains all informations related to the compilation',
        'metadataHash': 'Hash representing all metadata information',
        'abi': 'ABI: describing all the functions (input/output params, scope, ...)',
        'name': 'Name of the compiled contract',
        'swarmLocation': 'Swarm url where all metadata information can be found (contract needs to be published first)',
        'web3Deploy': 'Copy/paste this code to any JavaScript/Web3 console to deploy this contract'
      }
    }
    function insertValue (details, propertyName) {
      var value = yo`<pre class="${css.value}"></pre>`
      var node
      if (propertyName === 'web3Deploy' || propertyName === 'name' || propertyName === 'Assembly') {
        node = yo`<pre>${details[propertyName]}</pre>`
      } else if (propertyName === 'abi' || propertyName === 'metadata') {
        var treeView = new TreeView({
          extractData: function (item, parent, key) {
            var ret = {}
            if (item instanceof Array) {
              ret.children = item.map((item, index) => {
                return {key: index, value: item}
              })
              ret.self = ''
            } else if (item instanceof Object) {
              ret.children = Object.keys(item).map((key) => {
                return {key: key, value: item[key]}
              })
              ret.self = ''
            } else {
              ret.self = item
              ret.children = []
            }
            return ret
          }
        })
        if (details[propertyName] !== '') {
          try {
            node = yo`<div>${treeView.render(typeof details[propertyName] === 'object' ? details[propertyName] : JSON.parse(details[propertyName]))}</div>` // catch in case the parsing fails.
          } catch (e) {
            node = yo`<div>Unable to display "${propertyName}": ${e.message}</div>`
          }
        } else {
          node = yo`<div> - </div>`
        }
      } else {
        node = yo`<div>${JSON.stringify(details[propertyName], null, 4)}</div>`
      }
      if (node) value.appendChild(node)
      return value
    }
    function publish () {
      var selectContractNames = document.querySelector(`.${css.contractNames.classNames[0]}`)
      if (selectContractNames.children.length > 0 && selectContractNames.selectedIndex >= 0) {
        var contract = self.data.contractsDetails[selectContractNames.children[selectContractNames.selectedIndex].innerHTML]
        if (contract.metadata === undefined || contract.metadata.length === 0) {
          modalDialogCustom.alert('This contract does not implement all functions and thus cannot be published.')
        } else {
          publishOnSwarm(contract, self._api, function (err) {
            if (err) {
              try {
                err = JSON.stringify(err)
              } catch (e) {}
              modalDialogCustom.alert(yo`<span>Failed to publish metadata file to swarm, please check the Swarm gateways is available ( swarm-gateways.net ).<br />
              ${err}</span>`)
            } else {
              modalDialogCustom.alert(yo`<span>Metadata published successfully.<br />The Swarm address of the metadata file is available in the contract details.</span>`)
            }
          }, function (item) {
            // triggered each time there's a new verified publish (means hash correspond)
            self._api.fileProvider('swarm').addReadOnly(item.hash, item.content)
          })
        }
      }
    }
    return { render () { return el } }
  }
}

const css = csjs`
  .compileTabView {
    padding: 2%;
  }
  .contract {
    display: block;
    margin: 3% 0;
  }
  .compileContainer  {
    ${styles.rightPanel.compileTab.box_CompileContainer};
    margin-bottom: 2%;
  }
  .autocompileContainer {
    width: 90px;
    display: flex;
    align-items: center;
  }
  .autocompile {}
  .autocompileTitle {
    font-weight: bold;
    margin: 1% 0;
  }
  .autocompileText {
    margin: 1% 0;
    font-size: 12px;
    overflow: hidden;
    word-break: normal;
    line-height: initial;
  }
  .warnCompilationSlow {
    color: ${styles.rightPanel.compileTab.icon_WarnCompilation_Color};
    margin-left: 1%;
  }
  .compileButtons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .name {
    display: flex;
  }
  .size {
    display: flex;
  }
  .compileButton {
    ${styles.rightPanel.compileTab.button_Compile};
    width: 120px;
    min-width: 110px;
    margin-right: 1%;
    font-size: 12px;
  }
  .container {
    ${styles.rightPanel.compileTab.box_CompileContainer};
    margin: 0;
    display: flex;
    align-items: center;
  }
  .contractNames {
    ${styles.rightPanel.compileTab.dropdown_CompileContract};
    margin-right: 5%;
  }
  .contractButtons {
    display: flex;
    cursor: pointer;
    justify-content: center;
    text-align: center;
  }
  .details {
    ${styles.rightPanel.compileTab.button_Details};
  }
  .publish {
    ${styles.rightPanel.compileTab.button_Publish};
    margin-left: 2%;
    width: 120px;
  }
  .log {
    ${styles.rightPanel.compileTab.box_CompileContainer};
    display: flex;
    flex-direction: column;
    margin-bottom: 5%;
    overflow: visible;
  }
  .key {
    margin-right: 5px;
    color: ${styles.rightPanel.text_Primary};
    text-transform: uppercase;
    width: 100%;
  }
  .value {
    display: flex;
    width: 100%;
    margin-top: 1.5%;
  }
  .questionMark {
    margin-left: 2%;
    cursor: pointer;
    color: ${styles.rightPanel.icon_Color_TogglePanel};
  }
  .questionMark:hover {
    color: ${styles.rightPanel.icon_HoverColor_TogglePanel};
  }
  .detailsJSON {
    padding: 8px 0;
    background-color: ${styles.rightPanel.modalDialog_BackgroundColor_Primary};
    border: none;
    color: ${styles.rightPanel.modalDialog_text_Secondary};
  }
  .icon {
    margin-right: 3%;
  }
  .spinningIcon {
    margin-right: .3em;
    animation: spin 2s linear infinite;
  }
  .bouncingIcon {
    margin-right: .3em;
    animation: bounce 2s infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @-webkit-keyframes bounce {
    0% {
      margin-bottom: 0;
      color: ${styles.colors.transparent};
    }
    70% {
      margin-bottom: 0;
      color: ${styles.rightPanel.text_Secondary};
    }
    100% {
      margin-bottom: 0;
      color: ${styles.colors.transparent};
    }
  }
`
