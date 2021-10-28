var group;
var connection;
var lockList;
function setText(event, bounds, text) {
    var pos = $("#parent-div").position();
    var textarea = $(
        "<textarea class='dynamic-textarea' " +
        "style='position:absolute; left:" + (bounds.x + pos.left) +
        "px; top:" + (bounds.y + pos.top) + "px; width: " + bounds.width +
        "px; height: " + bounds.height +
        "px; resize: both;' placeholder='Enter text' cols='20' wrap='hard'>" + text + "</textarea>");
    $("#parent-div").append(textarea);

    textarea.focus();

    textarea.focusout(function (e) {
        if (e.target.value.trim() != "") {
            var pos = $("#parent-div").position();
            var y = $(e.target).position().top - pos.top + 16
            var x = $(e.target).position().left - pos.left
            var text = new paper.PointText({
                point: [x, y],
                content: e.target.value,
                fillColor: 'black',
                fontFamily: 'Courier New',

                fontSize: 16
            });
            text.name = "id" + text.id
            group.addChild(text);
            value = e.target.value;
            var svg = text.exportSVG({ asString:true});
            connection.invoke("createFromSVG", text.name,svg).catch(function (err) {
                return console.error(err.toString());
            });
        }
        $(e.target).remove();
    })
};



function setNote(bounds, text, name, fl) {
    var pos = $("#parent-div").position();
    var textarea;
    if (fl) {
  
        var x = bounds.x,
            y = bounds.y,
            h = bounds.height,
            w = bounds.width;
        textarea = $("<div id='" + name + "'contenteditable='true'" +
            "style='position:absolute; left:" + (bounds.x + pos.left) +
            "px; top:" + (bounds.y + pos.top) + "px; width: " + bounds.width +
            "px; height: " + bounds.height +
            "px; resize: both;; background-color:PaleTurquoise;border-color:MidnightBlue;border-style: solid;overflow: auto'></div>");
        textarea.append(text);
    } else textarea = $(text);
    $(textarea).appendTo("#parent-div");

    if (fl) {
        textarea.focus();
        placeCaretAtEnd(document.getElementById(name));
    }
    
    draggable = new PlainDraggable(document.getElementById(name));
    draggable.onDragStart = function (e) {
        if (lockList[this.element.id]) {
            this.containment = { left: 0, top: 0, width: 0, height: 0 };
            alert("Item is busy")
        } else {
            if (!$("#move").prop("checked")) {
                this.containment = { left: 0, top: 0, width: 0, height: 0 };
            } else {
                this.containment = { left: pos.left, top: pos.top, width: 5000, height: 5000 };
            }
        }
    }
 
    $(textarea).keyup(function (e) {
        if (!lockList[e.target.id]) {
            if ((e.keyCode || e.which) == 13) {
                $(e.target).append("-");
                placeCaretAtEnd(document.getElementById(e.target.id));
            }
            connection.invoke("changeTextOfNote", e.target.id, document.getElementById(e.target.id).innerHTML, document.getElementById(e.target.id).outerHTML).catch(function (err) {
                return console.error(err.toString());
            });
        } else {
            alert("Item is busy")
        }
    })

    $(textarea).focusout(function (e) {
        connection.invoke("unlockElem", e.target.id).catch(function (err) {
            return console.error(err.toString());
        });
    });

    $(textarea).focusin(function (e) {
        if (!lockList[e.target.id]) {
            if ($("#note").prop("checked")) {
                placeCaretAtEnd(document.getElementById(e.target.id));
                connection.invoke("lockElem", e.target.id).catch(function (err) {
                    return console.error(err.toString());
                });
            } else {
                e.target.blur()
            }
        } else {
            e.target.blur();
            alert("Item is busy")
        }
    })

    draggable.onMove = function (e) {
        var id = this.element.id,
            x = e.left,
            y = e.top;
        var name = this.element.id
        connection.invoke("changePosOfNote", id, x, y, document.getElementById(name).outerHTML).catch(function (err) {
            return console.error(err.toString());
        });
        connection.invoke("unlockElem", name).catch(function (err) {
            return console.error(err.toString());
        });
    }

    if (fl)
        connection.invoke("createNote", name, textarea[0].outerHTML).catch(function (err) {
            return console.error(err.toString());
        });

    textarea.click(function (e) {
        if (!lockList[e.target.id]) {
            if ($("#erase").prop("checked")) {
                connection.invoke("lockElem", e.target.id).catch(function (err) {
                    return console.error(err.toString());
                });
                connection.invoke("removeNote", e.target.id).catch(function (err) {
                    return console.error(err.toString());
                });
                $(e.target).remove();
            } else if ($("#note").prop("checked")) {
                placeCaretAtEnd(document.getElementById(e.target.id));
                $(e.target).focus();
            }
        }
    })
};

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
        && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}



function setVar(con, gr,ll) {
    group = gr;
    lockList=ll
    connection = con;

    connection.hub.disconnected(function () {
        setTimeout(function () {
            $.connection.hub.start();
        }, 5000); // Restart connection after 5 seconds.
    });

    connection.hub.disconnected(function () {
        setTimeout(function () {
            $.connection.hub.start();
        }, 5000); // Restart connection after 5 seconds.
    });

    connection.invoke("getHTML").catch(function (err) {
        return console.error(err.toString());
    });
    connection.on("setHTML", function (list) {
        for (var i = 0; i < list.length; i++) {
            setNote(null, list[i].content, list[i].name, false)
        }
    })

    connection.on("changePosOfNote", function (id, x, y) {
        draggable = new PlainDraggable(document.getElementById(id));
        draggable.left = x;
        draggable.top = y;
    })

    connection.on("removeNote", function (id) {
        $("#"+id).remove();
    })

    connection.on("createNote", function (id, html) {
        var el = (document.getElementById(id));
        if (el) {
            if (lockList[el.id]) {
                lockList[el.id] = false;
                lockList[el.id + el.id] = true;
            }
            el.id = el.id + el.id;
            
            draggable = new PlainDraggable(document.getElementById(el.id));
        }

        setNote(null, html, id, false)
    })

    connection.on("changeTextOfNote", function (id, text) {
        id = "#" + id;
        $(id).html(text)
        
    })

    
}

