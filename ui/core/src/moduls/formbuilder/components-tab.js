/**
 * ComponentsTab core model:
 *
 * components = {"someDfsId":{template:"mustache js template...", settings:{...}}}
 *
 * template: handlebars template string you have defined in builderTab
 * settings: settings you have defined in the builderTab
 */
function FT_ComponentsTab(fb, jqEl) {
    this.init = function (fb, el) {
      this.tabActive = true
      this.fb = fb
      this.el = el
      this.searchField = this.el.find('.fb-comp-search-field')
      if (this.el.hasClass('hcbuild-comp-body')) {
        this.body = this.el
      } else {
        this.body = this.el.find('.hcbuild-comp-body')
      }
      if (this.fb.options.componentsTab.components) {
        this.components = this.fb.options.componentsTab.components
        this.render()
      }
      this.defaultDescriptor = {
        // name: "",
        // validate: {required: true}
      }
      var componentsTab = this
      if (componentsTab.fb.options.userAllowedToEditComponents) {
        $.contextMenu({
          selector: '.hcbuild-main .htmlComponents .fb-component',
          callback: function (key, options) {
            if (key === 'edit') {
              componentsTab.onEditComponent(this)
            } else if (key === 'copy') {
              componentsTab.onCopyComponent(this)
            } else if (key === 'paste') {
              componentsTab.onPasteComponent(this)
            } else if (key === 'delete') {
              componentsTab.onDeleteComponent(this)
            }
          },
          items: {
            'edit': { name: 'Edit', icon: 'edit' },
            // "cut": {name: "Cut", icon: "cut"},
            'copy': { name: 'Copy', icon: 'copy' },
            'paste': { name: 'Paste', icon: 'paste' },
            'delete': { name: 'Delete', icon: 'delete' }
          }
        })
      }
      this.saveBtnEl = this.el.find('.save-btn')
      if (componentsTab.fb.options.userAllowedToEditComponents !== true) {
        this.saveBtnEl.hide()
      }
      this.saveBtnEl.click(function () {
        componentsTab.storeComponents()
      })
      this.body.dblclick(function (event) {
        if (componentsTab.fb.options.userAllowedToEditComponents) {
          var fbComponent = $(event.target)
          var maxIndex = 80
          var index = 1
          while (!fbComponent.hasClass('fb-component')) {
            fbComponent = fbComponent.parent()
            ++index
            if (maxIndex < index) {
              break
            }
          }
          if (fbComponent.hasClass('fb-component')) {
            componentsTab.onEditComponent(fbComponent)
          }
        }
      })
      this.searchField.keydown(function (event) {
        if (event.keyCode === 13) {
          event.preventDefault()
          return false
        }
      })
      this.searchField.keyup(function (event) {
        if (event.keyCode === 13) {
          event.preventDefault()
          return false
        }
        componentsTab.searchComponentsAndRender($(this).val())
      })
    }
    this.searchComponentsAndRender = function (text) {
      var _ = this
      _.fb.options.component.searchComp(text, function (data) {
        if (data) {
          try {
            var searchedComponents = {}
            var compsCount = 0
            for (var key in data) {
              if (data.hasOwnProperty(key)) {
                if (typeof data[key].settings === 'string') {
                  data[key].settings = JSON.parse(data[key].settings)
                }
                data[key].settings = _.fb.deepCopySettings(data[key].settings, _.getDefaultSettingsDescriptor())
                searchedComponents[key] = {
                  template: data[key].template,
                  settings: data[key].settings
                }
                ++compsCount
              }
            }
            if (compsCount > 0) {
              _.components = searchedComponents
              _.render()
              return
            }
          } catch (errorOnSearch) {
            console.log(errorOnSearch)
          }
          _.components = {}
          _.render()
        } else {
          _.components = {}
          _.render()
        }
      })
    }
    this.getDefaultSettingsDescriptor = function () {
      // return this.fb.deepCopySettings(this.defaultDescriptor);
      return null
    }
    this.loadData = function () {
      var componentsTab = this
      this.fb.options.component.requestComp(null, function (data) {
        if (data) {
          var count = 0
          if (!componentsTab.components) {
            componentsTab.components = {}
          }
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              if (data[key].settings && data[key].template) {
                if (typeof data[key].settings === 'string') {
                  data[key].settings = JSON.parse(data[key].settings)
                }
                data[key].settings = componentsTab.fb.deepCopySettings(data[key].settings, componentsTab.getDefaultSettingsDescriptor())
                // if(data[key].settings.action && data[key].settings.action.startsWith("alert")){
                //   data[key].settings.action = "";
                // }
                componentsTab.components[key] = {
                  template: data[key].template,
                  settings: data[key].settings
                }
                ++count
              }
            }
          }
  
          if (count > 0) {
            componentsTab.render()
          } else {
            componentsTab.loadDefaultData()
          }
        } else {
          componentsTab.loadDefaultData()
        }
      })
    }
    this.loadDefaultData = function () {
      this.components = fbDefaultComponents
      for (var key in this.components) {
        if (this.components.hasOwnProperty(key)) {
          this.components[key].settings = this.fb.deepCopySettings(this.components[key].settings, this.getDefaultSettingsDescriptor())
          this.storeQueue[key] = true
        }
      }
      this.componentsChanged()
      this.render()
    }
    this.fb = null
    this.el = null
    this.templates = null
    this.copiedComponentDfsId = null
    this.components = {}// {"someDfsId":{template:"", settings:{}}};
    // same as components but this one is not being emptied when searching for components
    // it is needed to prevent from compile issues when re-rending components on the workspace
    this.backupComponents = {}
    this.storeQueue = {}
    this.getComponentById = function (dfsId) {
      return this.components[dfsId]
    }
    this.updateDfsId = function (oldId, newId) {
      this.components[newId] = this.components[oldId]
      delete this.components[oldId]
      if (this.copiedComponentDfsId === oldId) {
        this.copiedComponentDfsId = newId
      }
      this.body.find(".fb-component[data-dfsId='" + oldId + "']").attr('data-dfsId', newId)
      this.fb.workspace.updateDfsId(oldId, newId)
      this.fb.builderTab.updateDfsId(oldId, newId)
    }
    this.storeComponents = function () {
      var componentsTab = this
      for (var key in this.storeQueue) {
        if (this.storeQueue.hasOwnProperty(key)) {
          if (this.components[key]) {
            var updateComp = this.components[key]
            var newComp = { id: key, template: updateComp.template, settings: updateComp.settings }
            this.fb.options.component.storeComp(newComp, function (data) {
              if (data && data.oldId && data.newId) {
                componentsTab.updateDfsId(data.oldId, data.newId)
              }
            })
          }
        }
      }
      this.storeQueue = {}
      this.componentsSaved()
    }
    this.getSettingsById = function (dfsId) {
      if (this.components[dfsId]) {
        return this.components[dfsId].settings
      }
      return this.backupComponents[dfsId].settings
    }
    this.getTemplateById = function (dfsId) {
      if (this.components[dfsId]) {
        return this.components[dfsId].template
      }
      return this.backupComponents[dfsId].template
    }
    this.addComponent = function (dfsId, component, jqEl) {
      var _ = this
      var isNew = false
      if (_.components[dfsId]) {
        isNew = false
      } else {
        isNew = true
      }
      _.components[dfsId] = component
      _.backupComponents[dfsId] = component
      _.componentTojqElement(dfsId, component, function (newJqEl) {
        if (isNew) {
          if (jqEl && jqEl.length) {
            jqEl.after(newJqEl)
          } else {
            _.body.append(newJqEl)
          }
        } else {
          _.body.find(".fb-component[data-dfsId='" + dfsId + "']").replaceWith(newJqEl)
        }
        _.fb.workspace.dragAndDropManager.attachDragEvent(newJqEl, true)
        _.storeQueue[dfsId] = true
        _.componentsChanged()
      })
      if (!isNew) {
        _.fb.workspace.componentChanged(dfsId, component)
      }
    }
    this.componentTojqElement = function (dfsId, component, callback) {
      var _ = this.fb
      _.translateSettingsAndCompileTemplate(dfsId, component.template, component.settings, function (compiledTmpl) {
        _.htmlRenderer(compiledTmpl, component.settings, function (renderedHtml) {
          var newJqEl = $(renderedHtml).attr('data-dfsId', dfsId)
          newJqEl.addClass('fb-component')
          // newJqEl.addClass("row");
          callback(newJqEl)
        })
      })
    }
    this.onEditComponent = function (jqEl) {
      var dfsId = jqEl.attr('data-dfsId')
      this.fb.builderTab.editComponent(dfsId, this.components[dfsId])
    }
    this.onCopyComponent = function (jqEl) {
      var dfsId = jqEl.attr('data-dfsId')
      this.copiedComponentDfsId = dfsId
    }
    this.onPasteComponent = function (jqEl) {
      if (this.copiedComponentDfsId) {
        this.addComponent(this.fb.randomId(), this.fb.deepCopySettings(this.components[this.copiedComponentDfsId]), jqEl)
      }
    }
    this.onDeleteComponent = function (jqEl) {
      var dfsId = jqEl.attr('data-dfsId')
      // delete remote
      this.fb.options.component.deleteComp(dfsId, function () {
        // deleted
      })
      // delete local
      this.body.find(".fb-component[data-dfsId='" + dfsId + "']").remove()
      delete this.components[dfsId]
    }
    this.render = function () {
      var _ = this
      var size = _.sizeOf(_.components)
      var deliveredCollector = []
      if (size === 0) {
        _.body.empty()
      } else {
        if (!_.fb.workspace.dragAndDropManager) {
          _.fb.workspace.reInitDragAndDropEvent()
        }
        for (var key in _.components) {
          if (_.components.hasOwnProperty(key)) {
            _.backupComponents[key] = _.components[key]
            _.componentTojqElement(key, _.components[key], function (jqElement) {
              deliveredCollector.push(jqElement)
              if (size == deliveredCollector.length) {
                deliveredCollector.sort(function (a, b) { // sort by id ignoring letters in it:
                  var aId = $(a).attr('data-dfsid') + ''
                  var bId = $(b).attr('data-dfsid') + ''
                  return (parseInt(bId.substring(2)) < parseInt(aId.substring(2))) ? 1 : -1
                })
                _.body.empty()
                // append
                var $refComp
                for (var i = 0; i < deliveredCollector.length; ++i) {
                  $refComp = $(deliveredCollector[i])
                  _.body.append($refComp)
                  try { _.fb.workspace.dragAndDropManager.attachDragEvent($refComp, true) } catch (eee) { console.log(eee) }
                }
                setTimeout(function () {
                  _.fb.workspace.connectionManager.update()
                }, 2000)
              }
            })
          }
        }
      }
    }
    this.sizeOf = function (obj) {
      var size = 0; var key
      for (key in obj) {
        if (obj.hasOwnProperty(key)) size++
      }
      return size
    }
    this.showTab = function () {
      this.fb.el.find('.hcbuilder a.' + this.el.attr('id')).tab('show')
    }
    this.tabShown = function () {
      this.tabActive = true
      this.fb.activeTabObj = this
      fb.calcContainerHeight(this, true)
      if (this.fb.options.readOnly !== true) {
        this.searchField.focus()
      }
      this.fb.workspace.connectionManager.update()
    }
    this.tabHidden = function () {
      this.tabActive = false
      this.fb.workspace.connectionManager.update()
    }
    this.componentsChanged = function () {
      this.saveBtnEl.addClass('btn-warning')
      this.saveBtnEl.removeClass('btn-secondary')
      this.saveBtnEl.addClass('hcb-changed')
    }
    this.componentsSaved = function () {
      this.saveBtnEl.addClass('btn-secondary')
      this.saveBtnEl.removeClass('btn-warning')
      this.saveBtnEl.removeClass('hcb-changed')
    }
    this.init(fb, jqEl)
}

export default FT_ComponentsTab