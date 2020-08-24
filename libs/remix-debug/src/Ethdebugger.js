'use strict'

const StorageViewer = require('./storage/storageViewer')
const StorageResolver = require('./storage/storageResolver')

const SolidityDecoder = require('./solidity-decoder')
const SolidityProxy = SolidityDecoder.SolidityProxy
const stateDecoder = SolidityDecoder.stateDecoder
const localDecoder = SolidityDecoder.localDecoder
const InternalCallTree = SolidityDecoder.InternalCallTree

const remixLib = require('@remix-project/remix-lib')
const TraceManager = remixLib.trace.TraceManager
const CodeManager = remixLib.code.CodeManager
const traceHelper = remixLib.helpers.trace
const EventManager = remixLib.EventManager

/**
  * Ethdebugger is a wrapper around a few classes that helps debugging a transaction
  *
  * - Web3Providers - define which environment (web3) the transaction will be retrieved from
  * - TraceManager - Load / Analyze the trace and retrieve details of specific test
  * - CodeManager - Retrieve loaded byte code and help to resolve AST item from vmtrace index
  * - SolidityProxy - Basically used to extract state variable from AST
  * - Breakpoint Manager - Used to add / remove / jumpto breakpoint
  * - InternalCallTree - Used to retrieved local variables
  * - StorageResolver - Help resolving the storage accross different steps
  *
  * @param {Map} opts  -  { function compilationResult } //
  */
function Ethdebugger (opts) {
  this.compilationResult = opts.compilationResult || function (contractAddress) { return null }
  this.web3 = opts.web3

  this.event = new EventManager()

  this.tx

  this.traceManager = new TraceManager({web3: this.web3})
  this.codeManager = new CodeManager(this.traceManager)
  this.solidityProxy = new SolidityProxy(this.traceManager, this.codeManager)
  this.storageResolver = null

  this.callTree = new InternalCallTree(this.event, this.traceManager, this.solidityProxy, this.codeManager, { includeLocalVariables: true })
}

Ethdebugger.prototype.setManagers = function () {
  this.traceManager = new TraceManager({web3: this.web3})
  this.codeManager = new CodeManager(this.traceManager)
  this.solidityProxy = new SolidityProxy(this.traceManager, this.codeManager)
  this.storageResolver = null

  this.callTree = new InternalCallTree(this.event, this.traceManager, this.solidityProxy, this.codeManager, { includeLocalVariables: true })
}

Ethdebugger.prototype.resolveStep = function (index) {
  this.codeManager.resolveStep(index, this.tx)
}

Ethdebugger.prototype.setCompilationResult = function (compilationResult) {
  if (compilationResult && compilationResult.data) {
    this.solidityProxy.reset(compilationResult.data)
  } else {
    this.solidityProxy.reset({})
  }
}

Ethdebugger.prototype.sourceLocationFromVMTraceIndex = function (address, stepIndex, callback) {
  this.callTree.sourceLocationTracker.getSourceLocationFromVMTraceIndex(address, stepIndex, this.solidityProxy.contracts).then((rawLocation) => {
    callback(null, rawLocation)
  }).catch(callback)
}

Ethdebugger.prototype.sourceLocationFromInstructionIndex = function (address, instIndex, callback) {
  this.callTree.sourceLocationTracker.getSourceLocationFromInstructionIndex(address, instIndex, this.solidityProxy.contracts).then((rawLocation) => {
    callback(null, rawLocation)
  }).catch(callback)
}

/* breakpoint */
Ethdebugger.prototype.setBreakpointManager = function (breakpointManager) {
  this.breakpointManager = breakpointManager
}

/* decode locals */
Ethdebugger.prototype.extractLocalsAt = function (step, callback) {
  callback(null, this.callTree.findScope(step))
}

Ethdebugger.prototype.decodeLocalsAt = function (step, sourceLocation, callback) {
  const self = this
  this.traceManager.waterfall([
    this.traceManager.getStackAt,
    this.traceManager.getMemoryAt,
    function getCurrentCalledAddressAt (stepIndex, next) {
      try {
        const address = self.traceManager.getCurrentCalledAddressAt(stepIndex)
        next(null, address)
      } catch (error) {
        next(error)
      }
    }],
    step,
    (error, result) => {
      if (!error) {
        const stack = result[0].value
        const memory = result[1].value
        try {
          const storageViewer = new StorageViewer({
            stepIndex: step,
            tx: this.tx,
            address: result[2].value
          }, this.storageResolver, this.traceManager)
          localDecoder.solidityLocals(step, this.callTree, stack, memory, storageViewer, sourceLocation).then((locals) => {
            if (!locals.error) {
              callback(null, locals)
            } else {
              callback(locals.error)
            }
          })
        } catch (e) {
          callback(e.message)
        }
      } else {
        callback(error)
      }
    })
}

/* decode state */
Ethdebugger.prototype.extractStateAt = function (step, callback) {
  this.solidityProxy.extractStateVariablesAt(step).then((stateVars) => {
    callback(null, stateVars)
  }).catch(callback)
}

Ethdebugger.prototype.decodeStateAt = function (step, stateVars, callback) {
  try {
    const address = this.traceManager.getCurrentCalledAddressAt(step)
    const storageViewer = new StorageViewer({
      stepIndex: step,
      tx: this.tx,
      address: address
    }, this.storageResolver, this.traceManager)
    stateDecoder.decodeState(stateVars, storageViewer).then((result) => {
      if (!result.error) {
        callback(null, result)
      } else {
        callback(result.error)
      }
    })
  } catch (error) {
    callback(error)
  }
}

Ethdebugger.prototype.storageViewAt = function (step, address) {
  return new StorageViewer({
    stepIndex: step,
    tx: this.tx,
    address: address
  }, this.storageResolver, this.traceManager)
}

Ethdebugger.prototype.updateWeb3 = function (web3) {
  this.web3 = web3
  this.setManagers()
}

Ethdebugger.prototype.unLoad = function () {
  this.traceManager.init()
  this.codeManager.clear()
  this.event.trigger('traceUnloaded')
}

Ethdebugger.prototype.debug = function (tx) {
  if (this.traceManager.isLoading) {
    return
  }
  if (!tx.to) {
    tx.to = traceHelper.contractCreationToken('0')
  }
  this.tx = tx
  this.traceManager.resolveTrace(tx, async (error, result) => {
    if (result) {
      this.setCompilationResult(await this.compilationResult(tx.to))
      this.event.trigger('newTraceLoaded', [this.traceManager.trace])
      if (this.breakpointManager && this.breakpointManager.hasBreakpoint()) {
        this.breakpointManager.jumpNextBreakpoint(false)
      }
      this.storageResolver = new StorageResolver({web3: this.traceManager.web3})
    } else {
      this.statusMessage = error ? error.message : 'Trace not loaded'
    }
  })
}

module.exports = Ethdebugger
