import { NightwatchBrowser } from 'nightwatch'
import EventEmitter from 'events'

class ExecuteScript extends EventEmitter {
  command (this: NightwatchBrowser, script: string): NightwatchBrowser {
    this.api
      .clearValue('*[data-id="terminalCliInput"]')
      .click('*[data-id="terminalCli"]')
      .sendKeys('*[data-id="terminalCliInput"]', script)
      .sendKeys('*[data-id="terminalCliInput"]', this.api.Keys.ENTER)
      .sendKeys('*[data-id="terminalCliInput"]', this.api.Keys.ENTER)
      .perform(() => {
        this.emit('complete')
      })
    return this
  }
}

module.exports = ExecuteScript
