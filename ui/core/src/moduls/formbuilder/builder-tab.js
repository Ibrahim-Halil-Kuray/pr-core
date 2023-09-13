/**
 * BuilderTab
 *
 * This Class is responsible for the construction of components
 */
function FT_BuilderTab(fb, jqEl) {
    this.init = function (fb, jqEl) {
      this.fb = fb
      this.el = jqEl
      var _ = this
      try {
        var splitLayoutMain = this.el.find('.split-layout-main')
        if (!splitLayoutMain.attr('id')) {
          splitLayoutMain.attr('id', this.fb.randomId())
        }
        this.layout = splitLayoutMain.layout(
          {
            closable: false,	// pane can open & close
            resizable: true,	// when open, pane can be resized
            slidable: true,	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            livePaneResizing: true,
            stateManagement__enabled: true, // automatic cookie load & save enabled by default
            showDebugMessages: false, // log and/or display messages from debugging & testing code
            minSize: 0.1,
            size: 0.5,
            maxSize: 0.9,
            west: {
            },
            center: {
            }
          }
        )
      } catch (exceptionWhenInitSplitPane) {
        console.log(exceptionWhenInitSplitPane)
        this.layout = {
          resizeAll: function () {
          }
        }
      }
  
      this.templateEditor = ace.edit('hcbuild-editor')
      this.templateEditor.session.setMode('ace/mode/handlebars')
      this.templateEditor.setTheme('ace/theme/tomorrow_night')
      // this.templateEditor.setAutoScrollEditorIntoView(true);
      // enable autocompletion and snippets
      this.aceEditorOptions = {
        maxLines: Infinity,
        autoScrollEditorIntoView: true,
        enableBasicAutocompletion: false,
        enableSnippets: true,
        wrapBehavioursEnabled: true,
        // autoScrollEditorIntoView: true,
        enableLiveAutocompletion: true
      }
      this.templateEditor.setOptions(this.aceEditorOptions)
      this.templateEditor.setShowPrintMargin(false)
  
      this.templateEditor.commands.addCommand({
        name: 'saveFile',
        bindKey: {
          win: 'Ctrl-S',
          mac: 'Command-S',
          sender: 'editor|cli'
        },
        exec: function (env, args, request) {
          try {
            fb.builderTab.storeComponent()
          } catch (ex) {
            console.log(ex)
          }
        }
      })
      this.templateEditor.on('input', function (a, b, c) {
        try {
          if (b.replacingContentItsNotAChange) {
            b.replacingContentItsNotAChange = false
            return
          } else {
            fb.builderTab.editorsValueChanged(b)
          }
          var template = b.getValue()
          fb.builderTab.render(template, fb.builderTab.settingsEditor.getValue())
        } catch (ex) {
          console.log(ex)
        }
      })
      this.templateEditor.renderer.on('afterRender', function () {
        _.aceEditorResize($(_.templateEditor.container))
      })
      // this.templateEditor.renderer.setScrollMargin(10, 10, 10, 10);
      // this.templateEditor.getSession().setUseWrapMode(false);
      this.templateEditor.$blockScrolling = Infinity
  
      this.settingsEditor = ace.edit('hcbuild-json-settings')
      this.settingsEditor.session.setMode('ace/mode/json')
      this.settingsEditor.setTheme('ace/theme/tomorrow_night')
      // this.settingsEditor.setAutoScrollEditorIntoView(true);
      // enable autocompletion and snippets
      this.settingsEditor.setOptions(this.aceEditorOptions)
      this.settingsEditor.setShowPrintMargin(false)
      // this.settingsEditor.renderer.setScrollMargin(10, 10, 10, 10);
      this.settingsEditor.$blockScrolling = Infinity
      this.settingsEditor.commands.addCommand({
        name: 'saveFile',
        bindKey: {
          win: 'Ctrl-S',
          mac: 'Command-S',
          sender: 'editor|cli'
        },
        exec: function (env, args, request) {
          try {
            fb.builderTab.storeComponent()
          } catch (ex) {
            console.log(ex)
          }
        }
      })
      this.settingsEditor.on('input', function (a, b, c) {
        try {
          if (b.replacingContentItsNotAChange) {
            b.replacingContentItsNotAChange = false
            return
          } else {
            fb.builderTab.editorsValueChanged(b)
          }
          fb.builderTab.render(fb.builderTab.templateEditor.getValue(), b.getValue())
        } catch (ex) {
          console.log(ex)
        }
      })
      this.settingsEditor.renderer.on('afterRender', function () {
        _.aceEditorResize($(_.settingsEditor.container))
      })
      this.el.find('.new-btn').click(function () {
        fb.builderTab.newComponent(true)
      })
      this.el.find('.new-copy-btn').click(function () {
        fb.builderTab.newComponent(false)
      })
      this.el.find('.build-btn').click(function () {
        fb.builderTab.storeComponent()
      })
      var fullscreenTarget = this.el.parent().find('.fullscreen-target')
      var fullscreenEvent = function (fullscreenBtn, changeState) {
        if (fullscreenTarget.hasClass('fullscreen')) {
          if (changeState) {
            var sticky = fullscreenTarget.parents('.fb-sticky-right')
            if (sticky.length) {
              if (fullscreenTarget._lastTrans) {
                sticky.css('transform', fullscreenTarget._lastTrans)
              }
            }
            fullscreenTarget.removeClass('fullscreen')
            fullscreenTarget.css({ 'height': '' })
            fullscreenTarget.find('.panel-body').css({ 'height': '' })
            fullscreenBtn.find('span.glyphicon').removeClass('glyphicon-resize-small')
            fullscreenBtn.find('span.glyphicon').addClass('glyphicon-fullscreen')
          } else {
            fullscreenTarget.height($(window).height())
            fullscreenTarget.find('.panel-body').height($(window).height() - 55)
          }
        } else {
          if (changeState) {
            var sticky = fullscreenTarget.parents('.fb-sticky-right')
            if (sticky.length) {
              fullscreenTarget._lastTrans = sticky.css('transform')
              sticky.css('transform', '')
            }
            fullscreenTarget.addClass('fullscreen')
            fullscreenTarget.height($(window).height())
            fullscreenTarget.find('.panel-body').height($(window).height() - 55)
            fullscreenBtn.find('span.glyphicon').removeClass('glyphicon-fullscreen')
            fullscreenBtn.find('span.glyphicon').addClass('glyphicon-resize-small')
          }
        }
        setTimeout(function () {
          _.layout.resizeAll()
          _.aceEditorResizeAll()
        }, 450)
        setTimeout(function () {
          _.layout.resizeAll()
          _.aceEditorResizeAll()
        }, 850)
        setTimeout(function () {
          _.layout.resizeAll()
          _.aceEditorResizeAll()
        }, 1250)
      }
      var fullscreenBtn = this.el.find('.fullscreen-btn')
      this.el.find('.fullscreen-btn').click(function () {
        fullscreenEvent($(this), true)
      })
      $(window).resize(function () {
        fullscreenEvent(fullscreenBtn, false)
      })
      this.el.addClass('new-entry')
    }
    this.getBasePath = function () {
      return '/static/js'
    }
    this.fb = null
    this.el = null
    this.compId = null
    this.dfsId = null
    this.component = null
    this.templateEditor = null
    this.settingsEditor = null
    this.possibleToStore = false
    this.updateDfsId = function (oldId, newId) {
      if (this.dfsId === oldId) {
        this.dfsId = newId
      }
    }
    this.render = function (template, settings, notChanged) {
      if (template || settings) {
        var html = fb.compileTemplate(template, settings)
        if (html) {
          try {
            var $html = $(html)
            $html.find('script').each(function () {
              eval($(this).text())
            })
            var $v = this.el.find('.hcbuild-viewer')
            $v.empty()
            $v.append($html)
            if (notChanged) {
              return
            }
            this.possibleToStore = true
            this.enableSaveBtn(true)
            return
          } catch (e) { console.log(e) }
        }
      }
      this.possibleToStore = false
      this.enableSaveBtn(false)
      this.el.find('.hcbuild-viewer').empty()
    }
    this.storeComponent = function () {
      if (!this.possibleToStore) {
        return
      }
      if (!this.dfsId) {
        this.dfsId = this.fb.randomId()
      }
      var settings = $.parseJSON(this.settingsEditor.getValue())
      var template = this.templateEditor.getValue()
      this.fb.compiler.cacheTemplate(this.dfsId, template)
      this.fb.componentsTab.addComponent(this.dfsId, { template: template, settings: settings })
      this.editMode()
      this.editorsValueSaved()
    }
    // {"someDfsId":{template:"", settings:{}}}
    this.editComponent = function (dfsId, component) {
      this.editMode()
      this.editorsValueSaved()
      this.dfsId = dfsId
      this.component = component
      this.templateEditor.replacingContentItsNotAChange = true
      this.templateEditor.setValue(component.template, -1)
      this.templateEditor.session.getUndoManager().reset()
      this.templateEditor.session.getUndoManager().markClean()
      this.templateEditor.selection.moveCursorToScreen(0, 0)
      this.settingsEditor.replacingContentItsNotAChange = true
      this.settingsEditor.setValue(JSON.stringify(this.cleanSettingsBeforeSetToEditor(component.settings), null, '\t'), -1)
      this.settingsEditor.session.getUndoManager().reset()
      this.settingsEditor.session.getUndoManager().markClean()
      this.settingsEditor.selection.moveCursorToScreen(0, 0)
      this.showTab()
      this.enableSaveBtn(false)
      this.possibleToStore = false
      this.render(component.template, component.settings, true)
    }
    this.cleanSettingsBeforeSetToEditor = function (settings) {
      var settingsCopy = this.fb.deepCopySettings(settings)
      if ($.isArray(settingsCopy)) {
        for (var i = 0; i < settingsCopy.length; ++i) {
          delete settingsCopy[i].id
        }
      } else {
        delete settingsCopy.id
      }
      return settingsCopy
    }
    this.newComponent = function (clean) {
      this.dfsId = fb.randomId()
      if (clean) {
        this.templateEditor.replacingContentItsNotAChange = true
        this.templateEditor.setValue('')
        this.templateEditor.selection.moveCursorToScreen(0, 0)
        this.settingsEditor.replacingContentItsNotAChange = true
        this.settingsEditor.setValue('')
        this.settingsEditor.selection.moveCursorToScreen(0, 0)
        this.newEntryMode()
        this.render()
      } else {
        this.newEntryPlusMode()
      }
    }
    this.editMode = function () {
      this.el.removeClass('new-entry')
      this.el.removeClass('new-entry-plus')
    }
    this.newEntryMode = function () {
      this.el.removeClass('new-entry-plus')
      this.el.addClass('new-entry')
    }
    this.newEntryPlusMode = function () {
      this.el.removeClass('new-entry')
      this.el.addClass('new-entry-plus')
    }
    this.editorsValueChanged = function (editor) {
      var saveBtn = this.el.find('.build-btn')
      saveBtn.addClass('btn-warning')
      saveBtn.removeClass('btn-secondary')
      saveBtn.addClass('hcb-changed')
      try {
        _.aceEditorResize($(editor.container))
      } catch (eee) {
      }
    }
    this.enableSaveBtn = function (enable) {
      var saveBtn = this.el.find('.build-btn')
      if (enable) {
        saveBtn.removeAttr('disabled')
      } else {
        saveBtn.prop('disabled', true)
      }
    }
    this.editorsValueSaved = function () {
      var saveBtn = this.el.find('.build-btn')
      saveBtn.addClass('btn-secondary')
      saveBtn.removeClass('btn-warning')
      saveBtn.removeClass('hcb-changed')
    }
    this.showTab = function () {
      this.fb.el.find('.hcbuilder a.' + this.el.attr('id')).tab('show')
    }
    this.tabShown = function () {
      var _ = this
      _.layout.resizeAll()
      _.aceEditorResizeAll()
      this.fb.activeTabObj = null
    }
    this.aceEditorResizeAll = function () {
      this.templateEditor.resize()
      this.settingsEditor.resize()
    }
    this.aceEditorResize = function (aceEditorEl) {
      var ace_content = aceEditorEl.find('.ace_content')
      var ace_gutter = aceEditorEl.find('.ace_gutter')
      var stretchEditorWidth = ace_gutter.width()
      var stretchEditorHeight = ace_gutter.height()
      stretchEditorWidth = stretchEditorWidth + ace_content.width()
      aceEditorEl.width(stretchEditorWidth)
      aceEditorEl.height(stretchEditorHeight)
    }
    this.tabHidden = function () {
    }
    this.init(fb, jqEl)
}

export default FT_BuilderTab