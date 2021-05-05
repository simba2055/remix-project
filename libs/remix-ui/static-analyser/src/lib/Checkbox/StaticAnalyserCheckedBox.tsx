import React from 'react' //eslint-disable-line

interface StaticAnalyserCheckBoxProps {
  onClick?: (event) => void
  onChange?: (event) => void
  label?: string
  inputType?: string
  name?: string
  checked?: boolean
  id?: string
  itemName?: string
  categoryId?: string
}

const StaticAnalyserCheckedBox = ({
  id,
  label,
  onClick,
  inputType,
  name,
  checked,
  onChange,
  itemName,
  categoryId
}: StaticAnalyserCheckBoxProps) => {
  return (
    <div className="pt-1 h-80 mx-3 align-items-center listenOnNetwork_2A0YE0 custom-control custom-checkbox " onClick={onClick}>
      <input
        id={id}
        type={inputType}
        onChange={onChange}
        style={{ verticalAlign: 'bottom' }}
        name={name}
        className="custom-control-input"
        checked={checked}
      />
      <label className="pt-1 form-check-label custom-control-label" id={`heading${categoryId}`} >
        {name ? <h6>{itemName}</h6> : ''}
        <p>{label}</p>
      </label>
    </div>
  )
}

export default StaticAnalyserCheckedBox
