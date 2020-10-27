import React, { useState, useEffect } from 'react'
import CalldataPanel from './calldata-panel'
import MemoryPanel from './memory-panel'
import CallstackPanel from './callstack-panel'
import StackPanel from './stack-panel'
import StoragePanel from './storage-panel'
import ReturnValuesPanel from './dropdown-panel'
import FullStoragesChangesPanel from './full-storages-changes'

export const VmDebugger = ({ vmDebugger: { registerEvent } }) => {
  const [calldataPanel, setCalldataPanel] = useState(null)
  const [memoryPanel, setMemoryPanel] = useState(null)
  const [callStackPanel, setCallStackPanel] = useState(null)
  const [stackPanel, setStackPanel] = useState(null)
  const [storagePanel, setStoragePanel] = useState({
    calldata: null,
    header: null
  })
  const [returnValuesPanel, setReturnValuesPanel] = useState(null)
  const [fullStoragesChangesPanel, setFullStoragesChangesPanel] = useState(null)

  useEffect(() => {
    registerEvent && registerEvent('traceManagerCallDataUpdate', (calldata) => {
      setCalldataPanel(() => calldata)
    })
    registerEvent && registerEvent('traceManagerMemoryUpdate', (calldata) => {
      setMemoryPanel(() => calldata)
    })
    registerEvent && registerEvent('traceManagerCallStackUpdate', (calldata) => {
      setCallStackPanel(() => calldata)
    })
    registerEvent && registerEvent('traceManagerStackUpdate', (calldata) => {
      setStackPanel(() => calldata)
    })
    registerEvent && registerEvent('traceManagerStorageUpdate', (calldata, header) => {
      setStoragePanel(() => {
        return { calldata, header }
      })
    })
    registerEvent && registerEvent('traceReturnValueUpdate', (calldata) => {
      setReturnValuesPanel(() => calldata)
    })
    registerEvent && registerEvent('traceAddressesUpdate', (calldata) => {
      setFullStoragesChangesPanel(() => {
        return {}
      })
    })
    registerEvent && registerEvent('traceStorageUpdate', (calldata) => {
      setFullStoragesChangesPanel(() => calldata)
    })
  }, [registerEvent])

  return (
    <div id="vmdebugger" className="px-2">
      <div>
        <StackPanel calldata={stackPanel} />
        <MemoryPanel calldata={memoryPanel} />
        <StoragePanel calldata={storagePanel.calldata} header={storagePanel.header} />
        <CallstackPanel calldata={callStackPanel} />
        <CalldataPanel calldata={calldataPanel} />
        <ReturnValuesPanel dropdownName="Return Value" calldata={returnValuesPanel || {}} />
        <FullStoragesChangesPanel calldata={fullStoragesChangesPanel} />
      </div>
    </div>
  )
}

export default VmDebugger
