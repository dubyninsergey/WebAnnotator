// See license.txt for terms of usage

// namespace.
if (typeof webannotator == "undefined") {
    var webannotator = {};
};

// Default color set for annotation (foreground and background
// color pairs)
webannotator.origColors = [ ["#000000", "#33CCFF"],
                            ["#000000", "#FF0000"],
                            ["#000000", "#33FF33"],
                            ["#000000", "#CC66CC"],
                            ["#000000", "#FF9900"],
                            ["#000000", "#99FFFF"],
                            ["#000000", "#FF6666"],
                            ["#000000", "#66FF99"],
                            ["#FFFFFF", "#3333FF"],
                            ["#FFFFFF", "#660000"],
                            ["#FFFFFF", "#006600"],
                            ["#FFFFFF", "#663366"],
                            ["#FFFFFF", "#993300"],
                            ["#FFFFFF", "#336666"],
                            ["#FFFFFF", "#666600"],
                            ["#FFFFFF", "#009900"] ];



// Selected text
webannotator.aSelection = "";
// Menu is open or not
webannotator.isOpen = false;
// Attributes selected in the menu
webannotator.attributesOptions = [];
// Unique id for the highlighted text
webannotator.WAid = 0;
// True if the page has not been loaded yet with WA.
webannotator.noLoad = true;
// WA annotation identifier to edit, if edit asked
webannotator.id_to_edit = null;
// Are the links activated or not in the page?
webannotator.linksEnable = true;
// Event for showing or editing annotations
webannotator.showEditEvent = null;

