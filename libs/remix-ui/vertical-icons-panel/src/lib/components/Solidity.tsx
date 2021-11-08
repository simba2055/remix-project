import { VerticalIcons } from 'libs/remix-ui/vertical-icons-panel/types/vertical-icons-panel'
// eslint-disable-next-line no-use-before-define
import React, { Fragment, useEffect, useReducer } from 'react'
import { iconBadgeReducer, IconBadgeReducerAction } from '../reducers/iconBadgeReducer'
import Badge from './Badge'
import Icon, { IconStatus } from './Icon'

interface SolidityProps {
  verticalIconsPlugin: VerticalIcons
  itemContextAction: (e: any, name: string, documentation: string) => Promise<void>
  addActive: (name: string) => void
  removeActive: () => void
}
const initialState = {
  text: '',
  key: '',
  title: '',
  type: ''
}

function Solidity ({ verticalIconsPlugin, itemContextAction, addActive, removeActive }: SolidityProps) {
  const [badgeStatus, dispatchStatusUpdate] = useReducer(iconBadgeReducer, initialState)

  useEffect(() => {
    verticalIconsPlugin.on('solidity', 'statusChanged', (iconStatus: IconStatus) => {
      const action: IconBadgeReducerAction = { type: 'solidity', payload: { status: iconStatus, verticalIconPlugin: verticalIconsPlugin } }
      dispatchStatusUpdate(action)
    })
    console.log('solidity icon useEffect handled no issues')
  }, [])
  return (
    <Fragment>
      {verticalIconsPlugin.targetProfileForChange &&
      Object.keys(verticalIconsPlugin.targetProfileForChange).length
        ? Object.keys(verticalIconsPlugin.targetProfileForChange)
          .filter(p => p === 'solidity')
          .map(p => (
            <div id="compileIcons" key={
              verticalIconsPlugin.targetProfileForChange[p].displayName
            }>
              <Icon
                profile={verticalIconsPlugin.targetProfileForChange[p]}
                verticalIconPlugin={verticalIconsPlugin}
                contextMenuAction={itemContextAction}
                addActive={addActive}
                removeActive={removeActive}
                key={
                  verticalIconsPlugin.targetProfileForChange[p].displayName
                }
              />
              {
                badgeStatus && verticalIconsPlugin.keys.includes(badgeStatus.key) &&
                  verticalIconsPlugin.types.includes(badgeStatus.type) ? (
                    <Badge
                      badgeStatus={badgeStatus}
                    />
                  ) : null
              }
            </div>
          ))
        : null}
    </Fragment>
  )
}

export default Solidity
