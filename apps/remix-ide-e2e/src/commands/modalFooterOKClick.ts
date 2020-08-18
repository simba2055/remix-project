import { NightwatchBrowser } from "nightwatch"

const EventEmitter = require('events')

export class ModalFooterOKClick extends EventEmitter {
  command (this: NightwatchBrowser): NightwatchBrowser {
    this.api.waitForElementVisible('#modal-footer-ok').perform((client, done) => {
      this.api.execute(function () {
        const elem = document.querySelector('#modal-footer-ok') as HTMLElement

        elem.click()
      }, [], (result) => {
        done()
        this.emit('complete')
      })
    })
    return this
  }
}