webannotator.htmlWA = {
    /**
     * First load of WA on the page. Called by onmouseover
     */
    firstLoad: function () {
        // Executes only if WA has not been loaded yet.
        if (webannotator.noLoad) {
            var element = content.document.getElementById("WA_data_element");
            var currentDTD = element.getAttribute("dtd");
            webannotator.noLoad = false;

            // Disable all links
            webannotator.htmlWA.receiveWindowSwitchLinks(content.document, false, false);
            isDisable = true;

            // Remove firstLoad event from body
            content.document.body.removeEventListener("mouseover", webannotator.htmlWA.firstLoad, false);
        }
    },


    /**
     * Get selected text
     */
    getSelectedText: function () {
        var selection;
        if (content.window.getSelection){
            selection = content.window.getSelection();
        } else {
            alert("WA, error in selection !");
            return;
        }

        var newSelection = {
            rangeCount : selection.rangeCount,
            range: [],
            text: selection.toString()
        };
        var r;
        for (r = 0; r < selection.rangeCount; ++r ){
            newSelection.range[r] = selection.getRangeAt( r );
        }
        return newSelection;
    },

    /**
     * Show menu for editing an annotation. Called by onmouseover.
     */
    showEditAnnotationMenu: function (evt, id) {
        clearTimeout(webannotator.showEditEvent);
        var showDelay = webannotator.prefs.getIntPref('editIconsShowDelay');
        webannotator.htmlWA.receiveWindowUnblinkAnnotation();
        webannotator.popups.hide_popup("webannotator-edit-menu");
        webannotator.showEditEvent = setTimeout(function() {
            var currentSelection = webannotator.htmlWA.getSelectedText().text;
            if(currentSelection == "")	{
                webannotator.htmlWA.setIdToEdit(id);
                webannotator.popups.show_popup('webannotator-edit-menu', evt);
                webannotator.main.receiveSelectAnnotation(id);
                webannotator.htmlWA.receiveWindowBlinkAnnotation(id);
            }
        }, showDelay);
    },

    /**
     * Retain menu for editing an annotation (i.e., cancel
     * the timeout event for hidding the menu). Called when
     * mouseover on the menu.
     */
    retainEditAnnotationMenu: function () {
        clearTimeout(webannotator.showEditEvent);
    },

    /**
     * Hide menu for editing an annotation
     */
    hideEditAnnotationMenu: function () {
        clearTimeout(webannotator.showEditEvent);
        var hideDelay = webannotator.prefs.getIntPref('editIconsHideDelay');
        webannotator.showEditEvent = setTimeout(function() {
            webannotator.popups.hide_popup('webannotator-edit-menu');
            webannotator.main.receiveShowAnnotations();
            webannotator.htmlWA.receiveWindowUnblinkAnnotation();
        }, hideDelay);
    },

    /**
     * Set annotation identifier to be edited
     */
    setIdToEdit: function (id) {
        webannotator.id_to_edit = id;
    },

    /**
     * Get annotation identifier to be edited
     */
    getIdToEdit: function () {
        return webannotator.id_to_edit;
    },

    /**
     * Create a new annotation or edit the currently selected one
     * Called by editing popup menus;
     * In case of new annotation recursively find the same text and annotate it as SUGGEST
     */
    action: function (sectionName, suggestParent) {
        // If an id has been selected for edition, then
        // this is not a new annotation, but an old one
        // tha must be updated
        var selected_text = "";
        var new_annotation = false;

        if (webannotator.htmlWA.getIdToEdit() !== null) {
            var subtypes = "";
            var subtype;
            // subtypes
            for (subtype in webannotator.attributesOptions) {
                subtypes += subtype + ":" + webannotator.attributesOptions[subtype] + ";";
            }

            var element = content.document.getElementById("WA_data_element");
            var dtd = element.getAttribute("dtd");

            // Get selected spans
            var spans = content.document.getElementsByTagName("span");
            var i;
            for(i = spans.length -1; i >= 0 ; i--) {
                var span = spans[i];
                // Consider only spans that have the expected WA-id
                if(span.getAttribute("WA-id") == webannotator.htmlWA.getIdToEdit()) {
                    // Edit the spans
                    // New info and/or new colors
                    span.setAttribute("class", "WebAnnotator_" + sectionName);
                    span.setAttribute("wa-type", sectionName);
                    span.setAttribute("wa-subtypes", subtypes);
                    var color = webannotator.htmlWA.getColorFromNode(sectionName);
                    span.setAttribute("style", "color:" + color[0] + "; background-color:" + color[1] + ";");
                }
            }

            // Update info in bottom panel
            webannotator.main.receiveEditAnnotation(webannotator.htmlWA.getIdToEdit(), sectionName, subtypes);

            // Reset id to edit
            webannotator.htmlWA.setIdToEdit(null);
        }
        // If there is nothing to edit and some text has been selected
        else if (webannotator.aSelection.text!="")	{
            // create the spans to hightlight the selected text
            var aAttributes = {};
            element = content.document.getElementById("WA_data_element");
            webannotator.WAid = Math.max(webannotator.WAid, parseInt(element.getAttribute("WA-maxid"))) + 1;
            aAttributes["class"] = "WebAnnotator_" + sectionName;
            aAttributes["wa-type"] = sectionName;
            aAttributes["WA-id"] = String(webannotator.WAid);
            // subtype
            subtypes = "";
            
            if (!suggestParent){
                color = webannotator.htmlWA.getColorFromNode(sectionName);
                aAttributes["style"] = "color:" + color[0] + "; background-color:" + color[1] + ";";
                for (subtype in webannotator.attributesOptions) {
                    subtypes += subtype + ":" + webannotator.attributesOptions[subtype] + ";";
                }
            }
            // If it is SUGGEST
            else {
                aAttributes["style"] = 'border:2px solid black;';
                aAttributes["wa-suggest-parent-id"] = String(suggestParent["id"]);
                aAttributes["wa-suggest-parent-type"] = suggestParent["type"];
                aAttributes["wa-suggest-parent-subtypes"] = suggestParent["subtypes"];
            }
            
            aAttributes["wa-subtypes"] = subtypes;

            // Highlight (from Scrapbook)
            sbHighlighter.set(webannotator.aSelection, aAttributes);

            // Update the bottom panel
            webannotator.main.receiveNewAnnotation(webannotator.WAid, sectionName, webannotator.aSelection.text, subtypes);

            //For find same text on page and create SUGGEST annotations
            selected_text = webannotator.aSelection.text;
            new_annotation = true;

        }
        // Close edit menu
        webannotator.htmlWA.closeMenu();
        // Annotate all same text as SUGGEST
        if (new_annotation){
            if (selected_text !== ""){
                found_other_text = webannotator.htmlWA.selectText(selected_text)
                if (found_other_text){
                    webannotator.aSelection = webannotator.htmlWA.getSelectedText();
                    
                    if (!suggestParent){
                        suggestParent = {};
                        suggestParent["id"] = webannotator.WAid
                        suggestParent["type"] = sectionName
                        suggestParent["subtypes"] = subtypes
                    }
                    webannotator.htmlWA.action("SUGGEST", suggestParent);
                }
            }
        }
    },
    
    /**
     * Finds and selects first occurence of text in the body
     */
    selectText: function(text) {
        if (content.document.createNodeIterator && content.document.createTreeWalker){
            elems = content.document.createNodeIterator(
                content.document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
                );
            while((elem = elems.nextNode()) != null){
                var value = elem.textContent;
                if (~value.indexOf(text) && !elem.parentNode.hasAttribute("WA-id")) {
                    if (content.document.createRange) {
                        var rng = content.document.createRange();
                        rng.setStart(elem, value.indexOf(text));
                        rng.setEnd(elem, value.indexOf(text) + text.length);
                        sel = content.window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(rng);
                        return true;
                    } else{
                      //alert("Can't create range");
                      return false;
                    }
                } else{
                    //alert('���������� �� �������');
                }
            }

            //alert('No matches!');
            return false;
        }
        else {
            //alert("Can't iterate!")
            return false;
        }
    },
    
    /**
     * Reset attribute values
     */
    resetAttributesOption: function () {
        webannotator.attributesOptions = {};
    },

    /**
     * Set attributes for a specific annotation type
     */
    setAttributesOptions: function (type, atts) {
        if (atts != "") {
            var attTab = atts.split(' ');
            var att;
            for (att in attTab) {
                if (attTab[att] != "") {
                    webannotator.htmlWA.setAttributesOption(attTab[att], content.document.getElementById("input_" + type + "_" + attTab[att]).value);
                }
            }
        }
    },

    /**
     * Set a specific attribute value
     */
    setAttributesOption: function (key, value) {
        webannotator.attributesOptions[key] = value;
    },

    /**
     * Get a specific attribute value
     */
    getAttributesOption: function (key) {
        return webannotator.attributesOptions[key];
    },

    /**
     * Before user defines its own attributes for an annotation,
     * set the default values (if defined in the DTD)
     */
    setDefaultAttributesOptions: function (list) {
        if (list != "") {
            var attTab = list.split(' ');
            var att;
            for (att in attTab) {
                if (attTab[att] != "") {
                    var keyTab = attTab[att].split(':');
                    webannotator.htmlWA.setDefaultAttributesOption(keyTab[0], keyTab[1]);
                }
            }
        }
    },


    /**
     * Set default attribute if no one has been selected
     */
    setDefaultAttributesOption: function (key, value) {
        if (!webannotator.attributesOptions[key]) {
            webannotator.attributesOptions[key] = value;
        }
    },

    /**
     * Get selected text and open annotation main popup menu
     */
    openMenu: function (evt) {
        if(webannotator.session && !webannotator.isOpen) {
            webannotator.htmlWA.resetAttributesOption();
            webannotator.aSelection = webannotator.htmlWA.getSelectedText();
            if(webannotator.aSelection.text!="")	{
                webannotator.isOpen = true;
                webannotator.htmlWA.setIdToEdit(null);
                webannotator.popups.hide_popup("webannotator-edit-menu");
                webannotator.popups.show_popup("webannotator-main-menu", evt);
            }
        }
    },

    /**
     * Record the menu closing
     */
    closeMenu: function () {
        webannotator.isOpen=false;
        webannotator.htmlWA.clearSelection();
    },

    /**
     * Clear current selection
     */
    clearSelection: function() {
        var sel;
        if ( (sel = document.selection) && sel.empty ) {
            sel.empty();
        } else {
            if (content.window.getSelection) {
                content.window.getSelection().removeAllRanges();
            }
            var activeEl = document.activeElement;
            if (activeEl) {
                var tagName = activeEl.nodeName.toLowerCase();
                if ( tagName == "textarea" || (tagName == "input" && activeEl.type == "text") ) {
                    // Collapse the selection to the end
                    activeEl.selectionStart = activeEl.selectionEnd;
                }
            }
        }
    },

    /**
     * Update the secondary popup menu (subtype menu) according
     * to main type.
     */
    changeSecondaryMenu: function (elemType) {
        var _attributes = webannotator.currentDtdElements[elemType];
        var _attributeConstraints = webannotator.currentDtdElementConstraints[elemType];
        var menuSectionContent = new Array();

        var att;
        var stringTypes = "";
        var selectTypes = "";
        // Update attributes for this main type
        for (att in _attributes) {
            // if this attribute is a "required" field, add
            // a star to show that
            var required = false;
            var requiredInfo = [];
            if (_attributeConstraints[att] != "" &&
                _attributeConstraints[att].toUpperCase() != "#IMPLIED") {
                requiredInfo = ["sup", {}, "*"];
                required = true;
                menuSectionContent.push(["div", {}, [["span", {}, att], requiredInfo]]);
            } else {
                menuSectionContent.push(["div", {}, ["span", {}, att]]);
            }
            var types = _attributes[att];

            // CDATA attribute -> text box
            if (typeof types == "string") {
                // if a default value has been
                // asked in the DTD file
                var subtypes = "";
                if (_attributeConstraints[att].toUpperCase() != "#IMPLIED"
                    && _attributeConstraints[att].toUpperCase() != "#REQUIRED") {
                    subtypes += _attributeConstraints[att];
                }
                stringTypes += att + " ";
                menuSectionContent.push(["input", {id:'input_' + elemType + '_' + att, type:"text", value:subtypes}, ""]);
            }
            // named attributes -> select
            else {
                var options = new Array();
                if (!required) {
                options.push(["option", {att: att,
                                         onclick: function(e) {webannotator.htmlWA.setAttributesOption(this.getAttribute('att'), '');}
                                        },
                              ""
                             ]
                            );
                }
                var k;
                for(k = 0; k< types.length; k++) {
                    // if this attribute is the default value,
                    // pre-select it
                    // Compose the OPTION tag
                    if (_attributeConstraints[att] == types[k]) {
                        options.push(["option", {att: att,
                                                 elem_type : types[k],
                                                 onclick: function(e) {webannotator.htmlWA.setAttributesOption(this.getAttribute('att'), this.getAttribute('elem_type'));},
                                                 class:"WebAnnotator_" + elemType,
                                                 selected:"selected"
                                                },
                                      types[k]]);
                        selectTypes += att + ":" + types[k] + " ";
                    } else {
                        options.push(["option", {att: att,
                                                 elem_type : types[k],
                                                 onclick: function(e) {webannotator.htmlWA.setAttributesOption(this.getAttribute('att'), this.getAttribute('elem_type'));},
                                                 class:"WebAnnotator_" + elemType
                                                },
                                      types[k]]);
                    }
                }
                // if no default value but attribute is required,
                // the first value is pre-selected
                // (if default value, this will have no effect)
                if (required) {
                    selectTypes += att + ":" + types[0] + " ";
                }
                menuSectionContent.push(["select", {}, options]);
            }
        }

        // Create new dom for updating the secondary popup menu
        var dom = webannotator.misc.jsonToDOM(["div", {id:"webannotator-sec-menu", style:"font-family:arial;z-index:11001;position:absolute;display:none;border:thin solid black;background-color:white;text-align:center;"},
                                [
                                    ["div", {id:"webannotator-sec-menu-elems"}, menuSectionContent],
                                    ["div", {}, [["button", {href:"#",
                                                             elem_type: elemType,
                                                             elem_string_type: stringTypes,
                                                             elem_selection_type: selectTypes,
                                                             onclick: function(e) {webannotator.htmlWA.setAttributesOptions(this.getAttribute('elem_type'), this.getAttribute('elem_string_type')); webannotator.htmlWA.setDefaultAttributesOptions(this.getAttribute('elem_selection_type')); webannotator.htmlWA.action(this.getAttribute("elem_type")); webannotator.popups.hide_popup('webannotator-sec-menu'); webannotator.htmlWA.closeMenu();}
                                                            },
                                                  webannotator.bundle.GetStringFromName("waValidate")],
                                                 ["button", {href:"#",
                                                             elem_type: elemType,
                                                             elem_string_type: stringTypes,
                                                             elem_selection_type: selectTypes,
                                                             onclick: function(e) {webannotator.htmlWA.setAttributesOptions(this.getAttribute('elem_type'), this.getAttribute('elem_string_type')); webannotator.htmlWA.setDefaultAttributesOptions(this.getAttribute('elem_selection_type')); webannotator.popups.hide_popup("webannotator-sec-menu"); webannotator.htmlWA.closeMenu();}
                                                            },
                                                  webannotator.bundle.GetStringFromName("waCancel")]
                                                ]
                                    ]
                                ]
                               ],
                               document);

        // Update
        content.document.body.replaceChild(dom, content.document.getElementById("webannotator-sec-menu"));
    },

    /**
     * Open main annotation popup menu for editing an
     * existing annotation.
     */
    receiveWindowEditAnnotation: function (e) {
        webannotator.isOpen = true;
        webannotator.popups.hide_popup('webannotator-edit-menu');
        webannotator.popups.show_popup("webannotator-main-menu", e);
    },

    /**
     * Stop annotation blinking when no longer selected
     */
    receiveWindowUnblinkAnnotation: function () {
        var spans;
        spans = content.document.getElementsByTagName("span");
        var i;
        for(i = spans.length -1; i >= 0 ; i--) {
            if(spans[i].getAttribute("WA-id") !== null) {
                spans[i].style.textDecoration = "none";
            }
        }
    },

    /**
     * Make blink every annotation having specified id
     */
    receiveWindowBlinkAnnotation: function (id, go) {
        var spans = content.document.getElementsByTagName("span");
        var first = true;
        var i;
        for(i = spans.length -1; i >= 0 ; i--) {
            if(spans[i].getAttribute("WA-id") == id) {
                spans[i].style.textDecoration = "blink";
                if (go && first) {
                    spans[i].scrollIntoView();
                    first = false;
                }
            }
        }
    },

    /**
     * Enable/Disable links and javascript events on the current page
     */
    receiveWindowSwitchLinks: function (doc, isClone, value) {
        if (doc == null) {
            doc = content.document.body;
        } else {
            doc = doc.getElementsByTagName("body")[0];
        }
        var links = doc.getElementsByTagName("*");
        var wa_prefix = "WA_temp_";
        var i;
        // If an argument is defined
        if (value !== null) {
            // if activation is asked and already activated
            // or deactivation is asked and already deactivated
            // do nothing
            if (value == webannotator.linksEnable) {
                return;
            }
            // else switch !
        }
        // Enable -> Disable
        var _status;
        if (webannotator.linksEnable) {
            for(i = 0; i < links.length; i++) {
                var toRemove = [];
                var toPush = {};
                var element = links[i];
                var attrs = element.attributes;
                var attrName; var length = attrs.length;
                for (var attr, j = 0 ; j < length; j++){
                    attr = attrs.item(j);
                    attrName = attr.nodeName.toLowerCase();
                    if ((element.nodeName.toLowerCase() === "a" && attrName.toLowerCase() === "href") || (attrName.startsWith("on")) || (attrName.startsWith("ajaxify"))) {
                        toRemove.push(attrName);
                        toPush[wa_prefix + attrName] = element.getAttribute(attrName);
                    }
                }
                for (var attrName in toRemove) {
                    element.removeAttribute(toRemove[attrName]);
                }
                for (var attrName in toPush) {
                    element.setAttribute(attrName, toPush[attrName]);
                }
            }
            _status = "disable";
            //element.setAttribute("link-status", "disable");
            webannotator.linksEnable = false;
        }
        // Disable -> Enable
        else {
            for(i =0; i < links.length; i++) {
                var element = links[i];
                var attrs = element.attributes;
                var attrName; var length = attrs.length;
                var toRemove = [];
                var toPush = {};
                for (var j = 0 ; j < length; j++){
                    var attr = attrs.item(j);
                    attrName = attr.nodeName;
                    if (attrName.substring(0, wa_prefix.length).toLowerCase() === wa_prefix.toLowerCase()) {
                        toRemove.push(attrName);
                        toPush[attrName.substring(wa_prefix.length, attrName.length)] = element.getAttribute(attrName);
                   }
                }
                for (var attrName in toRemove) {
                    element.removeAttribute(toRemove[attrName]);
                }
                for (var attrName in toPush) {
                    element.setAttribute(attrName, toPush[attrName]);
                }


                // var element = links[i];
                // var attrs = element.attributes;
                // for(var key in attrs) {
                // 	if (key.indexOf(wa_prefix, 0) == 0) {
                // 		element.setAttribute(key.substring(length(wa_prefix), key), element.getAttribute(key));
                // 		element.removeAttribute(key);
                // 	}
                // }
            }
            _status = "enable";
            //element.setAttribute("link-status", "enable");
            webannotator.linksEnable = true;
        }
        if (!isClone) {
            webannotator.main.receiveSwitchLinks(_status);
        }
    },


    // /**
    //  * Enable/Disable links on the current page
    //  */
    // receiveWindowSwitchLinks: function (doc, isClone, value) {
    // 	if (doc == null) {
    // 		doc = content.document;
    // 	}
    // 	var links = doc.getElementsByTagName("a");
    // 	var i;
    // 	// If an argument is defined
    // 	if (value !== null) {
    // 		// if activation is asked and already activated
    // 		// or deactivation is asked and already deactivated
    // 		// do nothing
    // 		if (value == webannotator.linksEnable) {
    // 			return;
    // 		}
    // 		// else switch !
    // 	}
    // 	// Enable -> Disable
    // 	var _status;
    // 	if (webannotator.linksEnable) {
    // 		for(i =0; i < links.length; i++) {
    // 			if (links[i].getAttribute("hrefTemp") == null) {
    // 				var att=links[i].getAttribute("href");
    // 				if (att !== null) {
    // 					links[i].removeAttribute("href");
    // 					links[i].setAttribute("hrefTemp",att);
    // 				}
    // 			}
    // 		}
    // 		_status = "disable";
    // 		//element.setAttribute("link-status", "disable");
    // 		webannotator.linksEnable = false;
    // 	}
    // 	// Disable -> Enable
    // 	else {
    // 		for(i =0; i < links.length; i++) {
    // 			att=links[i].getAttribute("hrefTemp");
    // 			if (att !== null) {
    // 				links[i].removeAttribute("hrefTemp");
    // 				links[i].setAttribute("href",att);
    // 			}
    // 		}
    // 		_status = "enable";
    // 		//element.setAttribute("link-status", "enable");
    // 		webannotator.linksEnable = true;
    // 	}
    // 	if (!isClone) {
    // 		webannotator.main.receiveSwitchLinks(_status);
    // 	}
    // },

    /**
     * Move annotation popups position
     */
    shift_position: function (x, y) {
        var shift = 10;
        var id = "webannotator-main-menu";
        var elem = content.document.getElementById(id);
        var activeElem = null;
        var top;
        var left;
        if (elem.style.display != "none") {
            activeElem = elem;
        }
        else {
            id = "webannotator-sec-menu";
            elem = content.document.getElementById(id);
            if (elem.style.display != "none") {
                activeElem = elem;
            }
        }

        if (activeElem !== null) {
            if (x != 0) {
                left = parseInt(elem.style.left.substr(0, elem.style.left.length - 2)) + x * shift;
                if (left < 0) {
                    left = 0;
                }
                elem.style.left = left + "px";
                webannotator.userShiftX += x * shift;
            }
            if (y != 0) {
                top = parseInt(elem.style.top.substr(0, elem.style.top.length - 2)) + y * shift;
                if (top < 0) {
                    top = 0;
                }
                elem.style.top = top + "px";
                webannotator.userShiftY += y * shift;
            }
        }
    },

    /**
     * Get color attributed to element n in DTD dtd.
     * If none has been attributed, get the following
     * free default color.
     */
    getColor: function (dtd, n, i) {
        if (webannotator.colors[dtd]) {
            if (webannotator.colors[dtd][n]) {
                return webannotator.colors[dtd][n];
            } else {
                return null;
            }
        } else {
            if (i == -1) {
                alert("problem getColor !");
            } else if (i >= 0) {
                var id = i % 16;
                return webannotator.origColors[id];
            } else {
                return null;
            }
        }
    },

    /**
     * Get the color of an element
     */
    getColorFromNode: function (n) {
        var colorNodes = content.document.getElementsByTagName("WA-color");
        var i;
        for (i = 0 ; i < colorNodes.length ; i++) {
            var htmlColorElement = colorNodes[i];
            if (htmlColorElement.getAttribute("type") == n) {
                return [htmlColorElement.getAttribute("fg"), htmlColorElement.getAttribute("bg")];
            }
        }
        alert("getColorFromNode, element " + n + " not found.");
    },

    setColor: function (dtd, n, fg, bg) {
        webannotator.colors[dtd][n] = [fg, bg];
    }
};
