
var nameF = 0;
var option = 0;
var path;
var segment, pathForSelect;
var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};
setListnerfor('brush', 0);
setListnerfor('note', 1);
setListnerfor('text', 2);
setListnerfor('erase', 3);
setListnerfor('move', 4);
var rect;
var group = new Group()
var lockList = {};

function onMouseDown(event) {
    switch (option) {
        case 0:
            prepareDraw(event);
            break;
        case 1:
            startArea(event);
            break;
        case 3:
            selectElem(event);
            break;
        case 4:
            selectElem(event);
            break;
    }
}


function prepareDraw(event) {
    if (path) {
        path.selected = false;
    }
    path = new Path({
        segments: [event.point],
        strokeColor: 'black',
        strokeWidth: 5,
        fullySelected: true,
    });
    path.name = "id" + path.id
}



function selectElem(event) {
    segment = pathForSelect = null;
    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult) {
        return;
    }
    pathForSelect = group.children[hitResult.item.name];
    if (!lockList[pathForSelect.name]) {
        connection.invoke("lockElem", pathForSelect.name).catch(function (err) {
            return console.error(err.toString());
        });
    } else {
        alert("Item is busy")
        pathForSelect = null;
    }
}

function startArea(e) {
    rect = new paper.Path.Rectangle({
        from: e.downPoint,
        to: e.point,
        strokeWidth: 1,
        strokeColor: 'blue'
    });
}

function onMouseMove(event) {
    project.activeLayer.selected = false;
    if (event.item)
        event.item.selected = true;
}

function onMouseDrag(event) {
    switch (option) {
        case 0:
            path.add(event.point);
            break;
        case 1:
            adjustArea(event);
            break;
        case 4:
            dragElem(event);
            break;
    }
}

function adjustArea(e) {
    if (rect) {
        rect.remove();
    }
    rect = new paper.Path.Rectangle({
        from: e.downPoint,
        to: e.point,
        strokeWidth: 1,
        strokeColor: 'blue'
    });
}

function dragElem(event) {
    if (pathForSelect) {
        pathForSelect.position += event.delta;
        var svg = pathForSelect.exportSVG({ asString: true });
        connection.invoke("changePos", pathForSelect.name, pathForSelect.position.x, pathForSelect.position.y,svg).catch(function (err) {
            return console.error(err.toString());
        });
    }
}

// When the mouse is released, we simplify the path:
function onMouseUp(event) {
    switch (option) {
        case 0:
            setLine(event)
            break;
        case 1:
            editeNote(event);
            break;
        case 2:
            editeText(event);
            break;
        case 3:
            removeElem(event)
            break;
    }
}

function setLine(e) {
    path.simplify(10);
    group.addChild(path);
    var svg = path.exportSVG({ asString: true });
    connection.invoke("createFromSVG", path.name, svg).catch(function (err) {
        return console.error(err.toString());
    });

}

function editeNote(event) {
    if (rect) {
        rect.remove();
    }

    rect = new paper.Path.Rectangle({
        from: event.downPoint,
        to: event.point,
        strokeWidth: 1,
        fillColor: "Aqua",
        strokeColor: 'blue'
    });
    setNote(rect.bounds, "-", ("idd" + nameF), true);
    nameF++;
    rect.remove();
}

function removeElem(event) {
    if (pathForSelect) {
        connection.invoke("removeSVG", pathForSelect.name).catch(function (err) {
            return console.error(err.toString());
        });
        pathForSelect.remove();
    }
}

function editeText(event) {
    if (event.item) {

        var p = event.item.hitTest(event.point, hitOptions).item;
        if (p.className == 'PointText') {
            if (!lockList[p.name]) {
                var bounds = p.bounds;
                bounds.width += 16;
                bounds.height += 16;
                connection.invoke("lockElem", p.name).catch(function (err) {
                    return console.error(err.toString());
                });
                setText(event, p.bounds, p.content);
                selectElem(event);
                removeElem(event);
            } else alert("Item is busy")
        }
    }
    else {
        var bounds = new Rectangle(event.downPoint, [100, 40]);
        setText(event, bounds, "");
    }
}

function setListnerfor(id, number) {
    document.getElementById(id).addEventListener('click', function (event) {
        option = number;
    })
}

$("#brush").prop("disabled", true);
$("#note").prop("disabled", true);
$("#text").prop("disabled", true);
$("#erase").prop("disabled", true);
$("#move").prop("disabled", true);

var connection = new signalR.HubConnectionBuilder().withUrl("/marmb").build();



connection.on("addSVG", function (svg, id, x, y) {
    item = project.exportSVG(svg)
    item.point = new Point(x, y);
    item.name = id;
});

connection.start().then(function () {
    $("#brush").prop("disabled", false);
    $("#note").prop("disabled", false);
    $("#text").prop("disabled", false);
    $("#erase").prop("disabled", false);
    $("#move").prop("disabled", false);

    connection.hub.disconnected(function () {
        setTimeout(function () {
            $.connection.hub.start();
        }, 5000); // Restart connection after 5 seconds.
    });

    connection.invoke("getLocked").catch(function (err) {
        return console.error(err.toString());
    });

    connection.on("setLocked", function (list) {
        for (var i = list.length - 1; i >= 0; i--) {
            lockList[list[i]] = true;
        }
    })

    connection.invoke("getSVG").catch(function (err) {
        return console.error(err.toString());
    });
    connection.on("setSVG", function (list) {
        for (var i = 0; i < list.length; i++) {
            console.log(list[i])
            var el = project.importSVG(list[i].content);
            el.name = list[i].name;
            group.addChild(el);
        }
    })
    connection.on("error", function (list) {
        console.log(list)
    })
    setVar(connection, group, lockList);
    connection.on("createFromSVG", function (id, svg) {
        var el = group.children[id];
        if (el) {
            if (lockList[el.name]) {
                lockList[el.name] = false;
                lockList[el.name + el.name] = true;
            }
            el.name = el.name + el.name;
        }
        el = project.importSVG(svg);
        el.name = id;
        group.addChild(el);      
    })
    connection.on("changePos", function (id, x, y) {
        var el = group.children[id];
        group.children[id].position = new Point(x, y);
        
    })

    connection.on("addLock", function (id) {
        lockList[id] = true;
    })
    connection.on("unLock", function (id) {
        lockList[id] = false;
    })

    connection.on("removeSVG", function (id) {
        group.children[id].remove()
    })

}).catch(function (err) {
    return console.error(err.toString());
});
    
