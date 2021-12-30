import AppContext from 'libs/remix-ui/app/src/lib/remix-app/context/context'
import React, { useContext, useEffect, useRef, useState } from 'react' // eslint-disable-line
import RemixUIPanelPlugin from '../plugins/panel-plugin'
import { PluginRecord } from '../types'
import './main-panel.css'

const RemixUIMainPanel = () => {
  const appContext = useContext(AppContext)
  const [plugins, setPlugins] = useState<PluginRecord[]>([])
  const editorRef = useRef<HTMLDivElement>(null)
  const mainPanelRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  const refs = [tabsRef, editorRef, mainPanelRef, terminalRef]

  const _adjustLayout = (delta: number) => {
    const limitDown = 32
    const containerHeight = window.innerHeight
    const tmp = delta - limitDown
    delta = tmp > 0 ? tmp : 0
    let mainPanelHeight = containerHeight - delta
    mainPanelHeight = mainPanelHeight < 0 ? 0 : mainPanelHeight
    //self.editor.resize((document.querySelector('#editorWrap') || {}).checked)
    editorRef.current?.setAttribute('style', `height: ${mainPanelHeight}px`)
    terminalRef.current?.setAttribute('style', `height: ${delta}px`)
    mainPanelRef.current?.setAttribute('style', `height: ${mainPanelHeight}px`)
    // appContext.panels.editor.resize((document.querySelector('#editorWrap') || {}).checked)
    appContext.layout.panels.terminal.plugin.scroll2bottom()
  }

  const renderPanels = () => {
    //console.log(appContext)
    if (appContext) {
      console.log(appContext)
      const pluginPanels: PluginRecord[] = []
      Object.values(appContext.layout.panels).map((panel: any) => {
        pluginPanels.push({
          profile: panel.plugin.profile,
          active: panel.active,
          view: panel.plugin.profile.name === 'tabs' ? panel.plugin.renderTabsbar(): panel.plugin.render(),
          class: panel.plugin.profile.name
        })
      })
      // console.log(pluginPanels)
      setPlugins(pluginPanels)

      appContext.layout.panels.terminal.plugin.event.register('resize', (delta: number) =>
        _adjustLayout(delta)
      )
    }
  }

  useEffect(() => {
    renderPanels()
    console.log(appContext.layout)
    appContext.layout.event.on('change',() => {
      console.log('change')
      renderPanels()
    })
  }, [])

  return (
    <div className="mainview">
      {Object.values(plugins).map((pluginRecord, i) => {
        return (
          <RemixUIPanelPlugin
            ref={refs[i]}
            key={pluginRecord.profile.name}
            pluginRecord={pluginRecord}
          />
        )
      })}
    </div>
  )
}

export default RemixUIMainPanel
