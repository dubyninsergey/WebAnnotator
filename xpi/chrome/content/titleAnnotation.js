// See license.txt for terms of usage

// namespace.
if (typeof webannotator == "undefined") {
    var webannotator = {};
}

webannotator.titleAnnotation = {
    on: false,

    togglePopup: function(){
        if (!webannotator.titleAnnotation.on){
            webannotator.titleAnnotation.showPopup();
        }
        else{
            webannotator.titleAnnotation.hidePopup();
        }
    },

    showPopup: function(){
        var popup = webannotator.titleAnnotation.getPopup();
        if (popup){
            popup.style.display = 'block';
            webannotator.titleAnnotation.activateToolbarButton();
        }
        webannotator.titleAnnotation.on = true;
    },

    hidePopup: function(){
        var popup = webannotator.titleAnnotation.getPopup();
        if (popup){
            popup.style.display = 'none';
        }
        webannotator.titleAnnotation.deactivateToolbarButton();
        webannotator.titleAnnotation.on = false;
    },

    getPopup: function(doc){
        doc = doc || content.document;

        var titlePopup = doc.getElementById("webannotator-title-edit-popup");
        if (titlePopup){ // already created
            return titlePopup;
        }

        // Get title from WA-title if already existing
        // Otherwise from <title> in headers
        var title = doc.getElementsByTagName('WA-title')[0];
        var waTitle = true;
        if (!title){
            waTitle = false;
            title = doc.getElementsByTagName('title')[0];
            // If no <title> in page, then skip
            if (!title){
                return;
            }
        }

        // There is no "close" element intentionally (to prevent users
        // from annotating it). Use toolbar button to toggle the popup.
        var titlePopupTagName = "div";
        var titlePopupAtts = {
           id: "webannotator-title-edit-popup",
           style: "border-style:ridge;padding:0;z-index:11000;position:fixed;color:#333;background:#fff;margin:0 auto;width:30%;right:0;top:100px;box-shadow:0 0 1em b    lack;border:2px solid blue;display:none;overflow:auto;max-height:100px;"
        };
		
        var titlePopupMoverTagName = "input";
        var titlePopupMoverAtts = {
           id: "webannotator-title-edit-mover-popup",
           type: "button",
           class: "myButton",
           value: "Move up",
           style: "left:0;top:0;margin-right:10px",
		   onclick:function(e) {
			    var title = content.document.getElementById("webannotator-title-edit-popup");
                            var title_mover = content.document.getElementById("webannotator-title-edit-mover-popup");
			    var position = title.style.position;
			    if (position == "fixed") {
                                   title_mover.value = 'Move right'
				   title.style.position="";
				   title.style.width="";
				}
				else {
                                        title_mover.value = 'Move up'
					title.style.position="fixed";
					title.style.width="355px";
				}
				}
        };
        // waTitle should be true when there is <wa-title> html element in the page.
        // It is the case when you're editing annotation of an already annotated page.
        // Instead of creating a popup with page title contents you need to create a
        // popup with wa-title contents; it may contain annotation span elements.
        var mover = doc.getElementById(titlePopupMoverAtts["id"]);
            while (mover !== null) {
                    mover.parentNode.removeChild(mover);
                    mover = doc.getElementById(titlePopupMoverAtts["id"]);
            }
        if (waTitle) {
            titlePopup = webannotator.misc.jsonToDOM([titlePopupTagName, titlePopupAtts, ""], doc);
            while(title.firstChild){
                titlePopup.appendChild(title.firstChild);
            }
            titlePopupMover = webannotator.misc.jsonToDOM([titlePopupMoverTagName, titlePopupMoverAtts, ""], doc);
            titlePopup.insertBefore(titlePopupMover, titlePopup.firstChild);
            // remove all WA-title elements because the can't coexist with popup
            webannotator.titleAnnotation.removeWAtitleElems();
        } else {
            titlePopup = webannotator.misc.jsonToDOM([titlePopupTagName, titlePopupAtts, ""], doc);
            str = title.innerHTML;
            str = str.replace(new RegExp("&lt;", "g"), "<").replace(new RegExp("&gt;", "g"), ">");
            titlePopup.innerHTML = str;
            titlePopupMover = webannotator.misc.jsonToDOM([titlePopupMoverTagName, titlePopupMoverAtts, ""], doc);
            titlePopup.insertBefore(titlePopupMover, titlePopup.firstChild);
        }

        doc.body.insertBefore(titlePopup, doc.body.firstChild);
        return titlePopup;
    },

    activateToolbarButton: function(){
        WebAnnotator_titleButton = document.getElementById('WebAnnotator_titleButton')
        if (WebAnnotator_titleButton !== null){
                WebAnnotator_titleButton.classList.add('active');
        }
    },

    deactivateToolbarButton: function(){
        WebAnnotator_titleButton = document.getElementById('WebAnnotator_titleButton')
        if (WebAnnotator_titleButton !== null){
                WebAnnotator_titleButton.classList.remove('active');
        }
    },

    removeWAtitleElems: function(doc){
        doc = doc || content.document;
        var waTitleElems = doc.getElementsByTagName('WA-title');
        while (waTitleElems.length){
            var elem = waTitleElems[0];
            elem.parentNode.removeChild(elem);
        }
    },

    createWAtitleElemFromPopup: function(doc){
        // add WA-title element with title popup contents
        var popup = webannotator.titleAnnotation.getPopup(doc);
        if (popup){
            var htmlElement = doc.createElement("WA-title");

            // Copy the content of title's popup into
            // WA-title tag for saving
            var childNodes = popup.childNodes;
            for (var i = 0 ; i < childNodes.length ; i++) {
                htmlElement.appendChild(childNodes[i].cloneNode(true));
            }
            doc.documentElement.appendChild(htmlElement);

            // hide WA-title element only if "Keep colors" is unchecked
            // because it is nice to see colored annotated title in saved HTML
            if (webannotator.prefs.getBoolPref('savecolors')){
                htmlElement.setAttribute("style", "box-shadow:0 0 1em black;border:2px solid blue;padding:0.5em;");
            }
            else{
                htmlElement.setAttribute("style", "display:none;");
            }

            // remove popup because it can't coexist with WA-title element
            popup.parentNode.removeChild(popup);
        }
    }

};
