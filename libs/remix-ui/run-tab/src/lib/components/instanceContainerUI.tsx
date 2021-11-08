// eslint-disable-next-line no-use-before-define
import React from 'react'
import { InstanceContainerProps } from '../types'

export function InstanceContainerUI (props: InstanceContainerProps) {
  const clearInstance = () => {
    // this.instanceContainer.innerHTML = '' // clear the instances list
    // this.instanceContainer.appendChild(instanceContainerTitle)
    // this.instanceContainer.appendChild(this.noInstancesText)
  }

  return (
    <div className="udapp_instanceContainer border-0 list-group-item">
      <div className="d-flex justify-content-between align-items-center pl-2 ml-1 mb-2"
        title="Autogenerated generic user interfaces for interaction with deployed contracts">
        Deployed Contracts
        <i className="mr-2 udapp_icon far fa-trash-alt" data-id="deployAndRunClearInstances" onClick={clearInstance}
          title="Clear instances list and reset recorder" aria-hidden="true">
        </i>
      </div>
      <span className="mx-2 mt-3 alert alert-warning" data-id="deployAndRunNoInstanceText" role="alert">
        Currently you have no contract instances to interact with.
      </span>
    </div>
  )
}
