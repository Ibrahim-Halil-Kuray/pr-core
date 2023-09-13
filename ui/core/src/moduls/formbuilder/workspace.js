/**
 * Workspace core model:
 *
 * components = { "id": settings:{...}}
 *
 * id = elementId in the workspace
 * settings = specific settings of the element in the workspace
 */

function FT_Workspace(fb, jqEl, comps){
    this.init = function (fb, jqEl, comps) {
      this.fb = fb
      this.el = jqEl
      if (this.el.hasClass('ws-holder')) {
        this.body = this.el
      } else {
        this.body = this.el.find('.ws-holder')
      }
      this.form = this.body.find('form')
  
      this.testMain = this.el.find('.hcbuild-workspace-test-main')
      this.testBody = this.testMain.find('.workspace-test-body')
      this.testMain.find('.submit-test').click(this.formSubmitTestEvent)
      this.testMain.find('.clear-form-data').click(this.formClearDataEvent)
      this.switches = {
        test: this.el.find('.ws-mode.mode-test'),
        action: this.el.find('.ws-mode.mode-action'),
        connection: this.el.find('.ws-mode.ws-connections input'),
        workspace: this.el.find('.ws-mode.mode-workspace')
      }
      let self = this
      this.switches.test.click(function (e) {
        e.preventDefault()
        self.switches.test.removeClass('active').addClass('active')
        self.switches.action.removeClass('active')
        self.switches.workspace.removeClass('active')
        fb.workspace.switchMode(true)
      })
      this.switches.action.click(function (e) {
        e.preventDefault()
        if (self.switches.action.hasClass('active')) {
          return
        }
        if (self.switches.test.hasClass('active')) {
          fb.workspace.switchMode(false)
        }
        fb.workspace.actionManager.lastStateEnabled = true
        fb.workspace.actionManager.enable(true)
        self.switches.action.removeClass('active').addClass('active')
        self.switches.test.removeClass('active')
        self.switches.workspace.removeClass('active')
      })
      this.switches.workspace.click(function (e) {
        e.preventDefault()
        if (self.switches.test.hasClass('active')) {
          fb.workspace.switchMode(false)
          fb.workspace.actionManager.lastStateEnabled = false
          fb.workspace.actionManager.enable(false)
        }
        if (self.switches.action.hasClass('active')) {
          fb.workspace.actionManager.lastStateEnabled = false
          fb.workspace.actionManager.enable(false)
        }
  
        self.switches.workspace.removeClass('active').addClass('active')
        self.switches.test.removeClass('active')
        self.switches.action.removeClass('active')
      })
      if (comps) {
        this.components = comps
      }
      var workspaceTab = this
      $.contextMenu({
        selector: '.hcbuild-main .hcbuild-workspace-body .fb-component',
        build: function ($trigger, e) {
          var items
          if ($trigger && $trigger.length) {
            workspaceTab.selectComponent(null, $trigger)
            if ($trigger.hasClass('fbc-grp-parent')) {
              items = {
                'paste': { name: 'Paste', icon: 'paste' },
                'delete': { name: 'Delete', icon: 'delete' }
              }
            } else {
              items = {
                'copy': { name: 'Copy', icon: 'copy' },
                'paste': { name: 'Paste', icon: 'paste' },
                'delete': { name: 'Delete', icon: 'delete' }
              }
              if (workspaceTab.fb.options.userAllowedToEditComponents) {
                items.copyToComp = { name: 'Copy to Components', icon: 'copy' }
              }
            }
            if (!localStorage.getItem('ws-clipboard')) {
              delete items['paste']
            }
          }
          return {
            callback: function (key, options) {
              if (key === 'copy') {
                workspaceTab.onWSCopyComponent()
              } else if (key === 'copyToComp') {
                workspaceTab.onCopyComponent(this, true)
              } else if (key === 'paste') {
                workspaceTab.onWSPasteComponent()
                workspaceTab.connectionManager.update(this)
              } else if (key === 'delete') {
                workspaceTab.onDeleteComponent(this)
                workspaceTab.connectionManager.update()
              }
            },
            items: items
          }
        }
      })
      this.connectionManager.setup(fb)
    }
    this.loadData = function (pFormSrc) {
      if (!pFormSrc) {
        pFormSrc = this.fb.options.data
      } else {
        this.fb.options.data = pFormSrc
      }
  
      var comps
      if (pFormSrc) {
        comps = this.fb.compiler.getComps(pFormSrc)
      }
  
      if (comps) {
        this.components = comps
        this.render('', this.components)
      } else {
        this.renderNew()
      }
    }
    this.recompileWorkspace = function (htmlStr, jsonSettings, compByIdCallback, doneCallback) {
      var _ = this.fb
      if (jsonSettings) {
        _.workspace.components = _.compiler.getComps(jsonSettings)
        if (htmlStr) {
          var $html, _compId, c, cm
          $html = $(htmlStr)
          if ($html.length) { // compatibility check
            _.compiler.compsMainLoop(_.workspace.components, function (compId, comp, compMain) {
              compMain = _.compiler.getCompMainObject(comp)
              if (!compMain['_compId']) {
                _compId = $html.find('#' + compId).attr('data-dfsId')
                if (_compId) {
                  compMain['_compId'] = _compId
                  c = _.workspace.components[compId]
                  if (c) {
                    cm = _.compiler.getCompMainObject(c)
                    cm['_compId'] = _compId
                  }
                } else {
                  // delete because we can't find the corresponding comp reference
                  delete _.workspace.components[compId]
                }
              }
              return true
            })
          }
        }
        _.translateSettings(_.workspace.components, null, function (translatedSettings) {
          doneCallback('<form>' + _.compiler.cForm({
            form: _.compiler.getConvertToNewestFormStructure(translatedSettings),
            componentsOnly: true
          }) + '</form>')
        })
      }
    }
    this.updateMetaData = function (compSettings, metaData, updateOrderOfAll) {
      var c = this.fb.compiler; var compMain
      if (compSettings && metaData) {
        compMain = c.getCompMainObject(compSettings)
        if (metaData.compId) {
          compMain['_compId'] = metaData.compId
        }
        if (!isNaN(metaData.order)) {
          compMain['_order'] = metaData.order
        }
      }
      if (updateOrderOfAll) {
        var ws = this; var $fbComp
        c.compsLoop(this.components, function (compId, comp) {
          compMain = c.getCompMainObject(comp)
          $fbComp = ws.getActiveBody().find('#' + compId)
          ws.updateMetaData(ws.components[compId], { order: $fbComp.index() }, null)
          return true
        })
      }
    }
    this.render = function (htmlStr, jsonSettings) {
      var workspace = this
      try {
        if (typeof jsonSettings === 'string') {
          jsonSettings = $.parseJSON(jsonSettings)
        } else {
          jsonSettings = this.fb.deepCopySettings(jsonSettings)
        }
      } catch (parseError) {
        jsonSettings = null
      }
      if (jsonSettings && this.fb.compiler.sizeOf(jsonSettings) > 0) {
        // workspace.reInitDragAndDropEvent()
        this.recompileWorkspace(htmlStr, jsonSettings
          , function (compId) {
            return workspace.fb.componentsTab.getComponentById(compId)
          }, function (compiled) {
            // workspace.compiledWorkspaceData = compiled;
            workspace.fb.htmlRenderer(compiled, jsonSettings, function (renderedWorkspaceData) {
              var $renderedWorkspace = $(renderedWorkspaceData)
              workspace.beforeInserting($renderedWorkspace)
              workspace.body.html($renderedWorkspace)
              workspace.form = workspace.body.children('form:first')
              workspace.form.addClass('fbc-dz fws-main')
              workspace.fb.settingsTab.clearBody()
              workspace.checkFormChilds()
              workspace.form.find('.fb-component').each(function () {
                this.addEventListener('click', function (e) {
                  return workspace.selectComponent(e, $(this))
                }, false)
              })
  
              setTimeout(function () {
                workspace.setStuffWeDontNeedToStore(workspace.form)
              }, 600)
              workspace.reInitDragAndDropEvent()
              workspace.afterInserting(workspace.body)
            })
          }
        )
      } else {
        this.renderNew()
      }
    }
    this.renderNew = function () {
      if (!this.form || this.form.length === 0) {
        var form = this.body.find('form')
        if (!form || form.length === 0) {
          this.body.append('<form class="fbc-dz fws-main"></form>')
          form = this.body.find('form')
        }
        this.form = form
      } else {
        this.form.empty()
      }
      this.form.addClass('fbc-dz fws-main')
      this.checkFormChilds()
      // this.compiledWorkspaceData = $(this.form.toString());
      this.fb.settingsTab.clearBody()
      this.reInitDragAndDropEvent()
      this.actionManager.init(this.body)
    }
    this.checkFormChilds = function () {
      this.form.css('height', '')
      if (this.form.parent().height() > this.form.height()) {
        this.form.css('height', '100%')
      }
    }
    this.insertHtmlStyleHelpers = function ($fbComp) {
      if ($fbComp.children('.fb-ws-only.fbdbg').length === 0) {
        $fbComp.prepend('<i class="fb-ws-only fbdbg"></i>')
      }
      if ($fbComp.children('.fb-ws-only.fbdfg').length === 0) {
        $fbComp.append('<i class="fb-ws-only fbdfg"><i class="left"></i><i class="right"></i></i>')
      }
    }
    this.reInitDragAndDropEvent = function () {
      var workspace = this
      setTimeout(function () {
        workspace.fb.calcContainerHeight(workspace.fb.componentsTab, true)
      }, 600)
  
      this.connectionManager.update()
      // this.oldDragAndDrop();return;
  
      if (!this.dragAndDropManager) {
        this.dragAndDropManager = {
          ws: this,
          dragActive: false,
          lastConUpdaterTo: [],
          onCompDropped: function ($comp, $newParent, $oldParent, newComp, index) {
            if (newComp) {
              var compId = this.ws.fb.randomId()
              $comp.attr('id', compId)
              var dfsId = $comp.attr('data-dfsId')
              this.ws.components[compId] = this.ws.fb.deepCopySettings(this.ws.fb.componentsTab.getSettingsById(dfsId))
            }
            $comp.data('lastFbcGrpIndex', this.dataIndex)
            this._setupGrpCompConnection($comp, $newParent, $oldParent, index)
            this.ws.addComponent($comp, newComp, index)
            this.ws.checkFormChilds()
          },
          onCompRemoved: function ($comp, $oldParent) {
            var _ = this
            this.ws.el.find('i[compref="' + $comp.attr('id') + '"]').each(function () {
              var $pointer = $(this)
              var $endpoint = $pointer.data('lastEndpoint')
              if ($endpoint && $endpoint.length) {
                _.ws.actionManager.clearDestinations($pointer, $endpoint)
              }
            })
            this._removeGrpCompImport($comp, $oldParent)
            this.ws.removeComponent($comp, $oldParent)
            this.ws.checkFormChilds()
          },
          _updateSettings: function (compId) {
            var settignsCompId = this.ws.fb.settingsTab.currentCompId()
            try {
              if (settignsCompId === compId) {
                this.ws.fb.settingsTab.updateSettings(settignsCompId, this.ws.components[compId])
              }
            } catch (e) {
              console.log(e)
            }
          },
          _setupGrpCompConnection: function ($comp, $newParent, $oldParent, index) {
            var grpParentCompId, childCompId, dataIndex, childCompMain, parentMain, childImports
            if ($oldParent) {
              this._removeGrpCompImport($comp, $oldParent)
            }
            // add import if it is a group parent
            if ($newParent && $newParent.length && $newParent.hasClass('fbc-grp-parent')) {
              grpParentCompId = $newParent.attr('id')
              dataIndex = $comp.nextParentWithClass('fbc-grp').attr('data-index')
              if (dataIndex !== undefined && dataIndex !== null && dataIndex !== '') {
                childCompId = $comp.attr('id')
                dataIndex = dataIndex + ''
                if (grpParentCompId && childCompId) {
                  childCompMain = this.ws.fb.compiler.getCompMainObject(this.ws.components[childCompId])
                  childCompMain['_grouped'] = true
                  parentMain = this.ws.fb.compiler.getCompMainObject(this.ws.components[grpParentCompId])
                  if (parentMain) {
                    if (!parentMain['_import']) {
                      parentMain['_import'] = {}
                    }
                    if (!parentMain['_import'][dataIndex]) {
                      parentMain['_import'][dataIndex] = []
                    }
                    childImports = parentMain['_import'][dataIndex]
                    if (isNaN(index)) {
                      index = $comp.index()
                    }
                    childImports.splice(index, 0, childCompId)
                  }
                  this._updateSettings(grpParentCompId)
                  this._updateSettings(childCompId)
                }
              }
            }
          },
          _removeGrpCompImport: function ($comp, $oldParent) {
            var grpParentCompId, childCompId, dataIndex, childCompMain, parentMain, childImports
            // remove import if it was a group parent
            if ($oldParent && $oldParent.length && $oldParent.attr('id') && $oldParent.hasClass('fbc-grp-parent')) {
              grpParentCompId = $oldParent.attr('id')
              childCompId = $comp.attr('id')
              dataIndex = $comp.data('lastFbcGrpIndex')
              if (dataIndex === undefined || dataIndex === null || dataIndex === '') {
                dataIndex = $comp.nextParentWithClass('fbc-grp').attr('data-index')
              }
              childCompMain = this.ws.fb.compiler.getCompMainObject(this.ws.components[childCompId])
              if (childCompMain) {
                delete childCompMain['_grouped']
              }
              parentMain = this.ws.fb.compiler.getCompMainObject(this.ws.components[grpParentCompId])
              if (parentMain && parentMain['_import'] && parentMain['_import'][dataIndex + '']) {
                childImports = parentMain['_import'][dataIndex + '']
                if (childImports.length) {
                  for (var i = 0; i < childImports.length; ++i) {
                    if (childImports[i] === childCompId) {
                      childImports.splice(i, 1)
                      break
                    }
                  }
                  if (childImports.length === 0) {
                    delete parentMain['_import'][dataIndex + '']
                  }
                }
              }
              this._updateSettings(grpParentCompId)
              this._updateSettings(childCompId)
            }
          },
          attachDragEvent: function ($el, isRefComp) {
            if ($el.hasClass('fb-component')) {
              this._attachDragEvent($el, isRefComp)
            } else {
              var $eles, i
              $eles = $el.find('.fb-component')
              for (i = 0; i < $eles.length; ++i) {
                this._attachDragEvent($($eles[i]), isRefComp)
              }
            }
          },
          _attachDragEvent: function ($fbComp, isRefComp) {
            if (isRefComp) {
              $fbComp.data('isRefComp', true)
              this._makeDraggable($fbComp)
              return
            }
            var $eles, i
            $eles = $fbComp.find('.fb-drop-here')
            var $fbDropHere; var hasDrops = false
            for (i = 0; i < $eles.length; ++i) {
              $fbDropHere = $($eles[i])
              var $compChildsHolder = $fbDropHere.parent()
              $compChildsHolder.addClass('fbc-dz').addClass('fbc-grp').attr('data-index', $fbDropHere.attr('data-index'))
              $fbDropHere.remove()
              hasDrops = true
            }
            $eles = $fbComp.find('.fb-component')
            for (i = 0; i < $eles.length; ++i) {
              this._attachDragEvent($($eles[i]), isRefComp)
            }
            this._makeDraggable($fbComp)
          },
          _createDragHandle: function ($el, sides) {
            if ($el.children('.fb-ws-only.fbdh').length === 0) {
              var html = ''
              for (var i = 0; i < sides.length; ++i) {
                html += '<i data-side="' + sides[i] + '" class="fb-ws-only fbdh dh' + sides[i] + '"> <i></i><i></i> <i></i><i></i> <i></i><i></i> </i>'
              }
              $el.append(html)
            }
          },
          _makeDraggable: function ($el) {
            if ($el.data('_alreadyDraggable')) {
              return
            }
            $el.data('_alreadyDraggable', true)
            this.ws.insertHtmlStyleHelpers($el)
            this._createDragHandle($el, ['left', 'top', 'right', 'bottom'])
  
            var _ = this
            // prevent from any runtime comp action during build time
            $el.find('input,button,select,textarea,a').each(function () {
              var $t = $(this)
              $t.unbind()
              this.setAttribute('disabled', 'disabled')
              for (var i = 0; i < this.attributes.length; i++) {
                var attrib = this.attributes[i]
                if (attrib.specified === true) {
                  if (/^on\w+/.test(attrib.name)) {
                    this.removeAttribute(attrib.name)
                  } else if (/href/i.test(attrib.name)) {
                    this.setAttribute(attrib.name, 'JavaScript:void(0);')
                  }
                }
              }
              $t.on('focus input paste change click submit select', function (e) {
                e.preventDefault()
                e.stopPropagation()
                $(this).blur()
                return false
              })
            })
            var scr = _.ws.fb.options.scrollableContainer
            var autoScroll
            if (scr && scr.length) {
              autoScroll = {
                container: scr[0]
              }
            }
            interact($el[0]).styleCursor(false).allowFrom('.fbdh').draggable({
              inertia: false,
              autoScroll: autoScroll,
              onstart: function (e) {
                if (e.interaction.downEvent.button === 2) {
                  return false
                }
  
                _.$dz = _.ws.body.find('.fws-main')
                if (_.$dz && _.$dz.length) {
                  _.dragActive = true
                } else {
                  _.dragActive = false
                  return false
                }
                _.$grpWhenStarted = null
                _.$parentWhenStarted = null
                _.dataIndex = null
                var $containers = _.ws.body.find('.fbc-dz')
                $containers.each(function () {
                  // this.removeEventListener("touchmove", _._dragenter, false);
                  this.removeEventListener('mouseover', _._dragenter, true)
                  this.removeEventListener('mouseout', _._dragleave, true)
                  // this.addEventListener("touchmove", _._dragenter, false);
                  this.addEventListener('mouseover', _._dragenter, true)
                  this.addEventListener('mouseout', _._dragleave, true)
                })
                _.$dragComp = $(e.target)
                _.$dz.addClass('drag-started')
                _._setDim(_.$dragComp, e.interaction.startOffset)
                _.tl.x = 0, _.tl.y = 0
                _.lastX = e.clientX
                _.lastY = e.clientY
                _.mousePos.y = e.clientY
                _.mousePos.x = e.clientX
                var cloneComp = function ($comp, id) {
                  var ids = []
                  var tid = $comp.attr('id')
                  $comp.find('[id]').each(function () {
                    var _id = $(this).attr('id')
                    if (_id) {
                      ids.push(_id)
                    }
                  })
                  var cpyComp = $comp.toString()
                  for (var i = 0; i < ids.length; i++) {
                    cpyComp = cpyComp.replace(new RegExp(ids[i], 'g'), 'cpy_' + ids[i])
                  }
                  if (tid) {
                    if (id) {
                      cpyComp = cpyComp.replace(new RegExp(tid, 'g'), id)
                    } else {
                      cpyComp = cpyComp.replace(new RegExp(tid, 'g'), 'cpy_' + tid)
                    }
                  }
                  var $dragCompDropCopy = $(cpyComp)
                  $dragCompDropCopy.attr('id', id)
                  return $dragCompDropCopy
                }
                if (_.$dragComp.data('isRefComp')) {
                  _.isRefComp = true
                  _.$dragComp = cloneComp(_.$dragComp, _.ws.fb.randomId())
                  _.$dragComp.addClass('fbc-new')
                  // _.$dragComp.css({visibility:'hidden'});
                  _._getOutOfWorkspaceHolder().append(_.$dragComp)
                  _.outOfMovingZone = true
                  _.$dropzone = null
                } else {
                  _._getOutOfWorkspaceHolder()
                  _.outOfMovingZone = false
                  _.isRefComp = false
                  _.$dropzone = _.$dragComp.nextParentWithClass('fbc-dz')
                  _.addDragActiveClass(_.$dropzone)
                  _.$grpWhenStarted = _.$dragComp.nextParentWithClass('fbc-grp')
                  if (_.$grpWhenStarted && _.$grpWhenStarted.length) {
                    _.dataIndex = _.$grpWhenStarted.attr('data-index')
                  }
                  _.$parentWhenStarted = _.ws.fb.getCompParentOf(_.$dragComp)
                }
                _.$dragMirror = _._createDragMirror(_.$dragComp)
                _.$dragComp.addClass('dragging')
                _._updateOrgPos()
                _.ws.actionManager.hide()
                _.ws.connectionManager.hide()
                _._isInsideForm()
                return true
              },
              onmove: function (e, a, b, c, d) {
                if (e.interaction.downEvent.button === 2) {
                  return false
                }
                _.mousePos.y = e.clientY
                _.mousePos.x = e.clientX
                _.tl.x += _.lastX - e.clientX
                _.tl.y += _.lastY - e.clientY
                _.lastX = e.clientX
                _.lastY = e.clientY
  
                if (!_._isInsideForm()) {
                  _.updateLater()
                  return _._checkForLeave(e)
                }
                var $t = $(_.elementFromPoint(e))
                if ($t.hasClass('fb-component')) {
                  if (!_.$dragMirror[0].contains($t[0]) && _.tryCloseToComponent($t)) {
                    return true
                  }
                } else if ($t.hasClass('fbc-dz')) {
                  if (!_.$dragMirror[0].contains($t[0]) && _.tryDropzoneInsert(e, $t)) {
                    return true
                  }
                }
                if (_._isInsideDropzone() && _.tryDropzoneInsert(e)) {
                  return true
                }
                if (_.tryCloseToComponent(_.$dragMirror.prev()) || _.tryCloseToComponent(_.$dragMirror.next())) {
                  return true
                }
                _.updateLater()
                return _._checkForLeave(e)
              },
              onend: function (event) {
                _.dragActive = false
                setTimeout(function () {
                  _._endDragging()
                  if (_.$dz[0].contains(_.$dragComp[0])) {
                    _.outOfMovingZone = false
                  }
                  if (_.isRefComp) {
                    if (_.outOfMovingZone) {
                      _.$dragComp.remove()
                    } else {
                      _.$dragComp.removeClass('fbc-new')
                      _.attachDragEvent(_.$dragComp)
                      _.onCompDropped(_.$dragComp, _.ws.fb.getCompParentOf(_.$dragComp), _.$parentWhenStarted, _.isRefComp, _.$dragMirror.index())
                    }
                  } else {
                    if (_.outOfMovingZone) {
                      _.onCompRemoved(_.$dragComp, _.$parentWhenStarted)
                      _.$dragComp.remove()
                    } else {
                      _.onCompDropped(_.$dragComp, _.ws.fb.getCompParentOf(_.$dragComp), _.$parentWhenStarted, _.isRefComp, _.$dragMirror.index())
                    }
                  }
                  _.ws.el.find('.fbc-copy-holder').children().each(function () {
                    var $t = $(this)
                    _.onCompRemoved($t)
                    $t.remove()
                  })
                  _.ws.body.find('.drag-active').each(function () {
                    _.remDragActiveClass($(this))
                  })
                }, 0)
  
                setTimeout(function () {
                  _._endDragging()
                  _._removeDragMirror(_.$dragMirror)
                  _.ws.actionManager.mayShow(_.ws.body, true)
                  _.ws.connectionManager.show(true)
                }, 500)
              }
            })
          },
          _endDragging: function () {
            this.$dragComp.removeClass('dragging')
            this.$dragComp.css('transform', '')
            this.$dz.removeClass('drag-started')
            this.$dropzone = null
          },
          _updatePos: function (target) {
            if (!target) {
              target = this.$dragComp
            }
            this.tl.y = this.mousePos.y - this.dragCompPosition.top - this.dim.handleY
            this.tl.x = this.mousePos.x - this.dragCompPosition.left - this.dim.handleX
            target[0].style.webkitTransform = target[0].style.transform = 'translate(' + this.tl.x + 'px, ' + this.tl.y + 'px)'
          },
          dim: {
            h: 0,
            w: 0,
            h2: 0,
            w2: 0,
            mt: 0,
            ml: 0,
            handleX: 0,
            handleY: 0,
            handlePercentX: 0,
            handlePercentY: 0
          },
          mousePos: { x: 0, y: 0 },
          _setDim: function ($t, startPos) {
            this.dim.mt = parseFloat($t.css('marginTop'))
            this.dim.ml = parseFloat($t.css('marginLeft'))
            this.dim.h = $t.outerHeight(true)
            this.dim.w = $t.outerWidth(true)
            this.dim.h2 = this.dim.h / 2
            this.dim.w2 = this.dim.w / 2
            if (startPos) {
              this.dim.handlePercentX = startPos.left + this.dim.ml
              this.dim.handlePercentX = 100 / this.dim.w * this.dim.handlePercentX
              this.dim.handlePercentY = startPos.top + this.dim.mt
              this.dim.handlePercentY = 100 / this.dim.h * this.dim.handlePercentY
            }
            this.dim.handleX = this.dim.handlePercentX * this.dim.w / 100
            this.dim.handleY = this.dim.handlePercentY * this.dim.h / 100
          },
          tl: { x: 0, y: 0 },
          dragCompPosition: { scrollOffsetY: 0, top: 0, left: 0 },
          _updateOrgPos: function (target) {
            if (!target) {
              target = this.$dragComp
            }
            this.bcr = target[0].getBoundingClientRect()
            this.dragCompPosition.top = (this.bcr.top + (-1 * this.tl.y)) - this.dim.mt
            this.dragCompPosition.left = (this.bcr.left + (-1 * this.tl.x)) - this.dim.ml
          },
          currentScrollPos: 0,
          lastScrollPos: 0,
          _getOutOfWorkspaceHolder: function () {
            this.$copyCompHolder = this.ws.el.find('.fbc-copy-holder')
            if (!this.$copyCompHolder.length) {
              this.$copyCompHolder = $('<form class="fbc-copy-holder"></form>')
              this.ws.el.append(this.$copyCompHolder)
            }
            return this.$copyCompHolder
          },
          _createDragMirror: function ($t) {
            var $mirror = $('<div class="drag-mirror"><div class="drag-mirror-bg"></div></div>')
            $t.replaceWith($mirror)
            $mirror.append($t)
            return $mirror
          },
          _removeDragMirror: function ($t) {
            var $fbc = $t.find('.fb-component:first')
            $t.replaceWith($fbc)
          },
          init: function () {
            var _ = this
            var $scr = _.ws.fb.options.scrollableContainer
            if ($scr && $scr.length && !$scr.data('init')) {
              $scr.scroll(function () {
                if (_.dragActive) {
                  _.updateLater()
                }
              })
              $scr.data('init', true)
            }
            _.tryCloseToComponent = function ($t) {
              if ($t && $t.length) {
                if ($t[0] === _.$dragMirror.parent()[0]) {
                  // target drag is the child of this dropzone
                  return false
                }
                var c = $t[0].getBoundingClientRect()
                if (_.mousePos.x > c.left && _.mousePos.x < c.right) {
                  var updateDragActiveClass = function ($t) {
                    $t = $t.nextParentWithClass('fbc-dz')
                    if (!_.$dropzone) {
                      _.addDragActiveClass($t)
                      _.$dropzone = $t
                    } else if ($t[0] !== _.$dropzone[0]) {
                      _.remDragActiveClass(_.$dropzone)
                      _.addDragActiveClass($t)
                      _.$dropzone = $t
                    }
                  }
                  if (_.mousePos.y > c.bottom - ((c.bottom - c.top) * 0.2) && _.mousePos.y < c.bottom) {
                    $t.after(_.$dragMirror)
                    updateDragActiveClass($t)
                    _.outOfMovingZone = false
                    _.updateCoords()
                    return true
                  } else if (_.mousePos.y > c.top && _.mousePos.y < c.top + ((c.bottom - c.top) * 0.2)) {
                    $t.before(_.$dragMirror)
                    updateDragActiveClass($t)
                    _.outOfMovingZone = false
                    _.updateCoords()
                    return true
                  }
                }
              }
              return false
            }
            _._dragenter = function (e) {
              if (!_.dragActive || _.enteredTarget || !_._isInsideForm()) {
                return true
              }
              var $t = $(_.elementFromPoint(e))
              if ($t.hasClass('fb-component')) {
                if (!_.$dragMirror[0].contains($t[0]) && _.tryCloseToComponent($t)) {
                  _.enteredTarget = e.target
                  _.changeDZfromComp($t)
                  return true
                }
                $t = $t.nextParentWithClass('fbc-dz')
              }
              if (!$t.hasClass('fbc-dz')) {
                return true
              }
              if ($t && $t.length) {
                if (!_.$dragMirror[0].contains($t[0]) && _.tryDropzoneInsert(e, $t)) {
                  _.enteredTarget = e.target
                  return true
                }
              }
              _.updateCoords()
              return true
            }
            _.elementFromPoint = function (e) {
              return document.elementFromPoint(e.clientX, e.clientY)
            }
            _.updateCoords = function () {
              this._setDim(this.$dragComp)
              this._updateOrgPos()
              this.updateLater()
            }
            _.updateLater = function () {
              var _ = this
              _._updatePos()
              setTimeout(function () {
                // rerender after UI thread of the browser is done
                _._updatePos()
              }, 0)
            }
            _.tryDropzoneInsert = function (e, $dz) {
              var r, offset
              if (!$dz) {
                if (_.$dropzone && _.$dropzone.length) {
                  $dz = _.$dropzone
                } else {
                  $dz = _.$dz
                }
              } else {
                if (!$dz.hasClass('fbc-dz')) {
                  return false
                }
                if (_.$dropzone && _.$dropzone.length) {
                  if ($dz[0] === _.$dropzone[0]) {
                    return false
                  }
                }
              }
              if (!$dz || $dz.length === 0) {
                return false
              }
              var isSameParent = $dz[0] === _.$dragMirror.parent()[0]
              if (isSameParent) {
                if ($dz[0] === _.$dz[0]) {
                  // do not change position on root
                  return false
                }
                offset = 0.1
              } else {
                if ($dz[0] === _.$dz[0]) {
                  offset = 0.1
                } else {
                  offset = 0.5
                }
              }
  
              if (!r) {
                r = $dz[0].getBoundingClientRect()
              }
              if (_.mousePos.y < r.top + ((r.bottom - r.top) * offset) && _.mousePos.y > r.top) {
                _.outOfMovingZone = false
                if (isSameParent) {
                  if (!_.$dragMirror[0].previousSibling) {
                    // already at this position
                    return false
                  }
                  _.$dragMirror.detach()
                } else {
                  _.remDragActiveClass(_.$dropzone)
                  _.addDragActiveClass($dz)
                }
                $dz.prepend(_.$dragMirror)
                _.$dropzone = $dz
                _.updateCoords()
                return true
              } else if ((_.mousePos.y > r.bottom - ((r.bottom - r.top) * offset) && _.mousePos.y < r.bottom) || $dz.children().length === 0 || $dz[0] === _.$dz[0]) {
                if (isSameParent) {
                  if (!_.$dragMirror[0].nextSibling) {
                    // already at this position
                    return false
                  }
                  _.$dragMirror.detach()
                } else {
                  _.remDragActiveClass(_.$dropzone)
                  _.addDragActiveClass($dz)
                }
                _.outOfMovingZone = false
                $dz.append(_.$dragMirror)
                _.$dropzone = $dz
                _.updateCoords()
                return true
              }
              return false
            }
  
            _.changeDZfromComp = function ($t) {
              $t = $t.nextParentWithClass('fbc-dz')
              if ($t && $t.length) {
                if (this.$dropzone && this.$dropzone.length) {
                  if (this.$dropzone[0] !== $t[0]) {
                    this.remDragActiveClass(this.$dropzone)
                  }
                }
                this.$dropzone = $t
                this.addDragActiveClass($t)
              }
            }
            _.addDragActiveClass = function ($t) {
              $t.addClass('drag-active')
            }
            _.remDragActiveClass = function ($t) {
              if ($t) {
                $t.removeClass('drag-active')
              }
            }
            _._dragleave = function (e) {
              if (!_.dragActive || !_.enteredTarget) {
                return true
              }
              if (_.enteredTarget === e.target) {
                _.enteredTarget = null
              }
              return true
              if (e.target.contains(_.$dragMirror[0])) {
                _._leave()
                return true
              }
              _._checkForLeave(e)
              return true
            }
          },
          _checkForLeave: function (e) {
            if (this.outOfMovingZone) {
              return false
            }
            this.dzRect = this.$dz[0].getBoundingClientRect()
            if (this._isInsideForm()) {
              return false
            }
            this._leave()
            return true
          },
          _leave: function () {
            if (this.outOfMovingZone) {
              return
            }
            this.outOfMovingZone = true
            if (this.$dropzone) {
              this.remDragActiveClass(this.$dropzone)
            }
            this.$dropzone = null
            // this.remDragActiveClass(this.$dz)
            this.$dragMirror.detach()
            this.$copyCompHolder.append(this.$dragMirror)
            this.ws.checkFormChilds()
            this.updateCoords()
          },
          _isInsideDropzone: function () {
            if (this.$dropzone && this.$dropzone.length) {
              return this._isInsideOf(this.$dropzone[0].getBoundingClientRect())
            }
            return false
          },
          _isInsideForm: function () {
            if (!this.dzRect) {
              this.dzRect = this.$dz[0].getBoundingClientRect()
            }
            return this._isInsideOf(this.dzRect)
          },
          _isInsideOf: function (r) {
            return this.mousePos.y > r.top && this.mousePos.y < r.bottom && this.mousePos.x > r.left && this.mousePos.x < r.right
          },
          dragCompPos: {},
          $dragComp: null,
          $element: null
        }
        this.dragAndDropManager.init()
      }
    }
    this.updateDfsId = function (oldId, newId) {
      var visibleFbComp = this.body.find(".fb-component[data-dfsId='" + oldId + "']")
      visibleFbComp.attr('data-dfsId', newId)
      this.updateMetaData(this.components[visibleFbComp.attr('id')], { compId: newId })
    }
    this.componentChanged = function (dfsId, component) {
      var _ = this
      _.body.find('.fb-component[data-dfsId="' + dfsId + '"]').each(function (e) {
        _.updateComponentWithSettingsMerge($(this), dfsId, component)
      })
    }
    this.reAssignComponent = function (workspaceCompEl, dfsId) {
      workspaceCompEl.attr('data-dfsId', dfsId)
      this.updateComponentWithSettingsMerge(workspaceCompEl, dfsId, this.fb.componentsTab.getComponentById(dfsId))
    }
    this.updateComponentWithSettingsMerge = function (workspaceCompEl, dfsId, component) {
      var compId = workspaceCompEl.attr('id')
      this.fb.settingsTab.currentCompId({ release: true })// to ensure the settings on the ui are created fresh
      var newSettings = this.fb.deepCopySettings(component.settings, this.components[compId])
      this.body.find('.fb-component.selected').removeClass('selected')
      this.updateComponent(compId, newSettings)
    }
    this.updateComponent = function (compId, componentSettings, doneCallback) {
      var workspace = this
      var replaceEl = workspace.form.find('#' + compId)
      var dfsId = replaceEl.attr('data-dfsId')
      try {
        var template = workspace.fb.componentsTab.getTemplateById(dfsId)
        if (compId && template && componentSettings) {
          workspace.components[compId] = componentSettings
          workspace.fb.translateSettingsAndCompileTemplate(dfsId, template, componentSettings, function (compiledComp) {
            workspace.fb.htmlRenderer(compiledComp, componentSettings, function (renderedData) {
              workspace.updateMetaData(workspace.components[compId], {
                compId: dfsId,
                order: replaceEl.index()
              }, true)
              workspace.wsSettingsChanged()
              var newEl = $(renderedData)
              newEl.attr('id', compId)
              newEl.attr('data-dfsId', dfsId)
              newEl.addClass('fb-component')
              // newEl.addClass("row");
              newEl.addClass('selected')
              workspace.beforeInserting(newEl, workspace.form)
              var formBuilder = workspace.fb
  
              newEl[0].addEventListener('click', function (e) {
                return formBuilder.workspace.selectComponent(e, $(this))
              }, false)
              newEl.find('.fb-component').each(function () {
                this.addEventListener('click', function (e) {
                  return formBuilder.workspace.selectComponent(e, $(this))
                }, false)
              })
  
              replaceEl.replaceWith(newEl)
              var p = newEl.nextParentWithClass('fbc-grp')
              if (p && p.length) {
                newEl.data('lastFbcGrpIndex', p.attr('data-index'))
              }
              workspace.afterInserting(newEl, workspace.form)
              if ($.isFunction(doneCallback)) {
                try {
                  doneCallback()
                } catch (er) {
                  console.log(er)
                }
              }
            })
          })
        } else {
          this.fb.settingsTab.uiNotification({
            status: 'warning',
            message: 'Cannot render without the corresponding component!'
          })
          replaceEl.addClass('no-comp-ref')
        }
      } catch (ee) {
        this.fb.settingsTab.uiNotification({
          status: 'warning',
          message: 'Cannot render without the corresponding component!'
        })
        console.log(ee)
        /* maybe an old element in the workspace, reference to the components lost */
        /* mark it so the user knows the settings couldn't be updated */
        replaceEl.addClass('no-comp-ref')
      }
    }
    this.addComponent = function (jqEl, isNew, index) {
      var compId = jqEl.attr('id'); var dfsId = jqEl.attr('data-dfsId')
      var p = jqEl.nextParentWithClass('fbc-grp')
      if (p && p.length) {
        jqEl.data('lastFbcGrpIndex', p.attr('data-index'))
      }
      if (isNaN(index)) {
        index = jqEl.index()
      }
      if (!isNew && compId && compId.length > 5) {
        this.updateMetaData(this.components[compId], { compId: dfsId, order: index }, true)
        return
      }
      if (!compId || compId.length < 5) {
        compId = this.fb.randomId()
        jqEl.attr('id', compId)
      }
  
      var formBuilder = this.fb
      if (!this.components[compId]) {
        this.components[compId] = formBuilder.deepCopySettings(formBuilder.componentsTab.getSettingsById(dfsId))
      }
      jqEl.off('click')
      jqEl[0].addEventListener('click', function (e) {
        return formBuilder.workspace.selectComponent(e, $(this))
      }, false)
      jqEl.find('.fb-component').each(function () {
        $(this).off('click')
        this.addEventListener('click', function (e) {
          return formBuilder.workspace.selectComponent(e, $(this))
        }, false)
      })
  
      this.updateMetaData(this.components[compId], { compId: dfsId, order: index }, true)
      this.beforeInserting(jqEl, this.form)
      this.afterInserting(jqEl, this.form)
    }
    this.removeComponent = function (jqEl, $parent) {
      var compId = jqEl.attr('id')
      if (compId) {
        var parent
        if ($parent && $parent.length && $parent.attr('id') && $parent.hasClass('fbc-grp-parent')) {
          parent = this.components[$parent.attr('id')]
        }
        this.removeCompAndRefs(compId, this.components[compId], parent)
        this.actionManager.remove(compId)
        delete this.components[compId]
        this.updateMetaData(null, null, true)
      }
      this.fb.settingsTab.componentRemoved(compId)
    }
    this.removeImport = function (importCompId, comp) {
      var compMain = this.fb.compiler.getCompMainObject(comp)
      if (compMain && compMain['_import']) {
        var imports = compMain['_import']
        for (var k in imports) {
          if (imports.hasOwnProperty(k)) {
            var importsArray = imports[k]
            if (importsArray && importsArray.length) {
              for (var i = 0; i < importsArray.length; ++i) {
                if (importsArray[i] === importCompId) {
                  importsArray.splice(i, 1)
                  break
                }
              }
              if (importsArray.length === 0) {
                delete imports[k]
              }
            }
          }
        }
      }
    }
    this.removeCompAndRefs = function (thisCompId, compToRemove, parent) {
      if (compToRemove) {
        if (parent) {
          this.removeImport(thisCompId, parent)
        }
        var compMain = this.fb.compiler.getCompMainObject(compToRemove)
        if (compMain && compMain['_import']) {
          var imports = compMain['_import']
          for (var k in imports) {
            if (imports.hasOwnProperty(k)) {
              var importsArray = imports[k]
              if (importsArray && importsArray.length) {
                for (var i = 0; i < importsArray.length; ++i) {
                  var childComp = this.components[importsArray[i]]
                  if (childComp) {
                    var childCompMain = this.fb.compiler.getCompMainObject(childComp)
                    if (childCompMain && childCompMain['_import']) {
                      this.removeCompAndRefs(importsArray[i], this.components[importsArray[i]])
                    }
                    this.actionManager.remove(importsArray[i])
                    delete this.components[importsArray[i]]
                  }
                }
              }
            }
          }
        }
      }
    }
    this.selectComponent = function (event, jqEl, withoutFocus) {
      if (!event || jqEl[0] === event.target || jqEl[0] === $(event.target).nextParentWithClass('fb-component')[0]) {
        var compId = jqEl.attr('id')
        this.selected = compId
        this.highlightComponent(compId)
        this.fb.settingsTab.editSettings(compId, this.components[compId], withoutFocus)
      }
      return true
    }
    this.highlightComponent = function (compId) {
      if (compId) {
        this.form.find('.fb-component').removeClass('selected')
        this.form.find('#' + compId).addClass('selected')
        if (this.isInTestMode) {
          this.testBody.find('.fb-component').removeClass('selected')
          this.testBody.find('#' + compId).addClass('selected')
        }
      }
    }
    this.unHighlightComponent = function (compId) {
      if (compId) {
        this.form.find('#' + compId).removeClass('selected')
        if (this.isInTestMode) {
          this.testBody.find('#' + compId).removeClass('selected')
        }
        this.selected = null
      }
    }
    this.onCopyComponent = function (jqEl, copyToComp) {
      if (copyToComp) {
        try {
          var templateCopy = this.fb.componentsTab.getTemplateById(jqEl.attr('data-dfsId'))
          var oldId = jqEl.attr('id')
          var newId = this.fb.randomId()
          var currentSettingsCopy = this.fb.deepCopySettings(this.components[oldId])
          this.fb.componentsTab.addComponent(newId, {
            template: templateCopy,
            settings: currentSettingsCopy
          })
        } catch (tryToFindTheTemplate) {
          this.fb.settingsTab.uiNotification({
            status: 'warning',
            message: 'Cannot render without the corresponding component!'
          })
          jqEl.addClass('no-comp-ref')
        }
      }
    }
    this.onWSCopyComponent = function () {
      if (this.selected) {
        var comp = this.components[this.selected]
        var mainComp = fb.compiler.getCompMainObject(comp)
        if (!mainComp['_import']) {
          localStorage.setItem('ws-clipboard', JSON.stringify(comp))
          return true
        }
      }
      return false
    }
    this.onWSPasteComponent = function () {
      var pastedCompStr = localStorage.getItem('ws-clipboard')
      var success = false
      if (this.selected && pastedCompStr) {
        try {
          var pastedCompJson = JSON.parse(pastedCompStr)
          var compMain = this.fb.compiler.getCompMainObject(pastedCompJson)
          var dfsId = compMain['_compId']
          var template = this.fb.componentsTab.getTemplateById(dfsId)
          if (dfsId && template) {
            var component = { template: template, settings: pastedCompJson }
            var _ = this
            success = true
            this.fb.componentsTab.componentTojqElement(dfsId, component, function (newJqEl) {
              var newCompId = _.fb.randomId()
              _.components[newCompId] = pastedCompJson
              newJqEl.attr('id', newCompId)
              _.beforeInserting(newJqEl, _.form)
              var jqEl
              if (_.selected) {
                jqEl = _.form.find('#' + _.selected)
              }
              if (jqEl && jqEl.length) {
                jqEl.after(newJqEl)
                var p = newJqEl.nextParentWithClass('fbc-grp')
                if (p && p.length) {
                  newJqEl.data('lastFbcGrpIndex', p.attr('data-index'))
                }
                _.dragAndDropManager._setupGrpCompConnection(newJqEl, _.fb.getCompParentOf(newJqEl))
              } else {
                _.form.prepend(newJqEl)
              }
  
              newJqEl[0].addEventListener('click', function (e) {
                return _.selectComponent(e, $(this))
              }, false)
              newJqEl.find('.fb-component').each(function () {
                this.addEventListener('click', function (e) {
                  return _.selectComponent(e, $(this))
                }, false)
              })
              _.updateMetaData(pastedCompJson, { compId: dfsId }, true)
              _.afterInserting(newJqEl, _.form)
              _.actionManager.mayShow(_.body)
            })
          }
        } catch (tryToFindTheTemplate) {
          if (this.selected) {
            this.form.find('#' + this.selected).addClass('no-comp-ref')
          }
        }
      }
      return success
    }
    this.onDeleteComponent = function ($target) {
      var $oldParent = this.fb.getCompParentOf($target)
      this.removeComponent($target.detach(), $oldParent)
      $target.remove()
    }
    this.storeComponents = function () {
      if (this.sizeOf(this.components) === 0) {
        return null
      }
      var formJsonSrc = JSON.stringify(this.components)
      return {
        formSrc: this.fb.compiler.getConvertToNewestFormStructure(JSON.parse(formJsonSrc))
      }
    }
    this.beforeStoring = function (target) {
      target.find('[fb_name]').each(function () {
        var t = $(this)
        t.off()
        t.renameAttr('fb_name', 'name')
      })
    }
    this.beforeInserting = function (newEl, target) {
      if (!newEl || !newEl.length) {
        newEl = target
      }
      newEl.find('[name]').renameAttr('name', 'fb_name')
    }
    this.afterInserting = function (newEl) {
      this.dragAndDropManager.attachDragEvent(newEl)
      this.setStuffWeDontNeedToStore(newEl)
    }
    this.setStuffWeDontNeedToStore = function (target) {
      if (!target || !target.length) {
        return
      }
      try {
        this.actionManager.init(target)
      } catch (e) {
        console.error(e)
      }
    }
    this.removeStuffWeDontNeedToStore = function (target) {
      target.find('.fb-component.selected').removeClass('selected')
      target.find('.fb-component .fb-ws-only').remove()
      target.removeClass('fbc-dz')
      $('.hcbuild-main').find('.fbc-copy-holder').remove()
      target.find('.fbc-dz').removeClass('fbc-dz')
      target.find('.gu-transit').removeClass('gu-transit')
      target.find('.fb-component.context-menu-active').removeClass('context-menu-active')
      // sync json with html
      var compSettingsSize = this.sizeOf(this.components)
      var htmlCompSize = target.find('.fb-component').length
      if (compSettingsSize !== htmlCompSize) {
        var htmlComps = {}
        target.find('.fb-component').each(function () {
          htmlComps[this.id] = true
        })
        var key
        for (key in this.components) {
          if (this.components.hasOwnProperty(key)) {
            if (!htmlComps[key]) {
              delete this.components[key]
            }
          }
        }
      }
      // remove fbonly data
      this.fb.compiler.deepLoopOverJson(this.components, {
        'string': function (value, keyOrIndex, obj) {
          if (/^_fbonly_.*$/.test(keyOrIndex)) {
            delete obj[keyOrIndex]
            return true
          }
          return true
        }
      })
    }
    this.connectionManager = {
      ws: this,
      fb: null,
      $connectionLayer: null,
      enabled: true,
      comConEnabled: false,
      settingsConEnabled: true,
      hidden: false,
      setup: function (fb) {
        this.fb = fb
        this.$connectionLayer = this.fb.el.find('.connectionLayer')
        if (this.enabled) {
          this.show()
        } else {
          this.hide()
        }
      },
      hide: function () {
        if (!this.hidden) {
          this.hidden = true
          this.ws.fb.el.removeClass('cm-active')
        }
      },
      show: function (update) {
        if (this.enabled) {
          if (update) {
            this.update()
          }
          this.ws.fb.el.addClass('cm-active')
          this.hidden = false
          this.cleaned = false
        }
      },
      enable: function (enable) {
        if (enable) {
          this.enabled = true
          if (this.comConEnabled) {
            this.addLocalCss()
          }
          this.update()
        } else {
          this.enabled = false
          if (this.comConEnabled) {
            this.clearLocalCss()
          }
          this.$connectionLayer.find('svg.connections').empty()
        }
      },
      update: function (tfbcomp, reconstructed) {
        if (!this.enabled) {
          return
        }
        this.hidden = false
        var targetBody = this.ws.getActiveBody()
        var _ = this
        _.$connectionLayer.find('svg.connections').empty()
        _.$connectionLayer.find('svg.am-connections').empty()
        if (_.comConEnabled && _.fb.componentsTab.tabActive) {
          var connections = []
          targetBody.find('.fb-component').each(function () {
            var t = $(this)
            var id = t.attr('data-dfsid')
            var c = '.hcbuild-main .fb-workspace .fb-component[data-dfsid="' + id + '"] {' +
                          'border-right: 2px solid ' + _.getRandomColor(id) + ';' +
                          '}'
            _.addLocalCss(c)
            c = '.hcbuild-main .htmlComponents .fb-component[data-dfsid="' + id + '"]{' +
                          'border-left: 2px solid ' + _.getRandomColor(id) + ';' +
                          '}'
            _.addLocalCss(c)
            var startId
            t = t.findVisibleInputOrRefElement()
            startId = t.attr('id')
            if (!startId) {
              startId = _.randomId()
              t.attr('id', startId)
            }
            var newPath = {
              offset: _.getRandomLineOffsetFor(id),
              orientation: 'vertical',
              stroke: _.getRandomColor(id),
              strokeWidth: 2,
              start: '#' + startId,
              end: ".hcbuild-comp-body .fb-component[data-dfsid='" + id + "']"
            }
            if (tfbcomp && tfbcomp[0] == t[0]) {
              newPath['animate'] = true
            }
            connections.push(newPath)
          })
          if (connections.length > 0) {
            _.$connectionLayer.find('svg.connections').HTMLSVGconnect({
              paths: connections
            })
          }
        } else if (_.settingsConEnabled && _.fb.settingsTab.tabActive) {
          if (_.comConEnabled) {
            _.clearLocalCss()
          }
          _.fb.settingsTab.connectionsWereActive = true
          return
        }
        _.fb.settingsTab.connectionsWereActive = false
      },
      cleaned: false,
      empty: function () {
        if (!this.cleaned) {
          this.nameConnections = []
          this.nameConExists = {}
          this.cleaned = true
          this.$connectionLayer.find('svg.am-connections').empty()
          this.$connectionLayer.find('svg.connections').empty()
        }
      },
      showAction: function ($arrayItem, uipp, destCompId) {
        if ($arrayItem.length) {
          this.cleaned = false
          this.$connectionLayer.find('svg.am-connections').empty()
          var connections = []
          var endId = $arrayItem.attrID()
          if (uipp) {
            var $uipp = this.ws.el.find(".wsbody [uipp='" + uipp + "']")
            if ($uipp.length) {
              // connection from src input to src settings
              var newPath = {
                animate: '0.4s',
                offset: 24,
                orientation: 'vertical',
                stroke: '#1e00ff',
                strokeWidth: 1,
                start: '#' + $uipp.attrID(),
                end: '.hcbuilder-settings-body #' + endId
              }
              connections.push(newPath)
            }
          }
          if (destCompId) {
            // connection from dest comp to src settings
            newPath = {
              animate: '0.4s',
              offset: 14,
              orientation: 'vertical',
              stroke: '#af36d2',
              strokeWidth: 1,
              start: '#' + destCompId,
              end: '.hcbuilder-settings-body #' + endId
            }
            connections.push(newPath)
          }
          if (connections.length) {
            this.$connectionLayer.find('svg.am-connections').HTMLSVGconnect({
              paths: connections
            })
          }
        }
      },
      hideAction: function ($arrayItem, uipp, destCompId) {
  
      },
      nameConnections: [],
      nameConExists: {},
      showName: function (connection) {
        if (!this.nameConExists[connection.start + connection.end]) {
          this.nameConnections.push(connection)
          this.nameConExists[connection.start + connection.end] = true
        }
        this.$connectionLayer.find('svg.connections').empty()
        if (this.nameConnections.length > 0) {
          this.cleaned = false
          this.$connectionLayer.find('svg.connections').HTMLSVGconnect({
            paths: this.nameConnections
          })
        }
      },
      getDraglineSvg: function () {
        return this.$connectionLayer.find('svg.dragline')
      },
      localCssMap: {},
      addLocalCss: function (css) {
        if (!this.localCssEl) {
          var c = ''
          c = '.hcbuild-main .fb-workspace .fb-component {' +
                      'border-right: 2px solid #c3c3c3;' +
                      '}'
          this.localCssMap[c] = 1
          c = '.hcbuild-main .htmlComponents  .fb-component {' +
                      'border-left: 2px solid #c3c3c3;' +
                      '}'
          this.localCssMap[c] = 1
          c = '.hcbuild-main .am-endpoint-main>i {' +
                      'border-right: none !important;' +
                      '}'
          this.localCssMap[c] = 1
          this.localCssEl = $('<style type="text/css"></style>')
          this.fb.el.append(this.localCssEl)
        }
        if (css) {
          this.localCssMap[css] = 1
        }
        var allCss = ''; var key
        for (key in this.localCssMap) {
          if (this.localCssMap.hasOwnProperty(key)) {
            allCss += key
          }
        }
        this.localCssEl.html(allCss)
      },
      clearLocalCss: function (css) {
        if (this.localCssEl && this.localCssEl.length) {
          this.localCssEl.empty()
        }
      },
      colorSet: [
        '#00ffff',
        '#0000ff',
        '#a52a2a',
        '#00ffff',
        '#00008b',
        '#008b8b',
        '#bdb76b',
        '#8b008b',
        '#556b2f',
        '#ff8c00',
        '#8b0000',
        '#e9967a',
        '#9400d3',
        '#ff00ff',
        '#ffd700',
        '#008000',
        '#4b0082',
        '#add8e6',
        '#90ee90',
        '#ffb6c1',
        '#00ff00',
        '#ff00ff',
        '#800000',
        '#000080',
        '#808000',
        '#ffa500',
        '#ffc0cb',
        '#800080'
      ],
      _randomColor: {},
      _colorAlreadySet: {},
      getRandomColor: function (id) {
        if (!this._randomColor[id]) {
          var tryCount = 6; var i = 0; var color
          for (; i < tryCount; ++i) {
            color = this.colorSet[this.fb.randomIntBetween(0, this.colorSet.length - 1)]
            if (!this._colorAlreadySet[color]) {
              this._colorAlreadySet[color] = 1
              return this._randomColor[id] = color
            }
          }
          return this._randomColor[id] = color
        }
        return this._randomColor[id]
      },
      getRandomLineOffsetForMap: {},
      getRandomLineOffsetForMapNr: {},
      getRandomLineOffsetFor: function (id) {
        if (!this.getRandomLineOffsetForMap[id]) {
          var newInt = this.fb.randomIntBetween(0, 20)
          for (var i = 0; i < 4; ++i) {
            if (!this.getRandomLineOffsetForMapNr[newInt]) {
              this.getRandomLineOffsetForMap[id] = newInt
              this.getRandomLineOffsetForMapNr[newInt] = 1
              return this.getRandomLineOffsetForMap[id]
            }
            newInt = this.fb.randomIntBetween(0, 20)
          }
          this.getRandomLineOffsetForMap[id] = newInt
        }
        return this.getRandomLineOffsetForMap[id]
      }
    }// end of connectionManager
    /**
       "action":{
               "source":[{"_destComp":"", "_index":"", "regex":"regex"}],
               "destination":{
                    "transition":{
                        "all": [
                            "fade"
                        ],
                        "selected": 0
                    }
               }
           }
       **/
    var _ = this.actionManager = {
      ws: this,
      $pointLayer: null,
      $draglineSvg: null,
      lastStateEnabled: false,
      drawedConnections: {},
      transition: {
        'all': [
          'none',
          'slide',
          'fade'
  
        ],
        'selected': 0
      },
      firstTime: true,
      enable: function (enable) {
        if (this.firstTime) {
          this._setup()
          this.firstTime = false
        }
        if (enable === undefined) {
          enable = this.lastStateEnabled
        }
        var $switch = this.ws.el.find('.ws-mode.ws-action')
        $switch.removeClass('disabled').find('input').prop('disabled', false).prop('checked', enable)
        if (enable) {
          this.mayShow(this.ws.form)
        } else {
          this.disable()
        }
      },
      disable: function () {
        if (this.firstTime) {
          this._setup()
          this.firstTime = false
        }
        var $switch = this.ws.el.find('.ws-mode.ws-action')
        if (this.ws.isInTestMode) {
          $switch.addClass('disabled').find('input').prop('disabled', true)
        }
        $switch.find('input').prop('checked', false)
        this.hide()
      },
      hide: function () {
        if (this.firstTime) {
          this._setup()
          this.firstTime = false
        }
        this.ws.fb.el.removeClass('am-active')
      },
      mayShow: function ($target, forceInit) {
        if (!this.lastStateEnabled && forceInit) {
          this.init($target)
        }
        if (this.lastStateEnabled) {
          this.init($target)
          this.show($target)
        }
      },
      show: function ($target) {
        var _ = this
        setTimeout(function () {
          _.ws.fb.el.addClass('am-active')
        }, 0)
      },
      init: function ($target) {
        if (this.firstTime) {
          this._setup()
          this.firstTime = false
        }
        if ($target) {
          this._drawPointerAndLines($target)
          this._checkDrawedConnections()
        }
      },
      _setup: function () {
        this.$pointLayer = this.ws.fb.el.find('.fb-workspace .am-point-layer')
        this.$draglineSvg = this.ws.connectionManager.getDraglineSvg()
        this._initDropzone()
        this.$pointLayer.off()
        this.$pointLayer.on({
          mouseenter: function () {
            $(this).data('line').attr('class', 'hover')
          },
          mouseleave: function () {
            var t = $(this)
            if (!t.data('dragging')) {
              t.data('line').removeAttr('class')
            }
          }
        }, 'i.am-pointer.connected')
  
        this.$pointLayer.on({
          mouseenter: function () {
            var lines = $(this).data('lines')
            for (var l = 0; l < lines.length; ++l) {
              $(lines[l]).attr('class', 'hover')
            }
          },
          mouseleave: function () {
            var lines = $(this).data('lines')
            for (var l = 0; l < lines.length; ++l) {
              if (!$(lines[l]).data('dragging')) {
                $(lines[l]).removeAttr('class')
              }
            }
          }
        }, 'o.am-overlay.connected')
      },
      /*
           @return: true=connection accepted, false=rejected
           */
      onActionConnected: function (data) {
        var srcComp = this.ws.components[data.srcCompId]
        var srcCompFieldObj = this.ws.fb.compiler.getCompFieldObjectByName(srcComp, data.name)
        if (!srcCompFieldObj.action) {
          srcCompFieldObj.action = { source: [data.source] }
        } else {
          if (!$.isArray(srcCompFieldObj.action['source'])) {
            srcCompFieldObj.action['source'] = []
          }
          var sourceAlreadyExists = this._getSourceItemFromComp(srcCompFieldObj, data.source['_index'], data.source['_destCompId'])
          if (sourceAlreadyExists) {
            return false
          } else {
            srcCompFieldObj.action['source'].push(data.source)
          }
        }
        var destComp = this.ws.components[data.source._destCompId]
        var destCompFieldObj = this.ws.fb.compiler.getCompMainObject(destComp)
        if (!destCompFieldObj.action) {
          destCompFieldObj.action = { 'destination': { 'transition': this.transition } }
        } else {
          if (!destCompFieldObj.action['destination'] || !destCompFieldObj.action['destination']['transition']) {
            destCompFieldObj.action['destination'] = { 'transition': this.transition }
          }
        }
        var settignsCompId = this.ws.fb.settingsTab.currentCompId()
        try {
          if (settignsCompId === data.srcCompId) {
            this.ws.fb.settingsTab.updateSettings(settignsCompId, srcComp)
          } else if (settignsCompId === data.source._destCompId) {
            this.ws.fb.settingsTab.updateSettings(settignsCompId, destComp)
          }
        } catch (e) {
          console.log(e)
        }
        return true
      },
  
      /*
          @return: true=has more destinations, false=was the last
           */
      onActionReleased: function (data) {
        data.destCounter = 0
        var destCompId = data.source._destCompId
        this.ws.fb.compiler.compsLoop(this.ws.components, function (cmpId, cmp, subComp) {
          if (subComp && subComp.action && subComp.action.source) {
            var sources = subComp.action.source
            if (sources.length) {
              for (var ss = 0; ss < sources.length; ++ss) {
                if (sources[ss]['_destCompId'] === destCompId) {
                  data.destCounter++
                  if (data.destCounter > 1) {
                    return false
                  }
                  return true
                }
              }
            }
          }
          return true
        })
  
        if (data.destCounter === 1) {
          var destComp = this.ws.components[data.source._destCompId]
          var destCompFieldObj = this.ws.fb.compiler.getCompMainObject(destComp)
          if (destCompFieldObj['action']) {
            this.ws.fb.compiler.cleanActionDst(destCompFieldObj)
          }
        }
        var srcComp = this.ws.components[data.srcCompId]
        var srcCompFieldObj = this.ws.fb.compiler.getCompFieldObjectByName(srcComp, data.name)
        if (srcCompFieldObj['action']) {
          if (srcCompFieldObj['action']['source']) {
            var sources = srcCompFieldObj['action']['source']
            for (var d = 0; d < sources.length; ++d) {
              if (sources[d]['_index'] === data.source['_index'] && sources[d]['_destCompId'] === data.source['_destCompId']) {
                sources.splice(d, 1)
              }
            }
            this.ws.fb.compiler.cleanActionSrc(srcCompFieldObj)
          }
        }
        var settignsCompId = this.ws.fb.settingsTab.currentCompId()
        if (settignsCompId === data.srcCompId) {
          this.ws.fb.settingsTab.updateSettings(settignsCompId, srcComp)
        } else if (settignsCompId === destCompId) {
          this.ws.fb.settingsTab.updateSettings(settignsCompId, destComp)
        }
        return data.destCounter > 1
      },
      _drawPointerAndLines: function ($target) {
        var _ = this; var key
        if ($target.hasClass('fb-component')) {
          this.update($target.nextAll('.fb-component').addBack())
        } else {
          if (this.ws.components) {
            this._markForRemove()
            for (key in _.ws.components) {
              if (_.ws.components.hasOwnProperty(key)) {
                _._drawPointerAndLinesOf(key, _.ws.components[key])
              }
            }
            this._removeMarkedOnes()
          } else {
            this.$pointLayer.empty()
            this.$draglineSvg.empty()
          }
        }
      },
      update: function ($fbComps) {
        if ($fbComps && $fbComps.length) {
          var $target, i2, $childComps, $t
          for (var i = 0; i < $fbComps.length; ++i) {
            $target = $($fbComps[i])
            $childComps = $target.find('.fb-component')
            for (i2 = 0; i2 < $childComps.length; ++i2) {
              $t = $($childComps[i2])
              this._update($t, $t.attr('id'))
            }
            this._update($target, $target.attr('id'))
          }
          this._checkDrawedConnections()
        }
      },
      _update: function ($target, key) {
        this._markForRemove(key)
        var comp = this.ws.components[key]
        this._drawPointerAndLinesOf(key, comp)
        this._removeMarkedOnes()
      },
      remove: function (compId) {
        if (compId) {
          this.ws.fb.compiler.compLoop(this.ws.components[compId], function (mainComp, subComp) {
            if (subComp && subComp.action) {
              delete subComp.action
            }
          })
          this.mayShow(this.ws.body)
        }
      },
      _checkDrawedConnections: function () {
        var compId = this.ws.fb.settingsTab.currentCompId()
        if (compId && this.drawedConnections[compId]) {
          this.ws.fb.settingsTab.updateSettings(compId, this.ws.components[compId])
        }
        this.drawedConnections = {}
      },
  
      _markForRemove: function (compId) {
        if (compId) {
          var _ = this
          this.$pointLayer.children('i[compRef="' + compId + '"]').each(function () {
            var t = $(this)
            t.data('line').addClass('am-remove')
            t.data('srcOverlay').addClass('am-remove')
            t.addClass('am-remove')
          })
        } else {
          this.$pointLayer.children().each(function () {
            var t = $(this)
            var tagName = this.tagName.toUpperCase()
            if (tagName === 'I') {
              t.data('line').addClass('am-remove')
            }
            t.addClass('am-remove')
          })
        }
      },
      _removeMarkedOnes: function () {
        this.$pointLayer.children('.am-remove').each(function () {
          var t = $(this)
          var tagName = this.tagName.toUpperCase()
          if (tagName === 'I') {
            var $line = t.data('line')
            try {
              var lines = t.data('srcOverlay').data('lines')
              for (var l = 0; l < lines.length; ++l) {
                if (lines[l] === $line[0]) {
                  lines.splice(l, 1)
                }
              }
            } catch (e) {
            }
            $line.remove()
          }
          t.remove()
        })
      },
      _drawPointerAndLinesOf: function (compId, comp) {
        if ($.isArray(comp)) {
          for (var i = 0; i < comp.length; ++i) {
            this._eachCompObj(compId, comp[i], comp[0])
          }
        } else {
          this._eachCompObj(compId, comp, comp)
        }
      },
      _eachCompObj: function (compId, comp, compMain) {
        var fbComp, fields
        fbComp = this.ws.form.find('#' + compId)
        this._createEndpointIfNecessary(fbComp)
        if (comp && comp.name) {
          fields = fbComp.find("[fb_name='" + comp.name + "'],[name='" + comp.name + "']")
          for (var b = 0; b < fields.length; ++b) {
            this._eachField(this.ws.fb, $(fields[b]), fbComp, comp, compMain, b, compId)
          }
        }
      },
      _createEndpointIfNecessary: function (fbComp) {
        var endpoint = fbComp.children('.am-endpoint-main').find('.am-endpoint')
        if (!endpoint.length) {
          endpoint = $('<div class="fb-ws-only am-endpoint-main"><i></i><div class="am-endpoint"></div></div>')
          fbComp.prepend(endpoint)
          endpoint = endpoint.find('.am-endpoint')
        }
        return endpoint
      },
      _eachField: function (_, t, fbComp, comp, compMain, _index, compId) {
        var o = {
          $pointer: null,
          pointSelector: null,
          $srcOverlay: null,
          pointerId: null,
          t: t,
          wasConnectedTo: null,
          sourceItem: null,
          comp: comp,
          _index: _index,
          compId: compId
        }
        var sourceItems; var $endpoint; var psel
        psel = "i[compRef='" + compId + "'][_index='" + _index + "'][_name='" + comp.name + "']"
        sourceItems = this._getSourceItemsFromComp(comp, _index)
        var hasSrcConnections = false
        // make src connections
        for (var si = 0; si < sourceItems.length; ++si) {
          o.sourceItem = sourceItems[si]
          if (o.sourceItem && o.sourceItem['_destCompId']) {
            var destComp = _.compiler.getCompMainObject(this.ws.components[o.sourceItem['_destCompId']])
            if (destComp && destComp.action && destComp.action.destination) {
              $endpoint = this._createEndpointIfNecessary(this.ws.form.find('#' + o.sourceItem['_destCompId']))
              if ($endpoint && $endpoint.length) {
                o.pointSelector = psel + "[connectedTo='" + o.sourceItem['_destCompId'] + "']"
                this._getOrCreatePointer(o)
                if (o.sourceItem['_fbonly_uipp'] !== o.pointerId) {
                  o.sourceItem['_fbonly_uipp'] = o.pointerId
                  this.drawedConnections[o.sourceItem['_destCompId']] = 1
                }
                this._drawStartPoint(o.$pointer, o.$srcOverlay)
                this._drawConnected(o.$pointer, $endpoint, true)
                hasSrcConnections = true
              }
            } else {
              this._removeSourceItemFromComp(comp, o.sourceItem)
              this.drawedConnections[compId] = 1
            }
          }
        }
        // make dest visible or cleanup
        if (compMain.action && compMain.action.destination) {
          var hasSourcesConnected = false
          _.compiler.compsLoop(this.ws.components, function (cmpId, cmp, subComp) {
            if (subComp && subComp.action && subComp.action.source) {
              var sources = subComp.action.source
              if (sources.length) {
                for (var ss = 0; ss < sources.length; ++ss) {
                  if (sources[ss]['_destCompId'] === compId) {
                    hasSourcesConnected = true
                    return false
                  }
                }
              }
            }
            return true
          })
          if (hasSourcesConnected) {
            fbComp.find('.am-endpoint-main').addClass('connected-to')
          } else {
            this.drawedConnections[compId] = 1
            this.ws.fb.compiler.cleanActionDst(compMain)
          }
        } else {
          var m = this
          _.compiler.compsLoop(this.ws.components, function (cmpId, cmp, subComp) {
            if (subComp && subComp.action && subComp.action.source) {
              var sources = subComp.action.source
              if (sources.length) {
                for (var ss = 0; ss < sources.length; ++ss) {
                  if (sources[ss]['_destCompId'] === compId) {
                    sources.splice(ss, 1)
                    m.drawedConnections[cmpId] = 1
                    var $connectedPointer = m.$pointLayer.find("i[compRef='" + cmpId + "'][connectedTo='" + compId + "']")
                    if ($connectedPointer.length) {
                      if (!m._removeIfStartPointerExists($connectedPointer)) {
                        m._drawStartPoint($connectedPointer)
                      }
                    }
                    break
                  }
                }
                m.ws.fb.compiler.cleanActionSrc(subComp)
              }
            }
            return true
          })
        }
  
        o.pointSelector = psel + ':not(.connected)'
        if (sourceItems.length === 0) {
          this._getOrCreatePointer(o)
          this._drawStartPoint(o.$pointer, o.$srcOverlay)
        } else {
          t.findVisibleInputOrRefElement()
          if (!t.data('isBool')) {
            // setup not connected pointer for not radios or checkboxes
            this._getOrCreatePointer(o)
            this._drawStartPoint(o.$pointer, o.$srcOverlay)
          }
        }
        if (o.$srcOverlay) {
          if (hasSrcConnections) {
            o.$srcOverlay.addClass('connected')
          } else {
            o.$srcOverlay.removeClass('connected')
          }
        }
      },
      clearDestinations: function ($pointer, $endpoint) {
        var destFbComp = $endpoint.nextParentWithClass('fb-component')
        var ap = {
          name: $pointer.attr('_name'),
          srcCompId: $pointer.attr('compRef'),
          source: {
            '_fbonly_uipp': $pointer.data('srcOverlay').attr('id'),
            '_destCompId': destFbComp.attr('id'),
            '_index': parseInt($pointer.attr('_index'))
          }
        }
        var hasMoreDestinations = this.onActionReleased(ap)
        $pointer.removeClass('connected')
        $pointer.removeAttr('connectedTo')
        if (!hasMoreDestinations) {
          $endpoint.parent().removeClass('connected-to')
        }
      },
      _dragenter: function (e) {
        if (!_.dragActive) {
          return
        }
        _.$dragPointer[0].hidden = true
        let target = document.elementFromPoint(e.clientX, e.clientY)
        _.$dragPointer[0].hidden = false
        let $t = $(target)
        if ($t.hasClass('am-endpoint')) {
          _.$targetEndpoint = $t
          _.intrDz.ondragenter({ target: _.$targetEndpoint[0], relatedTarget: _.$dragPointer[0] })
        }
      },
      _dragleave: function (e) {
        if (!_.dragActive) {
          return
        }
        if (_.$targetEndpoint) {
          _.intrDz.ondragleave({ target: _.$targetEndpoint[0], relatedTarget: _.$dragPointer[0] })
          _.$targetEndpoint = null
        }
      },
      _dropcheck: function () {
        if (_.$targetEndpoint && _.$targetEndpoint.length && _._isInside(_.$targetEndpoint[0].getBoundingClientRect())) {
          _.intrDz.ondrop({ target: _.$targetEndpoint[0], relatedTarget: _.$dragPointer[0] })
        }
      },
      _isInside (r) {
        return r && this.lastY > r.top && this.lastY < r.bottom && this.lastX > r.left && this.lastX < r.right
      },
      _enableDropzoneEntpoints (pointer) {
        var _ = this
        var $endpoints = this.ws.body.find('.fws-main:first')
        $endpoints = $endpoints.find('.am-endpoint')
        $endpoints.each(function () {
          // this.removeEventListener("touchmove", _._dragenter, false);
          this.removeEventListener('mouseover', _._dragenter, false)
          this.removeEventListener('mouseout', _._dragleave, false)
  
          // this.addEventListener("touchmove", _._dragenter, false);
          this.addEventListener('mouseover', _._dragenter, false)
          this.addEventListener('mouseout', _._dragleave, false)
          _.intrDz.ondropactivate({ target: this, relatedTarget: pointer })
        })
      },
      _disableDropzoneEntpoints (pointer) {
        var _ = this
        var $endpoints = this.ws.body.find('.fws-main:first')
        $endpoints = $endpoints.find('.am-endpoint')
        $endpoints.each(function () {
          // this.removeEventListener("touchmove", _._dragenter, false);
          this.removeEventListener('mouseover', _._dragenter, false)
          this.removeEventListener('mouseout', _._dragleave, false)
          _.intrDz.ondropdeactivate({ target: this, relatedTarget: pointer })
        })
      },
      _initDropzone: function () {
        var _ = this
        _.currentScrollX = 0
        _.currentScrollY = 0
        _.lastScrollX = 0
        _.lastScrollY = 0
        var $scr = _.ws.fb.options.scrollableContainer
        if ($scr && $scr.length && !$scr.data('am-init')) {
          _.lastScrollX = $scr.scrollLeft()
          _.lastScrollY = $scr.scrollTop()
          $scr.scroll(function () {
            if (_.dragActive) {
              var scroll = $(this)
              var y = scroll.scrollTop()
              var x = scroll.scrollLeft()
              _.currentScrollX += x - _.lastScrollX
              _.currentScrollY += y - _.lastScrollY
              _.lastScrollX = x
              _.lastScrollY = y
            }
          })
          $scr.data('am-init', true)
        }
  
        _.intrDz = {
          ondropactivate: function (e) {
            var $pointer = $(e.relatedTarget)
            var $endpoint = $(e.target)
            if (_._isConnectionPossible($pointer, $endpoint)) {
              $endpoint.addClass('hcb-changed3')
              $endpoint.parent().addClass('drag-active')
              $endpoint.nextParentWithClass('fbc-dz').addClass('dz-drag-active')
            }
          },
          ondragenter: function (e) {
            var $pointer = $(e.relatedTarget)
            var $endpoint = $(e.target)
            if (_._isConnectionPossible($pointer, $endpoint)) {
              $endpoint.addClass('maybe-connected')
              $endpoint.parent().addClass('maybe-connected-to')
            }
          },
          ondragleave: function (e) {
            var $pointer = $(e.relatedTarget)
            var $endpoint = $(e.target)
            $endpoint.removeClass('maybe-connected')
            $endpoint.parent().removeClass('maybe-connected-to')
            if ($pointer.data('connected')) {
              $pointer.data('connected', false)
              _.clearDestinations($pointer, $endpoint)
            } else {
              if (_._isConnectionPossible($pointer, $endpoint)) {
                $endpoint.addClass('hcb-changed3')
                $endpoint.parent().addClass('drag-active')
                $endpoint.nextParentWithClass('fbc-dz').addClass('dz-drag-active')
              }
            }
          },
          ondrop: function (e) {
            var $pointer = $(e.relatedTarget)
            var $endpoint = $(e.target)
            if (_._isConnectionPossible($pointer, $endpoint)) {
              var destFbComp = $endpoint.nextParentWithClass('fb-component')
              var $src = $pointer.data('valueSrc')
              var conditionVal = $src.val()
              var connectionAccepted = _.onActionConnected({
                name: $pointer.attr('_name'),
                srcCompId: $pointer.attr('compRef'),
                source: {
                  '_fbonly_uipp': $pointer.data('srcOverlay').attr('id'),
                  '_destCompId': destFbComp.attr('id'),
                  '_index': parseInt($pointer.attr('_index')),
                  'comment': '',
                  'regex': conditionVal
                }
              })
              if (connectionAccepted) {
                $endpoint.removeClass('hcb-changed3')
                _._drawConnected($pointer, $endpoint)
                try {
                  if (!$pointer.data('valueSrc').data('isBool')) {
                    // setup not connected pointer for not radios or checkboxes
                    var o = {
                      $pointer: null,
                      pointSelector: null,
                      $srcOverlay: null,
                      pointerId: null,
                      t: null,
                      wasConnectedTo: null,
                      sourceItem: null,
                      comp: null,
                      _index: null,
                      compId: null
                    }
                    o.$srcOverlay = $pointer.data('srcOverlay')
                    o.pointerId = o.$srcOverlay.attr('id')
                    o.t = $pointer.data('valueSrc')
                    o._index = $pointer.attr('_index')
                    o.compId = $pointer.attr('compRef')
                    o.comp = _.ws.fb.compiler.getCompFieldObjectByName(_.ws.components[o.compId], $pointer.attr('_name'))
                    o.pointSelector = "i[compRef='" + o.compId + "'][_index='" + o._index + "'][_name='" + o.comp.name + "']:not(.connected)"
                    _._getOrCreatePointer(o)
                    _._drawStartPoint(o.$pointer, o.$srcOverlay)
                    _.ws.connectionManager.update()
                  }
                } catch (she) {
                  console.log(she)
                }
              } else {
                $endpoint.removeClass('maybe-connected')
                $endpoint.parent().removeClass('maybe-connected-to')
              }
            }
          },
          ondropdeactivate: function (e) {
            var $endpoint = $(e.target)
            $endpoint.removeClass('hcb-changed3')
            $endpoint.parent().removeClass('drag-active')
            $endpoint.nextParentWithClass('fbc-dz').removeClass('dz-drag-active')
          }
        }
      },
      _getOrCreatePointer: function (o) {
        o.$pointer = this.$pointLayer.children(o.pointSelector)
        o.wasConnectedTo = null
        if (o.$pointer.length) {
          o.$pointer.data('line').removeClass('am-remove')
          o.$pointer.removeClass('am-remove')
          o.$srcOverlay = o.$pointer.data('srcOverlay')
          o.$srcOverlay.removeClass('am-remove')
          o.pointerId = o.$srcOverlay.attr('id')
          o.wasConnectedTo = o.$pointer.attr('connectedTo')
          this._updatePointerRefs(o.$pointer, o.pointerId, o.t)
        } else {
          o.pointerId = this.ws.fb.randomId()
          o.$pointer = $('<i id="' + o.pointerId + '" class="am-pointer"></i>')
          this.$pointLayer.append(o.$pointer)
  
          if (!o.$srcOverlay) {
            o.pointerId = this.ws.fb.randomId()
            o.$srcOverlay = $('<o id="' + o.pointerId + '" class="am-overlay"></o>')
            // o.$srcOverlay = $('<o oFor="'+o.pointerId+'" class="am-overlay"></o>');
            o.$srcOverlay.data('lines', [])
            this.$pointLayer.append(o.$srcOverlay)
          }
          o.$pointer.data('srcOverlay', o.$srcOverlay)
  
          o.$pointer.attr('compRef', o.compId)
          o.$pointer.attr('_index', o._index)
          o.$pointer.attr('_name', o.comp.name)
  
          o.pointerId = o.$srcOverlay.attr('id')
          this._updatePointerRefs(o.$pointer, o.pointerId, o.t)
  
          var $line = $(document.createElementNS('http://www.w3.org/2000/svg', 'line'))
          $line.attr('stroke-linecap', 'round')
          o.$pointer.data('line', $line)
          this.$draglineSvg.append($line)
          o.$srcOverlay.data('lines').push($line[0])
  
          var _ = this
          var scr = _.ws.fb.options.scrollableContainer
          var autoScroll
          if (scr && scr.length) {
            autoScroll = {
              container: scr[0]
            }
          }
          interact(o.$pointer[0]).draggable({
            // enable inertial throwing
            inertia: true,
            autoScroll: autoScroll,
            onstart: function (e) {
              _.dragActive = true
              _.currentScrollX = 0
              _.currentScrollY = 0
              _.$dragPointer = $(e.target)
              _.ws.body.find('.fws-main').addClass('drag-started')
              _._enableDropzoneEntpoints(e.target)
              _._drawStartConnection(_.$dragPointer)
              _.lastX = e.clientX
              _.lastY = e.clientY
              _.x = 0
              _.y = 0
              _.$dragPointer.data('srcOverlay').addClass('hcb-grow')
              _.$dragPointer.data('dragging', true)
              _.$dragPointer.data('line').attr('class', 'hover')
              _.$dragPointer.data('line').data('dragging', true)
              _.$targetEndpoint = _.$dragPointer.data('lastEndpoint')
              if (_.$targetEndpoint && _.$targetEndpoint.length) {
                _.wasConnected = true
                _.teRect = _.$targetEndpoint[0].getBoundingClientRect()
              }
            },
            onmove: function (e) {
              _.x += (e.clientX - _.lastX + (_.currentScrollX))
              _.y += (e.clientY - _.lastY + (_.currentScrollY))
              _.lastX = e.clientX
              _.lastY = e.clientY
              _.currentScrollX = 0
              _.currentScrollY = 0
  
              e.target.style.webkitTransform = e.target.style.transform = 'translate(' + _.x + 'px, ' + _.y + 'px)'
  
              _._checkInitialConnection(e)
  
              var $pointer = $(e.target)
              var pos = $pointer.positionOfUnderlying(_.$pointLayer)
              $pointer.data('line').attr('x2', pos.x).attr('y2', pos.y)
              var $endpoint = $pointer.data('lastEndpoint')
              if (!$pointer.data('connected') && $endpoint) {
                $endpoint.addClass('hcb-changed3')
                $endpoint.parent().addClass('drag-active')
                $endpoint.nextParentWithClass('fbc-dz').addClass('dz-drag-active')
                $pointer.data('lastEndpoint', null)
              }
            },
            onend: function (e) {
              _._disableDropzoneEntpoints(e.target)
              _._checkInitialConnection(e)
              _._dropcheck(e)
              var $pointer = $(e.target)
              $pointer.data('srcOverlay').removeClass('hcb-grow')
              $pointer.data('dragging', false)
              try {
                $pointer.data('line').data('dragging', false)
                $pointer.data('line').removeAttr('class')
              } catch (e) {}
              if (!$pointer.data('connected')) {
                // reset
                if (!_._removeIfStartPointerExists($pointer)) {
                  e.target.style.webkitTransform = e.target.style.transform = 'translate(0, 0)'
                  var pos = $pointer.data('src').positionOfUnderlying(_.$pointLayer)
                  $pointer.css({ top: pos.y + 'px', left: pos.x + 'px' })
                  $pointer.data('line').attr('visibility', 'hidden')
                  $pointer.data('lastEndpoint', null)
                }
              }
              _.ws.body.find('.fws-main').removeClass('drag-started')
            }
          })
        }
      },
      _checkInitialConnection: function (e) {
        if (this.wasConnected && !this._isInside(this.teRect)) {
          this._dragleave(e)
          if (!this.$targetEndpoint) {
            this.wasConnected = false
            this.teRect = null
          }
        }
      },
      _removeIfStartPointerExists: function ($pointer) {
        var $otherStartPointer = this.$pointLayer.find("i[compRef='" + $pointer.attr('compRef') + "'][_index='" + $pointer.attr('_index') + "'][_name='" + $pointer.attr('_name') + "']:not(.connected)")
        if ($otherStartPointer.length > 1) {
          $pointer.removeClass('connected')
          $pointer.removeAttr('connectedTo')
          if (this._otherPointersConnected($pointer)) {
            $pointer.data('srcOverlay').addClass('connected')
          } else {
            $pointer.data('srcOverlay').removeClass('connected')
          }
          var $line = $pointer.data('line')
          try {
            var lines = $pointer.data('srcOverlay').data('lines')
            for (var l = 0; l < lines.length; ++l) {
              if (lines[l] === $line[0]) {
                lines.splice(l, 1)
              }
            }
          } catch (e) {
          }
          $line.remove()
          $pointer.remove()
          return true
        }
        $pointer.data('srcOverlay').removeClass('connected')
        return false
      },
      _otherPointersConnected: function ($pointer) {
        var $otherPointersConnected = this.$pointLayer.find("i.connected[compRef='" + $pointer.attr('compRef') + "'][_index='" + $pointer.attr('_index') + "'][_name='" + $pointer.attr('_name') + "']")
        return $otherPointersConnected.length > 0
      },
      _updatePointerRefs: function ($pointer, pId, $t) {
        var $visibleEl = $t.findVisibleInputOrRefElement()
        $visibleEl.attr('uipp', pId)
        $pointer.data('src', $visibleEl)
        $pointer.data('valueSrc', $t)
        try { // for test mode
          var mirrorT = this.ws.testBody.find('#' + $t.attr('id'))
          if (mirrorT.length) {
            mirrorT.findVisibleInputOrRefElement().attr('uipp', pId)
          }
        } catch (eee) {
          console.log(eee)
        }
      },
      _getSourceItemsFromComp: function (comp, index) {
        var sourceItem = []
        if (comp.action && comp.action.source && comp.action.source.length) {
          for (var d = 0; d < comp.action.source.length; ++d) {
            if (comp.action.source[d]['_index'] === index) {
              sourceItem.push(comp.action.source[d])
            }
          }
        }
        return sourceItem
      },
      _getSourceItemFromComp: function (comp, index, compId) {
        if (comp.action && comp.action.source && comp.action.source.length) {
          for (var d = 0; d < comp.action.source.length; ++d) {
            if (comp.action.source[d]['_index'] === index && comp.action.source[d]['_destCompId'] === compId) {
              return comp.action.source[d]
            }
          }
        }
        return null
      },
      _removeSourceItemFromComp: function (comp, srcItem) {
        if (comp.action && comp.action.source && comp.action.source.length) {
          for (var d = 0; d < comp.action.source.length; ++d) {
            if (comp.action.source[d]['_index'] === srcItem['_index'] && comp.action.source[d]['_destCompId'] === srcItem['_destCompId']) {
              comp.action.source.splice(d, 1)
              break
            }
          }
          this.ws.fb.compiler.cleanActionSrc(comp)
        }
      },
      _drawStartPoint: function ($pointer, $srcOverlay) {
        if (!$srcOverlay) {
          $srcOverlay = $pointer.data('srcOverlay')
        }
        $pointer.removeClass('connected')
        var $visibleEl = $pointer.data('src')
        var startPos = $visibleEl.positionOfUnderlying(this.$pointLayer)
        var h2, w2, h, w
        var margin = 6
        h = $visibleEl.height() + margin
        w = $visibleEl.width() + margin
        h2 = h / 2
        w2 = w / 2
  
        $srcOverlay.css({
          top: (startPos.y - h2) + 'px',
          left: (startPos.x - w2) + 'px',
          height: h + 'px',
          width: w + 'px'
        })
        $pointer.css({ top: startPos.y + 'px', left: startPos.x + 'px' })
  
        $pointer.data('line').attr('visibility', 'hidden')
        $pointer.data('connected', false)
      },
      _drawConnected: function ($pointer, $endpoint, start) {
        $endpoint.removeClass('maybe-connected')
        $endpoint.parent().removeClass('maybe-connected-to')
        $endpoint.addClass('connected')
        $endpoint.parent().addClass('connected-to')
        if (start) {
          this._drawStartConnection($pointer, start)
        } else {
          $pointer.data('srcOverlay').addClass('connected')
        }
        var _ = this
        // ensure the render thread is updating the layout first
        setTimeout(function () {
          var pos = $endpoint.positionOfUnderlying(_.$pointLayer)
          $pointer.css({
            top: parseInt(pos.y - $pointer[0].offsetHeight / 2) + 'px',
            left: parseInt(pos.x - $pointer[0].offsetWidth / 2) + 'px'
          })
          pos = $pointer.positionOfUnderlying(_.$pointLayer)
          $pointer.data('line').attr('x2', parseInt(pos.x)).attr('y2', parseInt(pos.y))
        }, 0)
        $pointer[0].style.webkitTransform = $pointer[0].style.transform = 'translate(0, 0)'
        $pointer.data('lastEndpoint', $endpoint)
        $pointer.attr('connectedTo', $endpoint.parent().parent().attr('id'))
        $pointer.data('connected', true)
        $pointer.addClass('connected')
      },
      _drawStartConnection: function ($pointer, start) {
        $pointer.data('srcOverlay').addClass('connected')
        var pos = $pointer.data('src').positionOfUnderlying(this.$pointLayer)
        var updateLine = function () {
          $pointer.data('line').attr('x1', pos.x + $pointer[0].offsetWidth / 2).attr('y1', pos.y + $pointer[0].offsetHeight / 2).attr('visibility', 'visible')
        }
        if ($pointer.width() === 0) {
          // the zero second pause allows the browser to process the rerender event
          setTimeout(updateLine, 0)
        } else {
          updateLine()
          $pointer.data('line').attr('x2', pos.x + 1).attr('y2', pos.y + 1).attr('visibility', 'visible')
        }
      },
      _isConnectionPossible: function ($pointer, $endpoint) {
        // not allowed to connect with itself
        var $endpointComp = $endpoint.parent().parent()
        var destCompId = $endpointComp.attr('id')
        if (destCompId === $pointer.attr('compRef')) {
          return false
        }
        // not allowed to connect with his parent
        var $p = this.ws.fb.getCompParentOf($pointer.data('src'))
        if ($endpointComp[0] === $p[0]) {
          return false
        }
        // not allowed to connect again with this endpoint
        var _index, srcCompId
        _index = parseInt($pointer.attr('_index'))
        srcCompId = $pointer.attr('compRef')
        var srcComp = this.ws.components[srcCompId]
        var srcCompFieldObj = this.ws.fb.compiler.getCompFieldObjectByName(srcComp, $pointer.attr('_name'))
        var sourceAlreadyExists = this._getSourceItemFromComp(srcCompFieldObj, _index, destCompId)
        if (sourceAlreadyExists) {
          return false
        }
        return true
      }
    }// end of actionManager
    this.sizeOf = function (obj) {
      var size = 0; var key
      for (key in obj) {
        if (obj.hasOwnProperty(key)) size++
      }
      return size
    }
    this.getActiveBody = function () {
      if (this.isInTestMode) {
        return this.testBody
      } else {
        return this.body
      }
    }
    this.switchMode = function (testMode) {
      if (testMode) {
        this.fb.el.addClass('fb-test-mode-active')
        this.isInTestMode = true
        this.actionManager.disable()
        this.wsSettingsChanged()
      } else {
        this.fb.el.removeClass('fb-test-mode-active')
        this.isInTestMode = false
        this.testMain.hide()
        this.cleanupTestMode()
        this.body.html(this.form)
        this.formDetached = false
        this.body.parent().show()
        this.connectionManager.update()
        this.actionManager.enable()
      }
    }
    this.cleanupTestMode = function () {
      if (this.testBody && this.testBody.length) {
        this.testBody.find('[name]').each(function () {
          var t = $(this)
          t.off()
          t.remove()
        })
        this.testBody.children('form').remove()
        this.testBody.empty()
      }
    }
    this.wsSettingsChanged = function () {
      if (this.isInTestMode) {
        var _ = this
        this.testBody.removeClass('test-succeeded').removeClass('test-failed')
        var settingsCopy = _.fb.deepCopySettings(_.components)
        _.fb.translateSettings(settingsCopy, null, function (translatedSettings) {
          if (!_.formDetached) {
            _.body.parent().hide()
            _.form = _.body.find('form:first')
            _.form.detach()
            _.formDetached = true
          }
          _.cleanupTestMode()
          try {
            var htmlForm = _.fb.compiler.cForm({
              form: _.fb.compiler.getConvertToNewestFormStructure(translatedSettings)
            })
            var $form = $(htmlForm)
            _.testBody.html($form)
            $form.on('action-animation-started', function () {
              _.connectionManager.hide()
            })
            $form.on('action-animation-ended', function () {
              _.connectionManager.show(true)
            })
            $form.find('.fb-component').each(function () {
              var $t = $(this)
              _.insertHtmlStyleHelpers($t)
              $t.click(function (e) {
                return _.selectComponent(e, $(this), true)
              })
            })
            _.highlightComponent(_.fb.settingsTab.currentCompId())
  
            if (_.fb.options.test && $.isFunction(_.fb.options.test.onActive)) {
              _.fb.options.test.onActive($form, _.fb.compiler.getConvertToNewestFormStructure(_.components))
            }
            _.testMain.show()
          } catch (dontCare) {
            console.log(dontCare)
          }
          _.connectionManager.update()
        })
      }
    }
    this.formSubmitTestEvent = function () {
      try {
        if (fb.options.test && fb.options.test.onSubmit && $.isFunction(fb.options.test.onSubmit)) {
          var theForm = fb.workspace.testBody.children('form')
          fb.options.test.onSubmit(theForm, fb.workspace.components, function (success) {
            if (fb.workspace.lastSubmitTimeoutId) {
              clearTimeout(fb.workspace.lastSubmitTimeoutId)
            }
            fb.workspace.testBody.removeClass('test-succeeded').removeClass('test-failed')
            var removeClassLater = function () {
              fb.workspace.lastSubmitTimeoutId = setTimeout(function () {
                fb.workspace.testBody.removeClass('test-succeeded').removeClass('test-failed')
              }, 2000)
            }
            setTimeout(function () {
              if (success === true) {
                fb.workspace.testBody.addClass('test-succeeded')
                removeClassLater()
              } else if (success === false) {
                fb.workspace.testBody.addClass('test-failed')
                removeClassLater()
              }
            }, 0)
          })
        }
      } catch (e) {
        console.log(e)
      }
    }
    this.formClearDataEvent = function () {
      try {
        fb.options.test.onReset()
      } catch (e) {
        console.log(e)
      }
      fb.workspace.wsSettingsChanged()
    }
    this.cleanElement = function (targetEl) {
      targetEl.removeClass('gu-transit')
      targetEl.removeClass('selected')
      targetEl.find('.fb-ws-only').remove()
      targetEl.removeClass('fbc-dz')
      $('.hcbuild-main').find('.fbc-copy-holder').remove()
      targetEl.find('.fbc-dz').removeClass('fbc-dz')
      targetEl.removeClass('context-menu-active')
    }
    this.clearWorkspace = function () {
      if (this.isInTestMode) {
        this.switchMode(false)
        this.switches.test.prop('checked', false)
      }
      delete this.components
      // try{this.compiledWorkspaceData.remove();this.compiledWorkspaceData = null;}catch(dontCare){this.compiledWorkspaceData = null;}
      this.body.empty()
      this.form = null
    }
    this.fb = null
    this.el = null
    this.components = {}/** {"compId":{..settings..}**/
    this.init(fb, jqEl, comps)
}

export default FT_Workspace