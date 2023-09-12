// Have not been created yet in moduls folder
import { FT_FormBuilderCompiler } from './formbuilder-compiler';

import { FT_Workspace } from './workspace';
import { FT_ComponentsTab } from './components-tab';
import { FT_BuilderTab } from './builder-tab';
import { FT_SettingsTab } from './settings-tab';


function FT_FormBuilder(jqEl, options) {

    this.init = function (jqEl, options) {
        var formBuilder = this
        this.compiler = new FT_FormBuilderCompiler({
          requestComp: function (id, callback) {
            var localComp
            if (formBuilder.componentsTab.components[id]) {
              localComp = formBuilder.componentsTab.components[id]
            }
            if (localComp) {
              if (callback === undefined) {
                return localComp
              } else {
                callback(localComp)
                return
              }
            }
            return formBuilder.options.component.requestComp(id, callback)
          },
          injectFormCompiler: true,
          formCompiler: {
            getComponentsHolder: function () {
              return formBuilder.workspace
            }
          },
          i18n: options.i18n
        })
        options = $.extend({
          file: {
            requestTypes: function (callback) {
            }
          },
          component: {
            requestComp: function (id, callback) {
            },
            searchComp: function (text, callback) {
            },
            storeComp: function (comp, callback) {
            },
            deleteComp: function (id, callback) {
            }
          },
          componentsTab: { components: {} },
          vars: []
        }, options)
        this.fbid = this.randomId()
        this.el = jqEl
        this.el.addClass('hcbuild-main')
        if (options && options.readOnly === true) {
          this.el.addClass('read-only')
        }
        this.el.append(formBuilderHtmlConstruct)
        this.vars = options.vars
        this.options = options
        
        this.compiler = new FT_FormBuilderCompiler(options);
        this.workspace = new FT_Workspace(this, this.el.find('#htmlFormWorkspace'));
        this.componentsTab = new FT_ComponentsTab(this, this.el.find('#htmlComponents'));
        this.builderTab = new FT_BuilderTab(this, this.el.find('#htmlComponentBuilder'));
        this.settingsTab = new FT_SettingsTab(this, this.el.find('#htmlComponentSettings'));
        this.workspace.fb.options.scrollableContainer = this.workspace.el.find('.wsbody')
        
        $('.hcbuilder a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var previous = $(e.relatedTarget).attr('href')
            if (previous === '#htmlComponents') {
            formBuilder.componentsTab.tabHidden()
            } else if (previous === '#htmlComponentBuilder') {
            formBuilder.builderTab.tabHidden()
            } else if (previous === '#htmlComponentSettings') {
            formBuilder.settingsTab.tabHidden()
            }
            var target = $(e.target).attr('href') // activated tab
            if (target === '#htmlComponents') {
            formBuilder.componentsTab.tabShown()
            } else if (target === '#htmlComponentBuilder') {
            formBuilder.builderTab.tabShown()
            } else if (target === '#htmlComponentSettings') {
            formBuilder.settingsTab.tabShown()
            }
        })

        this.workspace.loadData()
        this.componentsTab.loadData()
        this.setFileTypes = function (fTypes) {
            formBuilder.fileTypes = fTypes
        }
        if (!this.fileTypes) {
            this.options.file.requestTypes(this.setFileTypes)
        }
        var $scrollingDiv = $('.hcbuild-main .hcbuilder')
        var scrollContainerEl = this.options.scrollableContainer
        this.$sticky = this.el.find('.fb-sticky-right')
        this.activeTabObj = this.componentsTab
        formBuilder.lastScrollPos = formBuilder.options.scrollableContainer.scrollTop()
        formBuilder.options.scrollableContainer.scroll(function () {
            formBuilder.currentScrollPos = formBuilder.options.scrollableContainer.scrollTop()
            var scrollOffsetY = (-1 * (formBuilder.lastScrollPos - formBuilder.currentScrollPos))
            formBuilder.lastScrollPos = formBuilder.currentScrollPos
            formBuilder.adjustHeight(formBuilder.activeTabObj, scrollOffsetY)
        })
        this.setupCopyPasteEvent()

        if (this.options.userAllowedToEditComponents === false) {
            $('.nav-item .htmlComponentBuilder').hide()
        }
        }
        this.el = null
        this.getData = function () {
        return this.workspace.storeComponents()
        }
        this.randomId = function () {
        return this.compiler.randomId()
        }
        this.setupCopyPasteEvent = function () {
        var fb = this
        fb['vKey'] = 86
        fb['cKey'] = 67
        var isField = function (t) {
            return /input|textarea|select/i.test(t.tagName)
        }
        $(document).keydown(function (e) {
            try {
            if (!isField(e.target)) {
                var ctrlDown = e.ctrlKey || e.metaKey // Mac support
                if (ctrlDown && e.keyCode == fb.cKey) {
                return !fb.workspace.onWSCopyComponent()
                } else if (ctrlDown && e.keyCode == fb.vKey) {
                return !fb.workspace.onWSPasteComponent()
                }
            }
            } catch (err) {
            console.log(err)
            }
            return true
        })
        /** .keyup(function(e) {
                 if (e.keyCode == fb.ctrlKey || e.keyCode == fb.cmdKey){}
            });**/
        }
        this.adjustHeight = function (t, scrollOffset) {
        }
        this.calcContainerHeight = function (t, force) {
        if (t.el.is(':visible')) {
            if (force || !t.containerHeightWithoutInnerBody) {
            if (!t.innerBody || !t.innerBody.length) {
                t.innerBody = t.el.find('.fb-inner-body')
                t.innerBody.css({ 'height': '0', 'min-height': '0' })
                t.containerHeightWithoutInnerBody = t.el.children('.panel').outerHeight(true)
                t.innerBody.css({ 'height': '', 'min-height': '' })
            }
            this.adjustHeight(t, 0)
            }
        }
        }
        // provide tmplId for template cache/performance
        this.compileTemplate = function (templStr, settings, tmplId) {
        return this.compiler.compileTemplate(templStr, settings, tmplId)
        }
        this.getPossibleHeight = function (pos) {
        if (!pos) {
            pos = this.el.position()
        }
        if (!this.cachedContainerHeight) {
            this.cachedContainerHeight = this.options.scrollableContainer.outerHeight(false)
        }
        if (pos.top > 0) {
            return this.cachedContainerHeight - pos.top
        }
        return this.cachedContainerHeight
        }
        this.translateSettingsAndCompileTemplate = function (tmplId, templStr, jsonSettings, callback) {
        var _ = this
        this.translateSettings(jsonSettings, tmplId, function (translatedSettings, tplId) {
            var cachedTmpl = _.compiler.getTemplateCached(tplId)
            if (!cachedTmpl) {
            cachedTmpl = _.compiler.cacheTemplate(tplId, templStr)
            }
            var compiledComp = _.compiler.cTemplate(templStr, translatedSettings, tplId)
            if (compiledComp) {
            compiledComp = _.compiler.addClassOnRootElement(compiledComp, cachedTmpl.isGrpParent ? 'fb-component fbc-grp-parent' : 'fb-component')
            }
            callback(compiledComp)
        })
        }
        this.translateSettings = function (jsonSettings, tmplId, callback) {
        var _ = this
        if (typeof jsonSettings === 'string') {
            jsonSettings = $.parseJSON(jsonSettings)
        } else {
            jsonSettings = _.deepCopySettings(jsonSettings)
        }
        if (_.options.i18n && _.options.i18n.onDisplay && _.options.i18n.onTranslate && _.options.i18n.isCovered) {
            _.compiler.translateSettings(jsonSettings, tmplId, {
            onDisplay: _.options.i18n.onDisplay,
            onTranslate: _.options.i18n.onTranslate,
            isCovered: _.options.i18n.isCovered,
            done: callback
            })
        } else {
            callback(jsonSettings, tmplId)
        }
        }
        this.deepCopySettings = function (settingsOfComp, settingsToMergeInto) {
        return this.compiler.deepCopySettings(settingsOfComp, settingsToMergeInto)
        }
        this.isEnum = function (o) {
        return this.compiler.isEnum(o)
        }
        this.isHiddenField = function (key) {
        return this.compiler.isHiddenField(key)
        }
        this.htmlRenderer = function (htmlData, jsonSettings, callback) {
        if (htmlData) {
            callback(htmlData)
        }
        }
        this.randomIntBetween = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
        }
        this.getCompParentOf = function ($t) {
        var p = $t.nextParentWithClass('fbc-dz')
        if (p.hasClass('fbc-grp')) {
            return p.nextParentWithClass('fbc-grp-parent')
        }
        return p
        }
        this.workspace = null
        this.componentsTab = null
        this.builderTab = null
        this.settingsTab = null
        this.init(jqEl, options)

}
export default FT_FormBuilder;

