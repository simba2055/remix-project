/* eslint-disable @typescript-eslint/no-unused-vars */
import { Profile } from '@remixproject/plugin-utils'
import React, { useState } from 'react'
import { RemixUiPluginManagerProps } from '../types'
import ActivePluginCardContainer from './components/ActivePluginCardContainer'
import InactivePluginCardContainer from './components/InactivePluginCardContainer'
import RootView from './components/rootView'
import './remix-ui-plugin-manager.css'

export const RemixUiPluginManager = ({ pluginComponent, pluginManagerSettings }: RemixUiPluginManagerProps) => {
  const [activeProfiles, setActiveProfiles] = useState<Profile[]>(pluginComponent.activePlugins)
  const [inactiveProfiles, setinactiveProfiles] = useState<Profile[]>(pluginComponent.inactivePlugins)
  // console.log('This is the state of pluginSettings at the root of the components', pluginComponent.pluginSettings)
  return (
    <RootView pluginComponent={pluginComponent} pluginManagerSettings={pluginManagerSettings}>
      <section data-id="pluginManagerComponentPluginManagerSection">
        <ActivePluginCardContainer
          pluginComponent={pluginComponent}
          setActiveProfiles={setActiveProfiles}
          activeProfiles={activeProfiles}
        />
        <InactivePluginCardContainer
          pluginComponent={pluginComponent}
          setInactiveProfiles={setinactiveProfiles}
          inactiveProfiles={inactiveProfiles}
        />
      </section>
    </RootView>
  )
}
