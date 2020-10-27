import React from 'react'
import DropdownPanel from './dropdown-panel'

export const CalldataPanel = ({ calldata }) => {
    return (
        <div id='calldatapanel'>
            <DropdownPanel dropdownName='Call Data' opts={{ json: true }} calldata={calldata} />
        </div>
    )
}

export default CalldataPanel