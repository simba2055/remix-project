import React, { useRef, useEffect } from 'react' // eslint-disable-line
import { action, FileExplorerContextMenuProps } from './types'

import './css/file-explorer-context-menu.css'

export const FileExplorerContextMenu = (props: FileExplorerContextMenuProps) => {
  const { actions, createNewFile, createNewFolder, deletePath, renamePath, hideContextMenu, pushChangesToGist, publishFileToGist, publishFolderToGist, copy, paste, runScript, emit, pageX, pageY, path, type, focus, ...otherProps } = props
  const contextMenuRef = useRef(null)
  useEffect(() => {
    contextMenuRef.current.focus()
  }, [])

  useEffect(() => {
    const menuItemsContainer = contextMenuRef.current
    const boundary = menuItemsContainer.getBoundingClientRect()

    if (boundary.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
      menuItemsContainer.style.position = 'fixed'
      menuItemsContainer.style.bottom = '10px'
      menuItemsContainer.style.top = null
    }
  }, [pageX, pageY])

  const filterItem = (item: action) => {
    /**
     * if there are multiple elements focused we need to take this and all conditions must be met plus the action must be set to 'multi'
     * for example : 'downloadAsZip' with type ['file','folder','multi'] will work on files and folders when multiple are selected
    **/
    const nonRootFocus = focus.filter((el) => { return !(el.key === '' && el.type === 'folder') })
    if (nonRootFocus.length > 1) {
      for (const element of nonRootFocus) {
        if (!itemMatchesCondition(item, element.type, element.key)) return false
      }
      return (item.type.includes('multi'))
    } else {
      return itemMatchesCondition(item, type, path)
    }
  }

  const itemMatchesCondition = (item: action, itemType: string, itemPath: string) => {
    if (item.type && Array.isArray(item.type) && (item.type.findIndex(name => name === itemType) !== -1)) return true
    else if (item.path && Array.isArray(item.path) && (item.path.findIndex(key => key === itemPath) !== -1)) return true
    else if (item.extension && Array.isArray(item.extension) && (item.extension.findIndex(ext => itemPath.endsWith(ext)) !== -1)) return true
    else if (item.pattern && Array.isArray(item.pattern) && (item.pattern.filter(value => itemPath.match(new RegExp(value))).length > 0)) return true
    else return false
  }

  const getPath = () => {
    const nonRootFocus = focus.filter((el) => { return !(el.key === '' && el.type === 'folder') })
    if (nonRootFocus.length > 1) {
      return nonRootFocus.map((element) => { return element.key })
    } else {
      return path
    }
  }

  const menu = () => {
    return actions.filter(item => {
      return filterItem(item)
    }).map((item, index) => {
      return <li
        id={`menuitem${item.name.toLowerCase()}`}
        key={index}
        className='remixui_liitem'
        onClick={(e) => {
          e.stopPropagation()
          switch (item.name) {
            case 'New File':
              createNewFile(path)
              break
            case 'New Folder':
              createNewFolder(path)
              break
            case 'Rename':
              renamePath(path, type)
              break
            case 'Delete':
              deletePath(getPath())
              break
            case 'Push changes to gist':
              pushChangesToGist(path, type)
              break
            case 'Publish folder to gist':
              publishFolderToGist(path, type)
              break
            case 'Publish file to gist':
              publishFileToGist(path, type)
              break
            case 'Run':
              runScript(path)
              break
            case 'Copy':
              copy(path, type)
              break
            case 'Paste':
              paste(path, type)
              break
            default:
              emit && emit(item.id, getPath())
              break
          }
          hideContextMenu()
        }}>{item.name}</li>
    })
  }

  return (
    <div
      id="menuItemsContainer"
      className="p-1 remixui_contextContainer bg-light shadow border"
      style={{ left: pageX, top: pageY }}
      ref={contextMenuRef}
      onBlur={hideContextMenu}
      tabIndex={500}
      {...otherProps}
    >
      <ul id='remixui_menuitems'>{menu()}</ul>
    </div>
  )
}

export default FileExplorerContextMenu
