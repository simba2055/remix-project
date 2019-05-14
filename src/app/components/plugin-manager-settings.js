const yo = require('yo-yo')
const csjs = require('csjs-inject')
const modalDialog = require('../ui/modaldialog')

const css = csjs` 
.permissions {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 5px 20px;
}
.permissions button {
  padding: 2px 5px;
  cursor: pointer;
}
.permissionForm h4 {
  font-size: 1.3rem;
  text-align: center;
}
.permissionForm h6 {
  font-size: 1.1rem;
}
.permissionForm hr {
  width: 80%;
}
.checkbox {
  display: flex;
  align-items: center;
}
.checkbox label {
  margin: 0;
  font-size: 1rem;
}`

export class PluginManagerSettings {

  openDialog () {
    const fromLocal = window.localStorage.getItem('plugins/permissions')
    this.permissions = JSON.parse(fromLocal || '{}')
    modalDialog('Plugin Manager Settings', this.settings(),
      { fn: () => this.onValidation() },
    )
  }

  onValidation () {
    const permissions = JSON.stringify(this.permissions)
    window.localStorage.setItem('plugins/permissions', permissions)
  }

  settings () {
    const permissionByModule = (key, permission) => {
      const permissionByPlugin = (name, plugin) => {
        function updatePermission () {
          plugin.allow = !plugin.allow
        }
        const checkbox = plugin.allow
          ? yo`<input onchange="${updatePermission}" type="checkbox" checked id="permission-${name}" aria-describedby="module ${key} ask permission for ${name}" />`
          : yo`<input onchange="${updatePermission}" type="checkbox" id="permission-${name}" aria-describedby="module ${key} ask permission for ${name}" />`

        return yo`
        <div class="form-group ${css.checkbox}">
          ${checkbox}
          <label for="permission-${name}">Allow plugin ${name} to write on ${key}</label>
        </div>`
      }

      const byModule = Object
        .keys(permission)
        .map(name => permissionByPlugin(name, permission[name]))

      return yo`
      <div>
        <h6>${key} :</h6>
        ${byModule}
      </div>`
    }

    const permissions = Object
      .keys(this.permissions)
      .map(key => permissionByModule(key, this.permissions[key]))

    const title = permissions.length === 0
      ? yo`<h4>No Permission requested yet.</h4>`
      : yo`<h4>Current Permission settings</h4>`

    return yo`<form class="${css.permissionForm}">
      ${title}
      <hr/>
      ${permissions}
    </form>`
  }

  render () {
    return yo`
    <footer class="navbar navbar-light bg-light ${css.permissions}">
      <button onclick="${() => this.openDialog()}" class="btn btn-info">Settings</button>
    </footer>`
  }

}
