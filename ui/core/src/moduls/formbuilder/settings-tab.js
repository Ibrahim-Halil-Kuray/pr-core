/**
 * SettingsTab
 *
 * This Class is responsible for the modification of the component settings
 */
function FT_SettingsTab(fb, jqEl) {
    this.init = function (fb, jqEl) {
      this.fb = fb
      this.el = jqEl
      this.autoSave = !!fb.options.autoSaveSettings
      this.el.find('.save-btn').click(function () {
        fb.settingsTab.storeSettings()
      })
      this.autoSaveBtn = this.el.find('.auto-save-btn')
      this.autoSaveBtn.prop('checked', this.autoSave)
      this.autoSaveBtn.click(function () {
        fb.settingsTab.autoSave = $(this).is(':checked')
      })
  
      if (this.el.hasClass('hcbuilder-settings-body')) {
        this.body = this.el
      } else {
        this.body = this.el.find('.hcbuilder-settings-body')
      }
    }
    this.fb = null
    this.el = null
    this.templates = {
      settings: {
        label: '<label class="fbs-lbl {{pathClass}}" for="{{id}}">{{varToLabel label}}</label>',
        hiddenField:
              '{{#ifEq type "checkbox"}}' +
              '<input style="display: none;" class="hidden {{pathClass}}" id="{{id}}" type="{{type}}" name="{{path}}" {{#unless typeText}}{{#val}}checked="checked"{{/val}}{{/unless}}  {{#if typeText}}value="{{val}}"{{/if}}>' +
              '{{else}}' +
              '<input style="display: none;" class="hidden {{pathClass}}" id="{{id}}" type="{{type}}" name="{{path}}" {{#unless typeText}}{{#val}}checked="checked"{{/val}}{{/unless}}  {{#if typeText}}value="{{val}}"{{/if}}>' +
              '{{/ifEq}}',
        field:
              '   <table class="hcbuilder-settings-tbl">' +
              '       <tbody><tr>' +
              '           {{#if createI18nEl}}' +
              '           <td class="switch-td">' +
              '               <label class="i18n-toggle">' +
              '                   <input class="i18n-switch" data-targetid="{{id}}" type="checkbox" {{#if i18nChecked}}checked="checked"{{/if}}>' +
              '                   <div class="slider"><span class="i18n-vertical">i18n</span></div>' +
              '               </label>' +
              '           </td>' +
              '           {{/if}}' +
              '           <td>' +
              '               {{#ifEq type "checkbox"}}' +
              '               <label class="switch"><input class="{{pathClass}} {{#if typeText}}form-control{{/if}} {{#if i18nChecked}}i18n-active{{/if}}" id="{{id}}" type="{{type}}" name="{{path}}" {{#unless typeText}}{{#val}}checked="checked"{{/val}}{{/unless}}  {{#if typeText}}value="{{escapeForAttr val}}"{{/if}}> <div class="slider"></div> </label>' +
              '               {{else}}' +
              '               <input class="{{pathClass}} {{#if typeText}}form-control{{/if}} {{#if i18nChecked}}i18n-active{{/if}}" id="{{id}}" type="{{type}}" name="{{path}}" {{#unless typeText}}{{#val}}checked="checked"{{/val}}{{/unless}}  {{#if typeText}}value="{{escapeForAttr val}}"{{/if}}>' +
              '               {{/ifEq}}' +
              '           </td>' +
              '       </tr></tbody>' +
              '   </table>',
        enumField:
              '   <table class="hcbuilder-settings-tbl enum-field">' +
              '       <tbody><tr>' +
              '           <td>' +
              '               {{#each val.all}}' +
              '               <div class="fancy-el fancy-radio float-left">' +
              '                   <input type="radio" {{#ifEq @index @root.val.selected}}checked="checked"{{/ifEq}} id="{{@root.path}}{{@index}}" name="{{@root.path}}.selected" value="{{@index}}" />' +
              '                   <label for="{{@root.path}}{{@index}}"><span><i></i></span><p>{{this}}</p></label>' +
              '               </div>' +
              '               {{/each}}' +
              '               {{#each val.all}}' +
              '                   <input type="hidden" name="{{@root.path}}.all[{{@index}}]" value="{{this}}"/>' +
              '               {{/each}}' +
              '           </td>' +
              '       </tr></tbody>' +
              '   </table>',
        enumFieldSelect:
              '   <table class="hcbuilder-settings-tbl enum-field">' +
              '       <tbody><tr>' +
              '           {{#ifEq label "file"}}<td><table><tr><td>exact</td><td>' +
              '               <label class="switch" style="margin-right: 10px;margin-left: 5px;"><input class="file-exact {{pathClass}}exact " type="checkbox" data-path="{{path}}" data-key="{{key}}" name="{{path}}.exact" {{#if val.exact}}checked="checked"{{/if}}> <div class="slider"></div> </label>' +
              '           </td></tr></table></td>{{/ifEq}}' +
              '           <td>' +
              '               <select class="{{pathClass}}" id="{{id}}" name="{{@root.path}}.selected">' +
              '                   {{#each val.all}}' +
              '                   <option {{#ifEq @index @root.val.selected}}selected="selected"{{/ifEq}} value="{{@index}}">{{this}}</option>' +
              '                   {{/each}}' +
              '               </select>' +
              '               {{#each val.all}}' +
              '                   <input type="hidden" name="{{@root.path}}.all[{{@index}}]" value="{{this}}"/>' +
              '               {{/each}}' +
              '           </td>' +
              '       </tr></tbody>' +
              '   </table>'
      }
    }
    this.templates.startIndention =
          '<div{{#if hidden}} style="display:none;" {{/if}} class="{{pathClass}} relative-parent row {{#if path}}root-row {{/if}}indention{{#if isValidate}} validation-parent{{/if}}">' +
          '   <div class="col-md-{{#if path}}3{{else}}1{{/if}}">' +
          '       {{#if path}}<label class="fbs-lbl {{pathClass}}" name="{{path}}" >{{label}}</label>{{/if}}' +
          '       {{#if isArray}}' +
          '       <button type="button" name="{{path}}" class="array-add btn btn-secondary" >' +
          '           <span class="fa fa-plus" aria-hidden="true"></span>' +
          '       </button>' +
          '       {{/if}}' +
          '   </div>' +
          '   <div class="col-md-{{#if path}}9{{else}}11{{/if}}">' +
          '       <div class="array-childs">'
    this.templates.endIndention =
          '       </div>' +
          '   </div>' +
          '   <button type="button" class="btn btn-danger array-item-del simple-item">' +
          '       <span class="fa fa-minus" aria-hidden="true"></span>' +
          '   </button>' +
          '</div>'
  
    this.templates.enumRowSingle =
          '<div class="{{#if select}}fb-field-group row{{else}}relative-parent fb-field-group row {{#if path}}root-row {{/if}}{{/if}}">' +
          '   {{#if label}}' +
          '   <div class="col-md-{{#ifEq label "file"}}2{{else}}3{{/ifEq}}">' +
          this.templates.settings.label +
          '   </div>' +
          '   {{/if}}' +
          '   <div class="col-md-{{#ifEq label "file"}}6{{else}}{{#if select}}5{{else}}{{#if label}}9{{else}}12{{/if}}{{/if}}{{/ifEq}}">{{#if select}}' +
          this.templates.settings.enumFieldSelect + '{{else}}' + this.templates.settings.enumField +
          '   {{/if}}</div>' +
          '   {{#unless select}}{{#if label}}' +
          '   <button type="button" class="btn btn-danger array-item-del simple-item">' +
          '       <span class="fa fa-minus" aria-hidden="true"></span>' +
          '   </button>' +
          '   {{/if}}{{/unless}}' +
          '</div>'
  
    this.templates.inputRowSingleDate =
          '<div class="fb-field-group row vdf">' +
          '   <div class="col-md-12">' +
          '       <div class="row">' +
          '           <div class="col-md-3">' +
          this.templates.settings.label +
          '           </div>' +
          '           <div class="col-md-{{#if label}}9{{else}}12{{/if}}">' +
          '               <table class="hcbuilder-settings-tbl">' +
          '                   <tbody name="{{path}}"><tr>' +
          '                       <td class="td-min vdf-ext-main vdf-before vdf-inactive">' +
          '                           <table class="vdf-input"><tbody><tr>' +
          '                               <td class="td-min">' +
          '                                   <input class="form-control vdf-date vdf-var" placeholder="now or variable name" type="text" data-dval="undefined" name="{{path}}.before.date" value="{{val.before.date}}"/>' +
          '                                   <span class="{{#if val.before.date}}vdf-true {{/if}}glyphicon glyphicon-calendar" aria-hidden="true"></span>' +
          '                               </td>' +
          '                               <td class="td-min">' +
          '                                   <input class="form-control vdf-pattern" placeholder="dd.MM.yyyy HH:mm:ss" type="text" data-dval="undefined" name="{{path}}.before.pattern" value="{{val.before.pattern}}"/>' +
          '                                   <span class="{{#if val.before.pattern}}vdf-true {{/if}}glyphicon glyphicon-equalizer" aria-hidden="true"></span>' +
          '                               </td>' +
          '                               <td class="td-min">' +
          '                                   <input class="form-control vdf-val" placeholder="01.01.2017 23:59:59" type="text" data-dval="undefined" name="{{path}}.before.val" value="{{val.before.val}}"/>' +
          '                                   <span class="{{#if val.before.val}}vdf-true {{/if}}glyphicon glyphicon-dashboard" aria-hidden="true"></span>' +
          '                               </td>' +
          '                           </tr></tbody></table>' +
          '                           <span class="vdf-ext{{#if val.before}} vdf-true{{/if}} glyphicon glyphicon-step-backward" aria-hidden="true"></span>' +
          '                       </td>' +
          '                       <td>' +
          '                           <input class="form-control" id="{{id}}" placeholder="dd.MM.yyyy HH:mm:ss" type="{{type}}" name="{{path}}.pattern" value="{{val.pattern}}" />' +
          '                       </td>' +
          '                       <td class="td-min vdf-ext-main vdf-after vdf-inactive">' +
          '                           <table class="vdf-input"><tbody><tr>' +
          '                               <td class="td-min">' +
          '                                   <input class="form-control vdf-date vdf-var" placeholder="now or variable name" type="text" data-dval="undefined" name="{{path}}.after.date" value="{{val.after.date}}"/>' +
          '                                   <span class="{{#if val.after.date}}vdf-true {{/if}}glyphicon glyphicon-calendar" aria-hidden="true"></span>' +
          '                               </td>' +
          '                               <td class="td-min">' +
          '                                   <input class="form-control vdf-pattern" placeholder="dd.MM.yyyy HH:mm:ss" type="text" data-dval="undefined" name="{{path}}.after.pattern" value="{{val.after.pattern}}"/>' +
          '                                   <span class="{{#if val.after.pattern}}vdf-true {{/if}}glyphicon glyphicon-equalizer" aria-hidden="true"></span>' +
          '                               </td>' +
          '                               <td class="td-min">' +
          '                                   <input class="form-control vdf-val" placeholder="01.01.2017 23:59:59" type="text" data-dval="undefined" name="{{path}}.after.val" value="{{val.after.val}}"/>' +
          '                                   <span class="{{#if val.after.val}}vdf-true {{/if}}glyphicon glyphicon-dashboard" aria-hidden="true"></span>' +
          '                               </td>' +
          '                           </tr></tbody></table>' +
          '                           <span class="vdf-ext{{#if val.after}} vdf-true{{/if}} glyphicon glyphicon-step-forward" aria-hidden="true"></span>' +
          '                       </td>' +
          '                   </tr></tbody>' +
          '               </table>' +
          '           </div>' +
          '       </div>' +
          '   </div>' +
          '</div>'
  
    this.templates.inputRowSingle =
          '<div class="relative-parent fb-field-group row {{#if path}}root-row {{/if}}">' +
          '   {{#if label}}' +
          '   <div class="col-md-3">' +
          this.templates.settings.label +
          '   </div>' +
          '   {{/if}}' +
          '   <div class="col-md-{{#if label}}9{{else}}12{{/if}}">' +
          this.templates.settings.field +
          '   </div>' +
          '   {{#if label}}' +
          '   <button type="button" class="btn btn-danger array-item-del simple-item">' +
          '       <span class="fa fa-minus" aria-hidden="true"></span>' +
          '   </button>' +
          '   {{/if}}' +
          '</div>'
  
    this.templates.inputRowMultiple =
          '<div class="fb-field-group row">' +
          '   {{#if label}}' +
          '   <div class="col-md-3">' +
          this.templates.settings.label +
          '   </div>' +
          '   {{/if}}' +
          '   <div class="col-md-{{#if label}}5{{else}}6{{/if}}">' +
          this.templates.settings.field +
          '   </div>' +
          '</div>'
    this.templates.array = {
      item: {
        start:
                  '<div class="relative-parent array-item">',
        end:
              '<button type="button" class="btn btn-light btn-sm array-item-move array-item-move-up">' +
              '       <small><span class="fa fa-arrow-up text-secondary" aria-hidden="true"></span></small>' +
              '   </button>' +
              '<button type="button" class="btn btn-light btn-sm array-item-move array-item-move-down">' +
              '       <small><span class="fa fa-arrow-down text-secondary" aria-hidden="true"></span></small>' +
              '   </button>' +
              '<button type="button" class="btn btn-danger array-item-del">' +
              '       <span class="fa fa-minus" aria-hidden="true"></span>' +
              '   </button>' +
              '</div>'
      }
    }
    this.templates.validate = {
      dropDown:
          '<div class="dropdown validate-dropdown">' +
          '  <button class="btn dropdown-toggle validate-dropdown-toggle" type="button" id="{{id}}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">' +
          '   {{label}}' +
          '  </button>' +
          '  <div class="dropdown-menu fb-validation-menu" aria-labelledby="{{id}}">{{lis}}</div>' +
          '</div>',
      dropDownLi:
          '<li class="{{#if disabled}}disabled{{/if}}">' +
          '   <a href="javascript:void(0)" data-key="{{key}}" data-exact="{{val.exact}}" data-kind="{{val.kind}}" name="{{path}}.{{key}}">{{key}}</a>' +
          '</li>',
      deleteBtn:
        '<td class="td-min"><button type="button" name="{{path}}" class="btn btn-danger validation-del">' +
        '   <span class="fa fa-minus" aria-hidden="true"></span>' +
        '</button></td>'
    }
    this.validate = {
      dropdown: {
        defaults: {
          'required': true,
          'email': true,
          'number': true,
          'matches': 'regex',
          'max': 10,
          'min': 1,
          'url': true,
          'phoneNr': true
        },
        replaceLabel: function (json, fb, baseEle) {
          var _ = fb.settingsTab
          var validateLabel = baseEle.find("label[name$='validate']")
          if (validateLabel && validateLabel.length) {
            validateLabel.each(function () {
              var _thisVlabel = $(this)
              var validate = null
              var vlPath = _thisVlabel.attr('name')
              var isFile = false
              if ($.isArray(json)) {
                var arrIndex = vlPath.match(/^\[(\d+)\]/)
                if (arrIndex && arrIndex.length == 2) {
                  validate = json[arrIndex[1]]
                  isFile = validate['_file']
                  validate = validate['validate']
                }
              } else {
                isFile = json['_file']
                validate = json['validate']
              }
              if (validate) {
                var validationDropDownEl = $(_.fb.compileTemplate(_.templates.validate.dropDown, {
                  id: _.fb.randomId(),
                  label: _thisVlabel.toString(),
                  lis: _.validate.dropdown.createLis(fb, vlPath, validate, isFile)
                }, 'templates.validate.dropDown'))
                // _.createValidationSelectEvent(fb, validationDropDownEl);
                _thisVlabel.replaceWith(validationDropDownEl)
              }
            })
            _.validate.deleteButton.addAllDeleteButton(fb, baseEle)
          }
        },
        createLis: function (fb, path, validate, isFile) {
          if (!validate) {
            validate = {}
          }
          var html = ''
          for (var key in fb.settingsTab.validate.dropdown.defaults) {
            if (fb.settingsTab.validate.dropdown.defaults.hasOwnProperty(key)) {
              html += fb.compileTemplate(fb.settingsTab.templates.validate.dropDownLi, {
                disabled: (key in validate),
                path: path,
                key: key
              }, 'templates.validate.dropDownLi')
            }
          }
          if (isFile) {
            key = 'file'
            html += fb.compileTemplate(fb.settingsTab.templates.validate.dropDownLi, {
              disabled: (key in validate),
              path: path,
              key: key,
              val: validate.file ? validate.file : {}
            }, 'templates.validate.dropDownLi')
          }
          return html
        },
        createSelectEvent: function (fb, baseEl, json) {
          var _ = fb.settingsTab
          baseEl.find('.fb-validation-menu li a').click(function () {
            var _this = $(this)
            var _li = _this.parent()
            if (_li.hasClass('disabled')) {
              return false
            }
            _li.addClass('disabled')
            var path, type, htmlStr, val, key
            path = _this.attr('name')
            key = _this.attr('data-key')
            val = _.validate.dropdown.defaults[key]
            if (typeof val === 'boolean') {
              type = 'checkbox'
              htmlStr = _.transformer.json.createInputRow({ fb: fb, val: val }, key, path, type, true)
            } else if (key === 'file' || fb.isEnum(val)) {
              if (!val) {
                val = {}
              }
              val.exact = _this.attr('data-exact')
              val.kind = _this.attr('data-kind')
              htmlStr = _.transformer.json.enumToHtmlInput({ fb: fb, val: val }, key, path)
            } else /* if(typeof val === 'string') */{
              type = 'text'
              htmlStr = _.transformer.json.createInputRow({ fb: fb, val: val }, key, path, type, true)
            }
            var newEl = $(htmlStr)
            _.validate.file.createExactSwitchEvent(fb, newEl)
  
            var newDelBtnEl = _.validate.deleteButton.addDeleteButton(fb, path, newEl.find('.hcbuilder-settings-tbl>tbody>tr>td:last-child'))
            _.validate.deleteButton.createDeleteEvent(fb, newDelBtnEl)
            _.validate.date.createDateEvents(fb, newEl)
            var rootRowEl = _this.nextParentWithClass('root-row')
            rootRowEl.find('.array-childs').append(newEl)
            // Setup events for the newly added validation input (PC-526)
            _.transformer.json.createEvents(fb, fb.settingsTab.body)
            _.settingsChanged(_this, 'click')
          })
        }
      },
      file: {
        selectedTitle: function (fb, _t) {
          var selected = _t.find(':selected').text()
          if (!selected) {
            selected = _t.children().first().text()
          }
          if (_t.data('exact')) {
            try {
              _t.attr('title', fb.fileTypes['Exact'][selected]['MIME']['Value'])
            } catch (e) { console.log(e) }
          } else {
            try {
              var arr = fb.fileTypes['Vague'][selected]
              var t = ''
              for (var i = 0; i < arr.length; i++) {
                if (t !== '') {
                  t += ', ' + arr[i].Extension
                } else {
                  t += arr[i].Extension
                }
              }
              _t.attr('title', t)
            } catch (e) { console.log(e) }
          }
        },
        createExactSwitchEvent: function (fb, el) {
          var _ = fb.settingsTab
          var fileExactClickEvent
          fileExactClickEvent = function () {
            var _this = $(this)
            var exact = _this.is(':checked')
            var path = _this.attr('data-path')
            var key = 'file'
            var val = { exact: exact }
            var hStr = _.transformer.json.enumToHtmlInput({ fb: fb, val: val }, key, path)
            var newEl = $(hStr)
            var fileExactSwitch = newEl.find('input.file-exact')
            fileExactSwitch.click(fileExactClickEvent)
            var $sel = newEl.find('select')
            $sel.data('exact', fileExactSwitch.is(':checked'))
            $sel.change(function () {
              var _t = $(this)
              _.validate.file.selectedTitle(fb, _t)
              fb.settingsTab.settingsChanged(_t, 'change')
            })
            _.validate.file.selectedTitle(fb, $sel)
            var newDelBtnEl = _.validate.deleteButton.addDeleteButton(fb, path, newEl.find('.hcbuilder-settings-tbl>tbody>tr>td:last-child'))
            _.validate.deleteButton.createDeleteEvent(fb, newDelBtnEl)
            _this.closest('.fb-field-group.row').replaceWith(newEl)
            fb.settingsTab.settingsChanged(_this, 'click')
          }
          var fileExactSwitch = el.find('input.file-exact')
          if (fileExactSwitch.length) {
            fileExactSwitch.each(function () {
              var _this = $(this)
              _this.unbind('click')
              _this.click(fileExactClickEvent)
              var $sel = _this.closest('.enum-field').find('select')
              $sel.data('exact', _this.is(':checked'))
              $sel.unbind('change')
              $sel.change(function () {
                var _t = $(this)
                _.validate.file.selectedTitle(fb, _t)
                fb.settingsTab.settingsChanged(_t, 'change')
              })
              _.validate.file.selectedTitle(fb, $sel)
            })
          }
        }
      },
      date: {
        createDateEvents: function (fb, baseEle) {
          baseEle.find('.vdf-ext-main .vdf-ext').click(function (e) {
            var t = $(this)
            var p = t.parent()
            var vdf = p.nextParentWithClass('vdf')
            var vdfMains = vdf.find('.vdf-ext-main.vdf-active')
            vdfMains.each(function () {
              var b = $(this)
              var tt = b.find('.vdf-ext')
              if (tt[0] != t) {
                b.removeClass('td-auto').addClass('td-min')
                b.find('.td-auto').removeClass('td-auto').addClass('td-min')
                b.removeClass('vdf-active').addClass('vdf-inactive')
              }
            })
            p.removeClass('vdf-inactive').addClass('vdf-active')
          })
          baseEle.find('.vdf-input span.glyphicon').bind('click', function () {
            var t = $(this)
            var p = t.nextParentWithClass('vdf-ext-main')
            p.find('.td-auto').removeClass('td-auto').addClass('td-min')
            t.parent().removeClass('td-min').addClass('td-auto')
            p.removeClass('td-min').addClass('td-auto')
          })
        }
      },
      deleteButton: {
        addAllDeleteButton: function (fb, baseEle) {
          baseEle.find('[name*="validate."]').each(function () {
            var t = $(this)
            var m = /^((\[\d+\]\.)?(validate\.[A-Za-z]+)\.?)/.exec(t.attr('name'))
            if (t.attr('type') !== 'hidden' && m && m.length > 3) {
              fb.settingsTab.validate.deleteButton.addDeleteButton(fb, m[0], t.nextParentWithClass('hcbuilder-settings-tbl').parent().find('.hcbuilder-settings-tbl>tbody>tr>td:last-child'))
            }
          })
        },
        addDeleteButton: function (fb, path, el) {
          var _ = fb.settingsTab
          if (el.find('.validation-del').length === 0) {
            var htmlStr = fb.compileTemplate(_.templates.validate.deleteBtn, { path: path }, 'templates.validate.deleteBtn')
            var newDelEl = $(htmlStr)
            // _.validate.deleteButton.createDeleteEvent(fb, newDelEl);
            el.after(newDelEl)
            return newDelEl
          }
          return null
        },
        createDeleteEvent: function (fb, baseEle) {
          if (!baseEle) {
            return
          }
          var allDelBtns = baseEle.find('button.validation-del')
          allDelBtns.unbind('click')
          allDelBtns.click(function () {
            var _this = $(this)
            var parent = _this.nextParentWithClass('indention')
            parent.find('.fb-validation-menu li a[name="' + _this.attr('name') + '"]').parent().removeClass('disabled')
            _this.nextParentWithClass('fb-field-group').remove()
            fb.settingsTab.settingsChanged(_this, 'click')
          })
        }
      },
      createAllEvents: function (fb, baseEle, json) {
        fb.settingsTab.validate.deleteButton.createDeleteEvent(fb, baseEle)
        fb.settingsTab.validate.dropdown.createSelectEvent(fb, baseEle, json)
        fb.settingsTab.validate.date.createDateEvents(fb, baseEle)
      }
    }
    this.transformer = {
      json: {
        i18n: {
          autocompleteDefaults: fb.options.i18n ? {
            updater: function (item) {
              var i18nData = fb.options.i18n.onSelect(item.id)
              this.$element.val(item.id)
              if (!this.$element.hasClass('i18n-active') && fb.options.i18n.isCovered(i18nData)) {
                this.$element.addClass('i18n-active')
              }
              fb.settingsTab.settingsChanged(this.$element)
              return fb.options.i18n.onDisplay(item.id)
            },
            showHintOnFocus: true,
            autoSelect: false,
            source: fb.options.i18n.onSearch,
            fitToElement: true,
            items: 6
          } : null,
          initEvents: function (fb, baseEle) {
            if (fb.options.i18n) {
              baseEle.find('input.i18n-switch').each(function () {
                var i18nSwitch = $(this)
                fb.settingsTab.transformer.json.i18n.createClickEvent(fb, i18nSwitch)
                if (i18nSwitch.is(':checked')) {
                  fb.settingsTab.transformer.json.i18n.initAutocomplete(fb, i18nSwitch.nextParentWithClass('hcbuilder-settings-tbl').find('#' + i18nSwitch.attr('data-targetid')))
                }
              })
            }
          },
          createClickEvent: function (fb, i18nSwitch) {
            i18nSwitch.click(function () {
              var _this = $(this)
              if (_this.is(':checked')) {
                fb.settingsTab.transformer.json.i18n.initAutocomplete(fb, _this.nextParentWithClass('hcbuilder-settings-tbl').find('#' + _this.attr('data-targetid')), true)
              } else {
                fb.settingsTab.transformer.json.i18n.destroyAutocomplete(fb, _this.nextParentWithClass('hcbuilder-settings-tbl').find('#' + _this.attr('data-targetid')))
              }
              fb.settingsTab.settingsChanged(_this, 'click')
            })
          },
          initAutocomplete: function (fb, inputEl, focus) {
            inputEl.attr('autocomplete', 'off')
            inputEl.attr('spellcheck', 'false')
            inputEl.typeahead(fb.settingsTab.transformer.json.i18n.autocompleteDefaults)
            if (focus) {
              if (inputEl[0].selectionStart || inputEl[0].selectionStart == '0') {
                var elemLen = inputEl[0].value.length
                // Firefox/Chrome
                inputEl[0].selectionStart = elemLen
                inputEl[0].selectionEnd = elemLen
              }
              inputEl.focus()
            }
          },
          destroyAutocomplete: function (fb, inputEl) {
            inputEl.typeahead('destroy')
            inputEl.unbind()
            inputEl.removeClass('i18n-active')
            fb.settingsTab.transformer.json.bindInputEvents(inputEl, fb.settingsTab)
          }
        },
        toHtmlInput: function (fb, json) {
          var buffer = { html: '', objPath: '' }
          if ($.isArray(json)) {
            this.arrayToHtmlInput({ fb: fb, key: '', val: json, buffer: buffer, rootWrap: true }, '')
          } else {
            this.objectToHtmlInput({ fb: fb, key: '', val: json, buffer: buffer }, '')
          }
          var $html = $(buffer.html)
          fb.settingsTab.validate.dropdown.replaceLabel(json, fb, $html)
          setTimeout(function () {
            $html.find('.actionsource .array-item').each(function () {
              $(this).find('.actionsourcecomment, .actionsourceregex').on('click', function () {
                var $arrayItem = $(this).nextParentWithClass('array-item')
                var $uipp = $arrayItem.find('.actionsource_fbonly_uipp')
                var $destCompId = $arrayItem.find('.actionsource_destCompId')
                var uipp, destCompId
                if ($destCompId.length) {
                  destCompId = $destCompId.val()
                }
                if ($uipp.length) {
                  uipp = $uipp.val()
                }
                fb.workspace.connectionManager.showAction($arrayItem, uipp, destCompId)
              })
            })
  
            $html.find('input.var-name').each(function () {
              $(this).attr('pattern', '^[a-zA-Z]?[a-zA-Z0-9]+$')
  
              $(this).on('click', function () {
                $(this).typeahead('lookup').focus()
                var $varName = $(this)
                var name = $varName.val()
                if (name) {
                  fb.workspace.getActiveBody().find('.fb-component.selected').find("[fb_name='" + name + "'],[name='" + name + "']").each(function () {
                    var t = $(this)
                    var n = t.attrFBName()
                    if (n) {
                      var p = $varName.parent().nextParentWithClass('var-name')
                      if (p.length) {
                        var startId
                        var endId = p.attrID()
                        t = t.findVisibleInputOrRefElement()
                        startId = t.attrID()
                        fb.workspace.connectionManager.showName({
                          animate: '0.3s',
                          offset: 10,
                          orientation: 'vertical',
                          stroke: '#007800',
                          strokeWidth: 1,
                          start: '#' + startId,
                          end: '.hcbuilder-settings-body #' + endId
                        })
                      }
                    }
                  })
                }
              })
            })
          }, 100)
  
          fb.settingsTab.body.html($html)
          this.createEvents(fb, fb.settingsTab.body, json)
        },
        createEvents: function (fb, baseEle, json) {
          var _ = fb
          var changables = baseEle.find('input[name], select[name]')
          var nameSelector = "input[name='name'], input[name*='.name']"
          var nameEl = baseEle.find(nameSelector)
          var _fbOptions = _.options
          nameEl.each(function () {
            var _thisNameEl = $(this)
            var nameRootRowEl = _thisNameEl.nextParentWithClass('root-row')
            if (nameRootRowEl.hasClass('root-row')) {
              var rootRowParent = nameRootRowEl.parent()
              rootRowParent.prepend(nameRootRowEl.detach())
              _thisNameEl = nameRootRowEl.find(nameSelector)
              nameRootRowEl.find("label[for='" + _thisNameEl.attr('id') + "']").addClass('var-name')
              nameRootRowEl.addClass('var-name')
            }
            _thisNameEl.addClass('var-name')
            _thisNameEl.attr('autocomplete', 'off')
            _thisNameEl.attr('spellcheck', 'false')
            _thisNameEl.typeahead(
              {
                minLength: 0,
                autoSelect: true,
                source: _fbOptions.varNameFunction ? _fbOptions.varNameFunction : _fbOptions.vars,
                items: 20
              })
          })
  
          var connectorSelector = 'input.connector'
          var conEl = baseEle.find(connectorSelector)
          conEl.each(function () {
            var _thisNameEl = $(this)
            _thisNameEl.attr('autocomplete', 'off')
            _thisNameEl.attr('spellcheck', 'false')
            _thisNameEl.typeahead(
              {
                minLength: 0,
                autoSelect: true,
                source: _fbOptions.varConnectorsFunction,
                items: 20
              })
            $(_thisNameEl).on('click', function () {
              $(_thisNameEl).typeahead('lookup').focus()
            })
          })
  
          var settingsTab = _.settingsTab
          baseEle.find('.array-add').click(function () {
            var arrayAddEl = $(this)
            var parent = arrayAddEl.nextParentWithClass('indention')
            var arrayChilds = parent.find('.array-childs:first')
            var lastArrayItem = arrayChilds.children('.array-item:last')
            var newArrayItem = $(lastArrayItem.toString())
  
            var inputs = newArrayItem.find('input[name]')
            inputs.each(function () {
              var _in = $(this)
              var newId = _.randomId()
              var oldId = _in.attr('id')
              var i18nSwitch = newArrayItem.find('[data-targetid="' + oldId + '"]')
              if (i18nSwitch.length) {
                i18nSwitch.attr('data-targetid', newId)
                _in.removeClass('i18n-active')
              }
              newArrayItem.find('label[for="' + oldId + '"]').attr('for', newId)
              _in.attr('id', newId)
              if (!(/^(\[\d+\]\.)?(validate\..*)$/.test(_in.attr('name'))) && _in.attr('type') === 'text') {
                _in.val('')
              }
              _in.attr('name', settingsTab.transformer.json.incrementArrayPattern(arrayAddEl.attr('name'), _in.attr('name')))
            })
            newArrayItem.find('button[name],label[name],a[name]').each(function () {
              $(this).attr('name', settingsTab.transformer.json.incrementArrayPattern(arrayAddEl.attr('name'), $(this).attr('name')))
            })
            settingsTab.transformer.json.createEvents(_, newArrayItem, json)
            arrayChilds.append(newArrayItem)
            settingsTab.settingsChanged(arrayAddEl, 'click')
          })
  
          function moveArrayItem (target, direction) {
            let $arrayMoveUpEl = target
            let _arrayItem = $arrayMoveUpEl.parent()
  
            if (direction === 'up') {
              _arrayItem.prev().before(_arrayItem)
            } else if (direction === 'down') {
              _arrayItem.next().after(_arrayItem)
            } else {
              return
            }
  
            let _arrayIndention = _arrayItem.nextParentWithClass('indention')
            let arrayAddBtn = _arrayIndention.find('.array-add')
            let _arrayParentPath = arrayAddBtn.attr('name')
  
            let i = 0
            _arrayIndention.find('.array-item').not(_arrayIndention.find('.array-item .array-item')).each(function () {
              $(this).find('input[name],button[name],label[name]').each(function () {
                $(this).attr('name', settingsTab.transformer.json.moveArrayPattern(_arrayParentPath, $(this).attr('name'), i))
              })
              i++
            })
  
            settingsTab.settingsChanged($arrayMoveUpEl, 'click')
          }
  
          baseEle.find('.array-item-move-up').click(function () {
            moveArrayItem($(this), 'up')
          })
  
          baseEle.find('.array-item-move-down').click(function () {
            moveArrayItem($(this), 'down')
          })
          settingsTab.transformer.json.bindInputEvents(changables, settingsTab)
          baseEle.find('button').each(function () {
            var cgl = $(this)
            cgl.bind('keyup', function (event) {
              return settingsTab.transformer.json.keyupEvent($(this), event, settingsTab)
            })
            cgl.bind('keydown', function (event) {
              return settingsTab.transformer.json.keydownEvent($(this), event, settingsTab)
            })
          })
          baseEle.find('.array-item-del').click(function () {
            var arrayDelBtn = $(this)
            var _arrayItem = arrayDelBtn.parent()
            if (!arrayDelBtn.hasClass('simple-item')) {
              if (_arrayItem.is(':last-child')) {
              } else {
                var _arrayIndention = _arrayItem.nextParentWithClass('indention')
                var arrayAddBtn = _arrayIndention.find('.array-add')
                var _arrayParentPath = arrayAddBtn.attr('name')
                while (true) {
                  _arrayItem = _arrayItem.next('.array-item')
                  if (_arrayItem.length == 0) {
                    break
                  }
                  _arrayItem.find('input[name],button[name],label[name]').each(function () {
                    $(this).attr('name', settingsTab.transformer.json.decrementArrayPattern(_arrayParentPath, $(this).attr('name')))
                  })
                }
              }
            }
            arrayDelBtn.parent().remove()
            settingsTab.settingsChanged(arrayDelBtn, 'click')
          })
          settingsTab.transformer.json.i18n.initEvents(_, baseEle)
          settingsTab.validate.createAllEvents(_, baseEle, json)
          settingsTab.validate.file.createExactSwitchEvent(_, baseEle)
        },
        bindInputEvents: function (changables, settingsTab) {
          changables.each(function () {
            var cgl = $(this)
            cgl.bind('keyup', function (event) {
              return settingsTab.transformer.json.keyupEvent($(this), event, settingsTab)
            })
            cgl.bind('keydown', function (event) {
              return settingsTab.transformer.json.keydownEvent($(this), event, settingsTab)
            })
            cgl.bind('change', function (event) {
              if ($(this).attr('type') !== 'text') {
                settingsTab.settingsChanged($(this), 'change')
              } else {
                if (settingsTab.autoSave) {
                  settingsTab.settingsChanged($(this), 'keyup')
                }
              }
            })
          })
        },
        objectToHtmlInput: function (o, key, path, isNested) {
          var iHideIt = false
          if (key) {
            if (o.fb.isHiddenField(key)) {
              o.isParentHidden = true
              iHideIt = true
            } else {
              o.buffer.html += this.startIndention(o, key, path, false)
            }
          }
          // var multipleInputs = o.fb.settingsTab.sizeOf(o.val) == 2
  
          var multipleInputs = !!isNested
  
          var json = o.val
          for (var k in json) {
            if (json.hasOwnProperty(k)) {
              if (json[k] !== null) {
                var subpath = (!path ? k : (path + '.' + k))
                o.val = json[k]
                if (typeof json[k] === 'boolean') {
                  this.booleanToHtmlInput(o, k, subpath, multipleInputs)
                } else if ($.isArray(json[k])) {
                  this.arrayToHtmlInput(o, k, subpath)
                } else if (/^(\[\d+\]\.)?(validate\.file.*)$/.test(subpath) || o.fb.isEnum(json[k])) {
                  this.enumToHtmlInput(o, k, subpath)
                } else if (typeof json[k] === 'object') {
                  if ((/^(\[\d+\]\.)?(validate\.date)$/.test(subpath))) {
                    this.stringToHtmlInput(o, k, subpath, multipleInputs)
                  } else if (o.fb.options.i18n.isCovered(json[k])) {
                    this.stringToHtmlInput(o, k, subpath, multipleInputs)
                  } else {
                    this.objectToHtmlInput(o, k, subpath, true)
                  }
                } else {
                  this.stringToHtmlInput(o, k, subpath, multipleInputs)
                }
              }
            }
          }
          if (iHideIt) {
            o.isParentHidden = false
          } else {
            if (key) { o.buffer.html += this.endIndention(o) }
          }
          return o.buffer
        },
        // fb, path, index, json, buffer, rootWrap
        arrayToHtmlInput: function (o, key, path) {
          var iHideIt = false
          if (o.fb.isHiddenField(key)) {
            o.isParentHidden = true
            iHideIt = true
          } else {
            if (key || o.rootWrap) {
              o.buffer.html += this.startIndention(o, key, path, true)
            }
          }
          var json = o.val
          for (var i = 0; i < json.length; ++i) {
            if (!o.isParentHidden) {
              o.buffer.html += o.fb.settingsTab.templates.array.item.start
            }
            var subpath = (!path ? (!key ? '[' + i + ']' : key) : (path + '[' + i + ']'))
            o.val = json[i]
            if (typeof o.val === 'boolean') {
              this.booleanToHtmlInput(o, '', subpath)
            } else if ($.isArray(o.val)) {
              this.arrayToHtmlInput(o, '', subpath)
            } else if (o.fb.isEnum(o.val)) {
              this.enumToHtmlInput(o, '', subpath)
            } else if (typeof o.val === 'object') {
              this.objectToHtmlInput(o, '', subpath)
            } else {
              this.stringToHtmlInput(o, '', subpath)
            }
            if (!o.isParentHidden) {
              o.buffer.html += o.fb.settingsTab.templates.array.item.end
            }
          }
  
          if (iHideIt) {
            o.isParentHidden = false
          } else {
            if (key || o.rootWrap) {
              o.buffer.html += this.endIndention(o)
              o.rootWrap = false
            }
          }
          return o.buffer
        },
        fileTypesToEnum: function (fb, exact, kind) {
          var en = {
            all: [],
            selected: 0
          }
          var obj
          if (exact === true) {
            obj = fb.fileTypes['Exact']
          } else {
            obj = fb.fileTypes['Vague']
          }
          if (obj) {
            for (var key in obj) {
              if (obj.hasOwnProperty(key)) {
                en.all.push(key)
              }
            }
          }
          if (kind) {
            for (var i = 0; i < en.all.length; i++) {
              if (en.all[i] === kind) {
                en.selected = i
                break
              }
            }
          }
          return en
        },
        enumToHtmlInput: function (o, key, path) {
          if (o.fb.isHiddenField(key)) {
            return ''
          }
          var isFile = (/^(\[\d+\]\.)?(validate\.file.*)$/.test(path))
          if (isFile) {
            o.val = $.extend({}, o.val, this.fileTypesToEnum(o.fb, o.val ? o.val.exact : false, o.val ? o.val.kind : null))
          }
          var html = o.fb.compileTemplate(o.fb.settingsTab.templates.enumRowSingle, {
            id: o.fb.randomId(),
            label: '' + key,
            val: o.val,
            path: path,
            exact: o.val ? o.val.exact : false,
            pathClass: this.toPathClass(path),
            select: (/^(\[\d+\]\.)?(validate\..*)$/.test(path)) || isFile
          }, 'templates.enumRowSingle')
          if (o && o.buffer && o.buffer.html) {
            o.buffer.html += html
          } else {
            return html
          }
        },
        stringToHtmlInput: function (o, key, path, multipleInputs) {
          o.buffer.html += this.createInputRow(o, key, path, 'text', multipleInputs)
        },
        booleanToHtmlInput: function (o, key, path, multipleInputs) {
          o.buffer.html += this.createInputRow(o, key, path, 'checkbox', multipleInputs)
        },
        createInputRow: function (o, key, path, type, multipleInputs) {
          if (o.isParentHidden || o.fb.isHiddenField(key)) {
            return o.fb.compileTemplate(o.fb.settingsTab.templates.settings.hiddenField, {
              id: o.fb.randomId(),
              label: '' + key,
              orgVal: o.val,
              val: o.val,
              path: path,
              pathClass: this.toPathClass(path),
              type: type,
              typeText: type === 'text'
            }, 'templates.settings.hiddenField')
          }
          if (/^(\[\d+\]\.)?(validate\.date)$/.test(path)) {
            return o.fb.compileTemplate(o.fb.settingsTab.templates.inputRowSingleDate, {
              id: o.fb.randomId(),
              label: '' + key,
              orgVal: o.val,
              val: o.val,
              path: path,
              pathClass: this.toPathClass(path),
              type: type
            }, 'templates.inputRowSingleDate')
          } else {
            var tmplData = {
              id: o.fb.randomId(),
              label: '' + key,
              orgVal: o.val,
              val: o.val,
              path: path,
              pathClass: this.toPathClass(path),
              type: type,
              typeText: type === 'text',
              createI18nEl: false,
              i18nChecked: false
            }
            if ((/^(\[\d+\]\.)?(action\..*)$/.test(path))) {
              return o.fb.compileTemplate(o.fb.settingsTab.templates.inputRowSingle, tmplData, 'templates.inputRowSingle')
            } else if (!(/^(\[\d+\]\.)?(name|validate\..*)$/.test(path))) {
              if (o.fb.options.i18n) {
                if (type === 'text') {
                  if ($.isFunction(o.fb.options.i18n.isCovered)) {
                    tmplData.i18nChecked = o.fb.options.i18n.isCovered(o.val)
                  }
                  if (o.fb.options.enableI18n && o.fb.options.enableI18n === true) {
                    tmplData.createI18nEl = true
                  }
                }
                if ($.isFunction(o.fb.options.i18n.onDisplay)) {
                  tmplData.val = o.fb.options.i18n.onDisplay(o.val)
                }
              }
            } else if (/^(\[\d+\]\.)?(name)$/.test(path)) {
              multipleInputs = false
            } else {
              multipleInputs = true
            }
            if (multipleInputs) {
              return o.fb.compileTemplate(o.fb.settingsTab.templates.inputRowMultiple, tmplData, 'templates.inputRowMultiple')
            }
            return o.fb.compileTemplate(o.fb.settingsTab.templates.inputRowSingle, tmplData, 'templates.inputRowSingle')
          }
        },
        toPathClass: function (path) {
          if (path) {
            path = path.replace(/\.|\[\d+\]/g, '')
            if (path === 'label') {
              return ''
            }
            return path
          }
          return ''
        },
        incrementArrayPattern: function (parent, target) {
          var arrayChild = target.substring(parent.length)
          var matches = arrayChild.match(/^\[(\d+)\]/)
          var pathSuffix = arrayChild.substring(matches[0].length)
          return parent + '[' + (parseInt(matches[1]) + 1) + ']' + pathSuffix
        },
        decrementArrayPattern: function (parent, target) {
          var arrayChild = target.substring(parent.length)
          var matches = arrayChild.match(/^\[(\d+)\]/)
          var pathSuffix = arrayChild.substring(matches[0].length)
          return parent + '[' + (parseInt(matches[1]) - 1) + ']' + pathSuffix
        },
        moveArrayPattern: function (parent, target, index) {
          var arrayChild = target.substring(parent.length)
          var matches = arrayChild.match(/^\[(\d+)\]/)
          var pathSuffix = arrayChild.substring(matches[0].length)
          return parent + '[' + (index) + ']' + pathSuffix
        },
        startIndention: function (o, key, path, isArray) {
          var tmplData = {
            path: path,
            hidden: o.isParentHidden,
            pathClass: this.toPathClass(path),
            label: '',
            isArray: isArray,
            isValidate: /^(\[\d+\]\.)?(validate)$/.test(path)
          }
          if (key) {
            key = '' + key
            tmplData.label = key.charAt(0).toUpperCase() + key.slice(1)
          }
          return o.fb.compileTemplate(o.fb.settingsTab.templates.startIndention, tmplData, 'templates.startIndention')
        },
        endIndention: function (o) {
          return o.fb.settingsTab.templates.endIndention
        },
        keyupEvent: function (t, event, settingsTab) {
          var code = event.keyCode || event.which
          if (code) {
            if (settingsTab.autoSave) {
              if (event.ctrlKey) {
                if (event.which === 86) { // Check for the Ctrl key being pressed, and if the key = [V] (86)
                  settingsTab.settingsChanged(t, 'keyup')
                  return true
                }
              } else {
                settingsTab.settingsChanged(t, 'keyup')
                return true
              }
            }
            if (event.ctrlKey && event.which === 86) { // Check for the Ctrl key being pressed, and if the key = [V] (86)
              settingsTab.settingsChanged(t, 'keyup')
              return true
            }
            if (!event.ctrlKey && (code > 46 || code < 9 ||
                              (code !== 9 &&
                                  code !== 16 &&
                                  code !== 17 &&
                                  code !== 18 &&
                                  code !== 33 &&
                                  code !== 34 &&
                                  code !== 35 &&
                                  code !== 36 &&
                                  code !== 37 &&
                                  code !== 38 &&
                                  code !== 39 &&
                                  code !== 40 &&
                                  code !== 45 &&
                                  code !== 46))) {
              settingsTab.settingsChanged(t, 'keyup')
            }
          }
          return true
        },
        keydownEvent: function (t, event, settingsTab) {
          var code = event.keyCode || event.which
          if (code) {
            if (event.ctrlKey && event.which === 83) { // Check for the Ctrl key being pressed, and if the key = [S] (83)
              event.preventDefault()
              settingsTab.storeSettings()
              return false
            }
          }
          return true
        }
      },
      html: {
        /**
               * data-dval ["undefined" = don't assign, "null" assign empty, "some val" assign with this if empty]
               * @param fb
               * @param jqEl
               * @param o
               * @returns {*}
               */
        toJsonSettings: function (fb, jqEl, o) {
          if (!o) {
            o = $.isArray(fb.settingsTab.currentSettings) ? [] : {}
          }
          // var values = this.serializeArray();
          var allInputs = jqEl.find('input[name], select[name]')
          var targetInput = null
          for (var i = 0; i < allInputs.length; ++i) {
            targetInput = $(allInputs[i])
            var defaultValueIfEmpty = targetInput.attr('data-dval')
            var val
            if (targetInput.length) {
              if (targetInput.hasClass('file-exact') && targetInput.attr('type') === 'checkbox') {
                this.setValueByJsString(fb, o, targetInput.attr('name'), targetInput.is(':checked'))
              } else if (targetInput.attr('type') === 'radio' || targetInput.attr('type') === 'checkbox') {
                var cbOrRbCollection = []
                var tName = targetInput.attr('name')
                for (; i < allInputs.length; ++i) {
                  var cbOrRb = $(allInputs[i])
                  if (tName === cbOrRb.attr('name')) {
                    cbOrRbCollection.push(cbOrRb)
                  } else {
                    --i
                    break
                  }
                }
                if (cbOrRbCollection.length > 1) {
                  if (targetInput.attr('type') === 'radio') {
                    for (var rb = 0; rb < cbOrRbCollection.length; ++rb) {
                      if (cbOrRbCollection[rb].is(':checked')) {
                        val = cbOrRbCollection[rb].val()
                        if (defaultValueIfEmpty) {
                          if (defaultValueIfEmpty === 'undefined') {
                            if (!val) {
                              break
                            }
                          } else if (defaultValueIfEmpty === 'null') {
                            val = ''
                          } else {
                            if (!val) {
                              val = defaultValueIfEmpty
                            }
                          }
                        }
                        this.setValueByJsString(fb, o, tName, val === 'on' ? true : val)
                        break
                      }
                    }
                  }
                } else {
                  val = cbOrRbCollection[0].val()
                  if (defaultValueIfEmpty) {
                    if (defaultValueIfEmpty === 'undefined') {
                      if (!val) {
                        continue
                      }
                    } else if (defaultValueIfEmpty === 'null') {
                      val = ''
                    } else {
                      if (!val) {
                        val = defaultValueIfEmpty
                      }
                    }
                  }
                  this.setValueByJsString(fb, o, tName, val === 'on' ? cbOrRbCollection[0].is(':checked') : val)
                }
              } else {
                if (targetInput[0].value !== undefined) {
                  val = targetInput.val()
                } else {
                  val = targetInput.html()
                }
                if (targetInput.parents('.hcbuilder-settings-tbl').find('input.i18n-switch').is(':checked')) {
                  val = fb.options.i18n.onSelect(val)
                }
                if (defaultValueIfEmpty) {
                  if (defaultValueIfEmpty === 'undefined') {
                    if (!val) {
                      continue
                    }
                  } else if (defaultValueIfEmpty === 'null') {
                    val = ''
                  } else {
                    if (!val) {
                      val = defaultValueIfEmpty
                    }
                  }
                }
                this.setValueByJsString(fb, o, targetInput.attr('name'), val)
              }
            }
          }
          // Ensure that validate is always at least an empty object so you can still add
          // validation rules after removing all of them
          if (o instanceof Array) {
            o.length && o.forEach((element) => {
              if (!element.validate) {
                element.validate = {}
              }
              return element
            })
          } else if (typeof o === 'object' && !o.validate) {
            o.validate = {}
          }
          fb.compiler.deepLoopOverJson(o, {
            'object': function (value, keyOrIndex, obj) {
              if (keyOrIndex === 'file' && value && value.all) {
                obj.file = { exact: value.exact, kind: value.all[value.selected] }
              }
              return true
            }
          })
          var oldCm = fb.compiler.getCompMainObject(fb.settingsTab.currentSettings)
          if (oldCm && oldCm['_import']) {
            var cm = fb.compiler.getCompMainObject(o)
            if (cm) {
              cm['_import'] = oldCm['_import']
            }
          }
          return o
        },
        setValueByJsString: function (fb, rootObj, name, value) {
          var o = rootObj
          var strArray = name.split(/(\[\d+\])|(\.)/g)
          var key = ''
          var arrayIndex = 0
          var arrayPointer = $.isArray(o)
          for (var i = 0; i < strArray.length; ++i) {
            if (strArray[i] && strArray[i] !== '') {
              if (/^[_a-zA-Z0-9]+.*$/.test(strArray[i])) { // key
                key = strArray[i]
                arrayPointer = false
              } else if (/^\[\d+\]$/.test(strArray[i])) { // array
                if (key !== '') {
                  if (!$.isArray(o[key])) {
                    o[key] = []
                  }
                  o = o[key]
                  arrayPointer = true
                }
                try {
                  arrayIndex = parseInt(strArray[i].match(/(\d+)/g)[0])
                } catch (e) {
                }
              } else if (strArray[i] === '.') { // object
                if (arrayPointer) {
                  if (typeof o[arrayIndex] !== 'object') {
                    o[arrayIndex] = {}
                  }
                  o = o[arrayIndex]
                } else {
                  if (typeof o[key] !== 'object') {
                    o[key] = {}
                  }
                  o = o[key]
                }
                arrayPointer = false
              }
            }
          }
          if ((/^\d+\.?\d*$/.test(value)) && key !== 'name') { // is number
            value = parseFloat(value)
          }
          if (arrayPointer) {
            o[arrayIndex] = value
          } else {
            o[key] = value
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
    this.uiNotification = function (obj) {
      var selector = '.inline-notification .inline-notification-holder'
      var notifEle = this.body.find(selector)
      if (!notifEle || notifEle.length === 0) {
        var template =
                  '<div class="inline-notification">' +
                  '   <div class="row">' +
                  '       <div class="col-md-2"></div>' +
                  '       <div class="col-md-8 inline-notification-holder">' +
                  '           <div class="alert alert-{{status}} alert-dismissible" role="alert" style="width: 100%;z-index: 2;">' +
                  '               <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>' +
                  '               {{message}}' +
                  '           </div>' +
                  '       </div>' +
                  '       <div class="col-md-2"></div>' +
                  '   </div>' +
                  '</div>'
        var htmlStr = this.fb.compileTemplate(template, obj)
        this.body.prepend(htmlStr)
      } else {
        var alertTemplate =
                  '           <div class="alert alert-{{status}} alert-dismissible" role="alert" style="width: 100%;z-index: 2;">' +
                  '               <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>' +
                  '               {{message}}' +
                  '           </div>'
        notifEle.html(this.fb.compileTemplate(alertTemplate, obj))
      }
    }
    this.compId = null
    this.currentSettings = null
    this.tabActive = false
    this.storeSettings = function (doneCallback) {
      var newSettings = this.transformer.html.toJsonSettings(this.fb, this.body)
      var main = this.fb.compiler.getCompMainObject(newSettings)
      delete main['_order']
      this.currentSettings = newSettings
      var _ = this
      this.fb.workspace.updateComponent(this.compId, this.currentSettings, function () {
        // done updating comp
        _.settingsSaved()
        if ($.isFunction(doneCallback)) {
          try {
            doneCallback()
          } catch (er) {
            console.log(er)
          }
        }
      })
    }
    this.settingsChanged = function (target, etype) {
      if (this.autoSave) {
        var _ = this.fb
        this.storeSettings(function () {
          if ((etype == 'click' || etype == 'change') || (target && target.length && target.hasClass('var-name'))) {
            _.workspace.connectionManager.update()
          }
        })
      } else {
        var saveBtn = this.el.find('.save-btn')
        saveBtn.addClass('btn-warning')
        saveBtn.removeClass('btn-secondary')
        saveBtn.addClass('hcb-changed')
      }
    }
    this.settingsSaved = function () {
      var saveBtn = this.el.find('.save-btn')
      saveBtn.addClass('btn-secondary')
      saveBtn.removeClass('btn-warning')
      saveBtn.removeClass('hcb-changed')
    }
    this.editSettings = function (compId, settingsJson, withoutFocus) {
      if (this.compId === compId) {
        this.showTab(false, withoutFocus)
      } else {
        this.renderSettings(compId, settingsJson, withoutFocus)
      }
    }
    this.updateSettings = function (compId, settingsJson) {
      if (this.tabActive) {
        this.renderSettings(compId, settingsJson, true)
      }
    }
    this.renderSettings = function (compId, settingsJson, withoutFocus) {
      this.fb.workspace.connectionManager.nameConnections = []
      this.fb.workspace.connectionManager.nameConExists = {}
      this.compId = compId
      this.currentSettings = settingsJson
      this.transformer.json.toHtmlInput(this.fb, settingsJson)
      this.settingsSaved()
      this.showTab(true, withoutFocus)
    }
    this.currentCompId = function (options) {
      if (options && options.release) {
        this.compId = null
      }
      return this.compId
    }
    this.componentRemoved = function (compId) {
      if (this.compId === compId) {
        this.clearBody()
      }
    }
    this.clearBody = function () {
      this.body.empty()
      this.compId = null
      this.settingsSaved()
      if (this.tabActive) {
        this.fb.componentsTab.showTab()
      }
    }
    this.showTab = function (reconstructed, withoutFocus) {
      if (!this.tabActive) {
        this.fb.el.find('.hcbuilder a.' + this.el.attr('id')).tab('show')
      }
      if (!withoutFocus) {
        this.focusInput()
      }
      this.fb.workspace.connectionManager.update(null, reconstructed)
    }
    this.tabShown = function () {
      this.tabActive = true
      this.fb.calcContainerHeight(this, true)
      if (!this.scrollEventAttached) {
        this.scrollEventAttached = true
        var fb = this.fb
        // this.innerBody.scroll(function(){
        //     fb.workspace.connectionManager.empty();
        // });
      }
      this.fb.activeTabObj = this
      this.fb.workspace.highlightComponent(this.compId)
      this.focusInput()
      this.fb.workspace.connectionManager.update()
    }
    this.tabHidden = function () {
      this.tabActive = false
      this.fb.workspace.unHighlightComponent(this.compId)
      this.fb.workspace.connectionManager.update()
    }
    this.focusInput = function () {
    }
    this.init(fb, jqEl)
}

export default FT_SettingsTab