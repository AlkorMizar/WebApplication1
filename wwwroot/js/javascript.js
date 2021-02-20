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
            console.log(text.name)
            value = e.target.value;
            var svg = text.exportSVG({ asString:true});
            connection.invoke("createFromSVG", text.name,svg).catch(function (err) {
                return console.error(err.toString());
            });
        }
        $(e.target).remove();
    })
};



function setNote(bounds, text, name,fl) {
    var pos = $("#parent-div").position();
    var x = bounds.x ,
        y = bounds.y ,
        h = bounds.height,
        w = bounds.width;
    var textarea = $("<div id='" + name + "'contenteditable='true'" +
        "style='position:absolute; left:" + (bounds.x + pos.left) +
        "px; top:" + (bounds.y + pos.top) + "px; width: " + bounds.width +
        "px; height: " + bounds.height +
        "px; resize; background-color:PaleTurquoise;border-color:MidnightBlue;border-style: solid;overflow: auto'></div>");
    textarea.append(text);
    $(textarea).appendTo("#parent-div");

    if (fl) {
        textarea.focus();
        placeCaretAtEnd(document.getElementById(name));
    }

    draggable = new PlainDraggable(document.getElementById(name));
    $(textarea).keyup(function (e) {
        if ((e.keyCode || e.which) == 13) {
            $(e.target).append("◆");
            placeCaretAtEnd(document.getElementById(e.target.id));
        }
        console.log(document.getElementById(e.target.id).innerHTML)
        connection.invoke("changeTextOfNote", e.target.id, document.getElementById(e.target.id).innerHTML).catch(function (err) {
            return console.error(err.toString());
        });
    })

    $(textarea).focusout(function (e) {
        $(e.target).prop('readonly', true);
        connection.invoke("unlockElem", e.target.id).catch(function (err) {
            return console.error(err.toString());
        });
    });

    $(textarea).focusin(function (e) {
        alert()
        placeCaretAtEnd(document.getElementById(e.target.id));
        connection.invoke("lockElem", e.target.id).catch(function (err) {
            return console.error(err.toString());
        });
    })
    
    $(textarea).mouseup(function (e) {
        console.log("ch")
        var id = e.target.id,
            x = $(e.target).position().left,
            y = $(e.target).position().top;
        connection.invoke("changePosOfNote",id,x,y ).catch(function (err) {
            return console.error(err.toString());
        });
        connection.invoke("unlockElem", e.target.id).catch(function (err) {
            return console.error(err.toString());
        });
    })
    if(fl)
        connection.invoke("createNote", name, x, y, text,h,w).catch(function (err) {
            return console.error(err.toString());
        });

    textarea.click(function (e) {
        console.log("cl")
        if ($("#erase").prop("checked")) {
            $(e.target).remove();
        } else if ($("#note").prop("checked")) {
            $(e.target).prop('readonly', false);
            placeCaretAtEnd(document.getElementById(e.target.id));
            $(e.target).focus();
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
    connection.on("changePosOfNote", function (id, x, y) {
        console(id)
        id = "#" + id;
        $(id).css({ top: y+"",left:x+"" })
    })
    
    connection.on("createNote", function (id, x, y, text, h, w) {
        alert()
        var el = (document.getElementById(id));
        if (el) {
            if (lockList[el.id]) {
                lockList[el.id] = false;
                lockList[el.id + el.id] = true;
            }
            el.id = el.id + el.id;
            
            draggable = new PlainDraggable(document.getElementById(el.id));
        }

        setNote({ "y": y, "x": x, "height": h, "width":w},text,id,false)
    })

    connection.on("changeTextOfNote", function (id, text) {
        id = "#" + id;
        console.log(text)
        $(id).html(text)
        
    })
}

