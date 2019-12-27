const remixLib = require('remix-lib')
const txFormat = remixLib.execution.txFormat
const txExecution = remixLib.execution.txExecution
const typeConversion = remixLib.execution.typeConversion
const EventManager = remixLib.EventManager
const Web3 = require('web3')

class Blockchain {

  constructor (executionContext, udapp) {
    this.event = new EventManager()
    this.executionContext = executionContext
    this.udapp = udapp
    this.setupEvents()
  }

  setupEvents () {
    this.executionContext.event.register('contextChanged', () => {
      this.event.trigger('contextChanged', [])
    })

    this.udapp.event.register('initiatingTransaction', (timestamp, tx, payLoad) => {
      this.event.trigger('initiatingTransaction', [timestamp, tx, payLoad])
    })

    this.udapp.event.register('transactionExecuted', (error, from, to, data, call, txResult, timestamp) => {
      this.event.trigger('transactionExecuted', [error, from, to, data, call, txResult, timestamp])
    })
  }

  async deployContract (selectedContract, args, contractMetadata, compilerContracts, callbacks, confirmationCb) {
    const { continueCb, promptCb, statusCb, finalCb } = callbacks

    var constructor = selectedContract.getConstructorInterface()
    if (!contractMetadata || (contractMetadata && contractMetadata.autoDeployLib)) {
      return txFormat.buildData(selectedContract.name, selectedContract.object, compilerContracts, true, constructor, args, (error, data) => {
        if (error) return statusCb(`creation of ${selectedContract.name} errored: ` + error)

        statusCb(`creation of ${selectedContract.name} pending...`)
        this.createContract(selectedContract, data, continueCb, promptCb, confirmationCb, finalCb)
      }, statusCb, (data, runTxCallback) => {
                // called for libraries deployment
        this.runTransaction(data, continueCb, promptCb, confirmationCb, runTxCallback)
      })
    }
    if (Object.keys(selectedContract.bytecodeLinkReferences).length) statusCb(`linking ${JSON.stringify(selectedContract.bytecodeLinkReferences, null, '\t')} using ${JSON.stringify(contractMetadata.linkReferences, null, '\t')}`)
    txFormat.encodeConstructorCallAndLinkLibraries(selectedContract.object, args, constructor, contractMetadata.linkReferences, selectedContract.bytecodeLinkReferences, (error, data) => {
      if (error) return statusCb(`creation of ${selectedContract.name} errored: ` + error)

      statusCb(`creation of ${selectedContract.name} pending...`)
      this.createContract(selectedContract, data, continueCb, promptCb, confirmationCb, finalCb)
    })
  }

  runTransaction (data, continueCb, promptCb, confirmationCb, finalCb) {
    this.udapp.runTx(data, confirmationCb, continueCb, promptCb, finalCb)
  }

  createContract (selectedContract, data, continueCb, promptCb, confirmationCb, finalCb) {
    if (data) {
      data.contractName = selectedContract.name
      data.linkReferences = selectedContract.bytecodeLinkReferences
      data.contractABI = selectedContract.abi
    }

    this.udapp.createContract(data, confirmationCb, continueCb, promptCb,
            (error, txResult) => {
              if (error) {
                return finalCb(`creation of ${selectedContract.name} errored: ${error}`)
              }
              var isVM = this.executionContext.isVM()
              if (isVM) {
                var vmError = txExecution.checkVMError(txResult)
                if (vmError.error) {
                  return finalCb(vmError.message)
                }
              }
              if (txResult.result.status && txResult.result.status === '0x0') {
                return finalCb(`creation of ${selectedContract.name} errored: transaction execution failed`)
              }
              var address = isVM ? txResult.result.createdAddress : txResult.result.contractAddress
              finalCb(null, selectedContract, address)
            }
        )
  }

  determineGasPrice (cb) {
    this.getGasPrice((error, gasPrice) => {
      var warnMessage = ' Please fix this issue before sending any transaction. '
      if (error) {
        return cb('Unable to retrieve the current network gas price.' + warnMessage + error)
      }
      try {
        var gasPriceValue = this.fromWei(gasPrice, false, 'gwei')
        cb(null, gasPriceValue)
      } catch (e) {
        cb(warnMessage + e.message, null, false)
      }
    })
  }

  getGasPrice (cb) {
    return this.executionContext.web3().eth.getGasPrice(cb)
  }

  fromWei (value, doTypeConversion, unit) {
    if (doTypeConversion) {
      return Web3.utils.fromWei(typeConversion.toInt(value), unit || 'ether')
    }
    return Web3.utils.fromWei(value.toString(10), unit || 'ether')
  }

  toWei (value, unit) {
    return Web3.utils.toWei(value, unit || 'gwei')
  }

  calculateFee (gas, gasPrice, unit) {
    return Web3.utils.toBN(gas).mul(Web3.utils.toBN(Web3.utils.toWei(gasPrice.toString(10), unit || 'gwei')))
  }

  determineGasFees (tx) {
    const determineGasFeesCb = (gasPrice, cb) => {
      let txFeeText, priceStatus
      // TODO: this try catch feels like an anti pattern, can/should be
      // removed, but for now keeping the original logic
      try {
        var fee = this.calculateFee(tx.gas, gasPrice)
        txFeeText = ' ' + this.fromWei(fee, false, 'ether') + ' Ether'
        priceStatus = true
      } catch (e) {
        txFeeText = ' Please fix this issue before sending any transaction. ' + e.message
        priceStatus = false
      }
      cb(txFeeText, priceStatus)
    }

    return determineGasFeesCb
  }

  getAddressFromTransactionResult (txResult) {
    return this.executionContext.isVM() ? txResult.result.createdAddress : txResult.result.contractAddress
  }

  getAccounts (cb) {
    return this.udapp.getAccounts(cb)
  }

}

module.exports = Blockchain
