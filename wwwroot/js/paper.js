﻿
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

    connection.invoke("lockElem", pathForSelect.name).catch(function (err) {
        return console.error(err.toString());
    });
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
        connection.invoke("changePos", pathForSelect.name, pathForSelect.position.x, pathForSelect.position.y).catch(function (err) {
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
    setNote(rect.bounds, "◆", ("idd" + nameF), true);
    nameF++;
    rect.remove();
}

function removeElem(event) {
    if (pathForSelect)
        pathForSelect.remove();
}

function editeText(event) {
    if (event.item) {
        var p = event.item.hitTest(event.point, hitOptions).item;
        if (p.className == 'PointText') {
            var bounds = p.bounds;
            bounds.width += 16;
            bounds.height += 16;
            setText(event, p.bounds, p.content);
            selectElem(event);
            removeElem(event);
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
    setVar(connection, group, lockList)
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

}).catch(function (err) {
    return console.error(err.toString());
});
    