'use strict'
import { NightwatchBrowser } from 'nightwatch'
import init from '../helpers/init'
import sauce from './sauce'

module.exports = {
  '@disabled': true,
  before: function (browser: NightwatchBrowser, done: VoidFunction) {
    init(browser, done, 'http://127.0.0.1:8080?activate=solidity,udapp&call=fileManager//open//contracts/3_Ballot.sol&deactivate=home', false)
  },

  CheckSolidityActivatedAndUDapp: function (browser: NightwatchBrowser) {
    browser
      .waitForElementVisible('#icon-panel', 10000)
      .clickLaunchIcon('solidity')
      .clickLaunchIcon('udapp')
  },

  'Editor should be focused on the 3_Ballot.sol #group1': function (browser: NightwatchBrowser) {
    browser
      .pause(5000)
      .refresh()
      .waitForElementVisible('#editorView', 30000)
      .getEditorValue((content) => {
        browser.assert.ok(content.indexOf('contract Ballot {') !== -1, 'content includes Ballot contract')
      })
  },

  'Home page should be deactivated #group1': function (browser: NightwatchBrowser) {
    browser
      .waitForElementNotPresent('[data-id="landingPageHomeContainer"]')
  },

  // WORKSPACE TEMPLATES E2E START

  'Should create Remix default workspace with files': function (browser: NightwatchBrowser) {
    browser
      .clickLaunchIcon('filePanel')
      .click('*[data-id="workspaceCreate"]')
      .waitForElementVisible('*[data-id="modalDialogCustomPromptTextCreate"]')
      .waitForElementVisible('[data-id="fileSystemModalDialogModalFooter-react"] > span')
      // eslint-disable-next-line dot-notation
      .execute(function () { document.querySelector('*[data-id="modalDialogCustomPromptTextCreate"]')['value'] = 'workspace_remix_default' })
      .waitForElementPresent('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .execute(function () { (document.querySelector('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok') as HTMLElement).click() })
      .pause(1000)
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemcontracts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemcontracts/1_Storage.sol"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemcontracts/2_Owner.sol"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemcontracts/3_Ballot.sol"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts/deploy_with_web3.ts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts/deploy_with_ethers.ts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts/web3.ts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts/ethers.ts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemtests"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemtests/storage.test.js"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemtests/Ballot_test.sol"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemREADME.txt"]')
  },

  'Should create blank workspace with no files': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="workspaceCreate"]')
      .waitForElementVisible('*[data-id="modalDialogCustomPromptTextCreate"]')
      .waitForElementVisible('[data-id="fileSystemModalDialogModalFooter-react"] > span')
      // eslint-disable-next-line dot-notation
      .execute(function () { document.querySelector('*[data-id="modalDialogCustomPromptTextCreate"]')['value'] = 'workspace_blank' })
      .click('select[id="wstemplate"]')
      .click('select[id="wstemplate"] option[value=blank]')
      .waitForElementPresent('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .execute(function () { (document.querySelector('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok') as HTMLElement).click() })
      .pause(1000)
      .assert.elementPresent('*[data-id="treeViewUltreeViewMenu"]')
      .execute(function () {
        const fileList = document.querySelector('*[data-id="treeViewUltreeViewMenu"]')
        return fileList.getElementsByTagName('li').length;
      }, [], function(result){
          // check there are no files in FE
          browser.assert.equal(result.value, 0, 'Incorrect number of files');
      });
  },

  'Should create ERC20 workspace with files': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="workspaceCreate"]')
      .waitForElementVisible('*[data-id="modalDialogCustomPromptTextCreate"]')
      .waitForElementVisible('[data-id="fileSystemModalDialogModalFooter-react"] > span')
      // eslint-disable-next-line dot-notation
      .execute(function () { document.querySelector('*[data-id="modalDialogCustomPromptTextCreate"]')['value'] = 'workspace_erc20' })
      .click('select[id="wstemplate"]')
      .click('select[id="wstemplate"] option[value=erc20]')
      .waitForElementPresent('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .execute(function () { (document.querySelector('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok') as HTMLElement).click() })
      .pause(1000)
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemcontracts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemcontracts/SampleERC20.sol"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts/deploy_with_web3.ts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts/deploy_with_ethers.ts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts/web3.ts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemscripts/ethers.ts"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemtests"]')
      .assert.elementPresent('*[data-id="treeViewLitreeViewItemtests/SampleERC20_test.sol"]')
  },

  // WORKSPACE TEMPLATES E2E END

  'Should create two workspace and switch to the first one': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="workspaceCreate"]') // create workspace_name
      .waitForElementVisible('*[data-id="modalDialogCustomPromptTextCreate"]')
      .waitForElementVisible('[data-id="fileSystemModalDialogModalFooter-react"] > span')
      .click('*[data-id="modalDialogCustomPromptTextCreate"]')
      .clearValue('*[data-id="modalDialogCustomPromptTextCreate"]')
      .setValue('*[data-id="modalDialogCustomPromptTextCreate"]', 'workspace_name')
      .waitForElementPresent('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .click('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .waitForElementVisible('*[data-id="treeViewLitreeViewItemtests"]')
      .pause(1000)
      .addFile('test.sol', { content: 'test' })
      .waitForElementVisible('*[data-id="treeViewLitreeViewItemtest.sol"]')
      .click('*[data-id="workspaceCreate"]') // create workspace_name_1
      .waitForElementVisible('*[data-id="modalDialogCustomPromptTextCreate"]')
      .waitForElementVisible('[data-id="fileSystemModalDialogModalFooter-react"] > span')
      .click('*[data-id="modalDialogCustomPromptTextCreate"]')
      .clearValue('*[data-id="modalDialogCustomPromptTextCreate"]')
      .setValue('*[data-id="modalDialogCustomPromptTextCreate"]', 'workspace_name_1')
      .waitForElementPresent('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .click('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')     
      .waitForElementVisible('*[data-id="treeViewLitreeViewItemtests"]')
      .pause(2000)
      .waitForElementNotPresent('*[data-id="treeViewLitreeViewItemtest.sol"]')
      .pause(2000)
      .click('*[data-id="workspacesSelect"] option[value="workspace_name"]')
      .waitForElementVisible('*[data-id="treeViewLitreeViewItemtests"]')
  },

  'Should rename a workspace #group1': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="workspaceRename"]') // rename workspace_name
      .waitForElementVisible('*[data-id="treeViewLitreeViewItemtests"]')
      .waitForElementVisible('*[data-id="modalDialogCustomPromptTextRename"]')
      .click('*[data-id="modalDialogCustomPromptTextRename"]')
      .clearValue('*[data-id="modalDialogCustomPromptTextRename"]')
      .setValue('*[data-id="modalDialogCustomPromptTextRename"]', 'workspace_name_renamed')
      .waitForElementPresent('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .click('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .waitForElementPresent('*[data-id="workspacesSelect"] option[value="workspace_name_1"]')
      .click('*[data-id="workspacesSelect"] option[value="workspace_name_1"]')
      .pause(2000)
      .waitForElementNotPresent('*[data-id="treeViewLitreeViewItemtest.sol"]')
      .waitForElementPresent('*[data-id="workspacesSelect"] option[value="workspace_name_renamed"]')
      .click('*[data-id="workspacesSelect"] option[value="workspace_name_renamed"]')
      .pause(2000)
      .waitForElementVisible('*[data-id="treeViewLitreeViewItemtest.sol"]')
  },

  'Should delete a workspace #group1': function (browser: NightwatchBrowser) {
    browser
      .click('*[data-id="workspacesSelect"] option[value="workspace_name_1"]')
      .click('*[data-id="workspaceDelete"]') // delete workspace_name_1
      .waitForElementVisible('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .click('[data-id="fileSystemModalDialogModalFooter-react"] .modal-ok')
      .waitForElementNotPresent('*[data-id="workspacesSelect"] option[value="workspace_name_1"]')
      .end()
  },

  tearDown: sauce
}
