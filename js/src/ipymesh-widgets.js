var widgets = require('jupyter-js-widgets');
var _ = require('underscore');
var d3 = require('d3');

// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var PSLGEditorModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(_.result(this, 'widgets.DOMWidgetModel.prototype.defaults'), {
        _model_name: 'PSLGEditorModel',
        _view_name: 'PSLGEditorView',
        _model_module : 'ipymesh-widgets',
        _view_module : 'ipymesh-widgets',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        width: 600,
        height: 600,
        Lx: 1.0,
        Ly: 1.0,
        x0: 0.0,
        y0: 0.0,
        vertices: [],
        vertexFlags: [],
        segments: [],
        segmentFlags: [],
        regions: [],
        regionFlags: [],
        holes: [],
        boundaryTypes: [],
        regionTypes: [],
    })
}, {
    serializers: _.extend({
        vertices: { deserialize: widgets.unpack_models },
        vertexFlags: { deserialize: widgets.unpack_models },
        segments: { deserialize: widgets.unpack_models },
        segmentFlags: { deserialize: widgets.unpack_models },
        regions: { deserialize: widgets.unpack_models },
        regionFlags: { deserialize: widgets.unpack_models },
        holes: { deserialize: widgets.unpack_models },
        boundaryTypes: { deserialize: widgets.unpack_models },
        regionTypes: { deserialize: widgets.unpack_models },
    }, widgets.DOMWidgetModel.serializers)
});


var PSLGEditorView = widgets.DOMWidgetView.extend({
    render: function() {
        PSLGEditorView.__super__.render.apply(this, arguments);
        this.el.className = "jupyter-widget pslg_widget";
        this.el.innerHTML = '';
        var width = this.model.get('width');
        var height = this.model.get('height');

        var svg = d3.select(this.el).append("svg")
            .attr("width", width )
            .attr("height", height)
            .attr("tabindex", 1);
	
        this.svg = svg;
	
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none");
        
        svg.append("path");
        
        this.el.appendChild(document.createElement('form'));
        this.el.children[1].innerHTML= '<label for="regionType">Region:</label> \
  <select id="regionType"></select><br>';
        this.el.appendChild(document.createElement('form'));
        this.el.children[2].innerHTML= '<label for="boundaryType">Boundary:</label> \
  <select id="boundaryType"></select><br>';
	this.el.appendChild(document.createElement('div'));
        this.el.children[3].innerHTML= '<p> \
    Click to add new vertex. Hold the r key and click to add new \
    region. Hold the h key and click to add new hole.  Click and drag \
    between two vertices to create a segment. Select an entity and \
    type backspace or delete to remove. Use the pull down menus to \
    set the boundary type for new vertices and segments and region type \
    for new regions. \
  </p>';

        d3.select(this.el.children[1].children[1])
	    .selectAll("option")
            .data(this.model.get('regionTypes'))
            .enter().append("option")
            .attr("value", function(d) { return d; })
            .text(function(d) { return d; });
	
	d3.select(this.el.children[2].children[1])
            .selectAll("option")
            .data(this.model.get('boundaryTypes'))
            .enter().append("option")
            .attr("value", function(d) { return d; })
            .text(function(d) { return d; });
        
        this.graph_changed();
        this.model.on('change:vertices', this.graph_changed, this);
        this.model.on('change:vertexFlags', this.graph_changed, this);
        this.model.on('change:segments', this.graph_changed, this);
        this.model.on('change:segmentFlags', this.graph_changed, this);
        this.model.on('change:regions', this.graph_changed, this);
        this.model.on('change:regionFlags', this.graph_changed, this);
    },
    
    graph_changed: function() {
	var svg=this.svg;
        var that=this;
        var width = this.model.get('width');
        var height = this.model.get('height');
        var Lx = this.model.get('Lx');
        var Ly = this.model.get('Ly');
        var x0 = this.model.get('x0');
        var y0 = this.model.get('y0');
        var pxOfx = d3.scale.linear()
            .domain([x0,Lx])
            .range([0,width]);
        var pyOfy = d3.scale.linear()
            .domain([y0,Ly])
            .range([height,0]);
	var colors = d3.scale.category10();
	
        var verticesList = this.model.get('vertices');
        var vertexFlagsList = this.model.get('vertexFlags');
        var vertices=[];
        if (verticesList) {
	    console.log("vertices list");
            vertices = d3.range(0,verticesList.length).map(function(i){
                return {id: i,
			x : pxOfx(verticesList[i][0]), 
                        y : pyOfy(verticesList[i][1]),
			type : vertexFlagsList[i]
		       };
	    });
        }
	var lastVertexId=verticesList.length;

        var segmentsList = this.model.get('segments');
        var segmentFlagsList = this.model.get('segmentFlags');
        var segments=[];
        if (segmentsList) {
            segments = d3.range(0,segmentsList.length).map(function(i){
                return {source : vertices[segmentsList[i][0]],
                        target : vertices[segmentsList[i][1]],
			type : segmentFlagsList[i]
		       };
	    });
	    console.log("segments list", segments);
        }
	
        var regionsList = this.model.get('regions');
        var regionFlagsList = this.model.get('regionFlags');
        var regions=[];
        if (regionsList) {
	    console.log("regions list",regionsList,regionFlagsList);
            regions = d3.range(0,regionsList.length).map(function(i){
                return {id  : i,
			x   : pxOfx(regionsList[i][0]),
			y   : pyOfy(regionsList[i][1]),
			type: regionFlagsList[i]
		       };
	    });
        }
	console.log("js regions ",regions);
	var lastRegionId=regionsList.length;
	
        var holesList = this.model.get('holes')
        var holes=[];
        if (holesList) {
	    console.log("holes list");
            holes = d3.range(0,holesList.length).map(function(i){
                return {id  : i,
			x   : pxOfx(holesList[i][0]),
			y   : pyOfy(holesList[i][1]),
		       };
	    });
        }
	var lastHoleId = holesList.length;
	var boundaryType = -1;
	var regionType = -1;

	// line displayed when dragging new vertices
	var drag_line = svg.append('svg:path')
	    .style('stroke', function(d) {return colors(boundaryType);})
	    .attr('class', 'segment dragline hidden')
	    .attr('d', 'M0,0L0,0');

	// handles to segment and vertex element groups
	var segment = svg.append('svg:g').selectAll('.segment'),
	    vertex = svg.append('svg:g').selectAll('.vertex'),
	    region = svg.append('svg:g').selectAll('.region'),
	    hole = svg.append('svg:g').selectAll('.hole');

	// mouse event vars
	var selected_vertex = null,
	    selected_region = null,
	    selected_hole = null,
	    selected_segment = null,
	    mousedown_segment = null,
	    mousedown_vertex = null,
	    mouseup_vertex = null,
	    mousedown_region = null,
	    mouseup_region = null,
	    mousedown_hole = null,
	    mouseup_hole = null;

	function resetMouseVars() {
	    mousedown_vertex = null;
	    mouseup_vertex = null;
	    mousedown_region = null;
	    mouseup_region = null;
	    mousedown_hole = null;
	    mouseup_hole = null;
	    mousedown_segment = null;
	}

	function redraw() {
	    segment.attr('d', function(d) {
		var deltaX = d.target.x - d.source.x,
		    deltaY = d.target.y - d.source.y,
		    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
		    normX = deltaX / dist,
		    normY = deltaY / dist,
		    sourcePadding = 12
		targetPadding = 12
		sourceX = d.source.x + (sourcePadding * normX),
		sourceY = d.source.y + (sourcePadding * normY),
		targetX = d.target.x - (targetPadding * normX),
		targetY = d.target.y - (targetPadding * normY);
		return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
	    });

	    vertex.attr('transform', function(d) {
		return 'translate(' + d.x + ',' + d.y + ')';
	    });
	    region.attr('transform', function(d) {
		return 'translate(' + (d.x-12) + ',' + (d.y-12) + ')';
	    });
	    hole.attr('transform', function(d) {
		return 'translate(' + (d.x-12) + ',' + (d.y-12) + ')';
	    });
	}

	// update graph (called when needed)
	function restart() {
	    // segment group
	    segment = segment.data(segments);
	    
	    // update existing segments
	    segment.classed('selected', function(d) { return d === selected_segment; });
	    
	    // add new segments
	    segment.enter().append('svg:path')
		.attr('class', 'segment')
		.classed('selected', function(d) { return d === selected_segment; })
		.style('stroke', function(d) {return colors(d.type);})
		.on('mousedown', function(d) {
		    if(d3.event.ctrlKey) return;	    
		    // select segment
		    mousedown_segment = d;
		    if(mousedown_segment === selected_segment) selected_segment = null;
		    else selected_segment = mousedown_segment;
		    selected_vertex = null;
		    selected_region = null;
		    selected_hole = null;
		    restart();
		});
	    
	    // remove old segments
	    segment.exit().remove();
	    
	    
	    // vertex group
	    // NB: the function arg is crucial here! vertices are known by id, not by index!
	    vertex = vertex.data(vertices, function(d) { return d.id; });
	    
	    // update existing vertices
	    vertex.selectAll('.vertex')
		.style('fill', function(d) { return (d === selected_vertex) ? d3.rgb(colors(d.type)).brighter().toString() : colors(d.type); });
	    
	    // add new vertices
	    var g = vertex.enter().append('svg:g');
	    
	    g.append('svg:circle')
		.attr('class', 'vertex')
		.attr('r', 12)
		.style('fill', function(d) { return (d === selected_vertex) ? d3.rgb(colors(d.type)).brighter().toString() : colors(d.type); })
		.style('stroke', function(d) { return d3.rgb(colors(d.type)).darker().toString(); })
		.on('mouseover', function(d) {
		    d3.select(this).attr('transform', 'scale(1.1)');
		})
		.on('mouseout', function(d) {
		    d3.select(this).attr('transform', '');
		})
		.on('mousedown', function(d) {
		    if(d3.event.ctrlKey) return;
		    // select vertex
		    mousedown_vertex = d;
		    if(mousedown_vertex === selected_vertex) selected_vertex = null;
		    else selected_vertex = mousedown_vertex;
		    selected_segment = null;
		    selected_region = null;
		    selected_hole = null;
		    // reposition drag line
		    drag_line
			.classed('hidden', false)
			.style('stroke', function(d) {return colors(boundaryType);})
			.attr('d', 'M' + mousedown_vertex.x + ',' + mousedown_vertex.y + 'L' + mousedown_vertex.x + ',' + mousedown_vertex.y);
		    restart();
		})
		.on('mouseup', function(d) {
		    if(!mousedown_vertex) return;

		    // needed by FF
		    drag_line
			.classed('hidden', true);
		    
		    // check for drag-to-self
		    mouseup_vertex = d;
		    if(mouseup_vertex === mousedown_vertex) { resetMouseVars(); return; }
		    
		    // unenlarge target vertex
		    d3.select(this).attr('transform', '');
		    
		    // add segment to graph (update if exists)
		    // NB: segments are strictly source < target; arrows separately specified by booleans
		    var source, target;
		    if(mousedown_vertex.id < mouseup_vertex.id) {
			source = mousedown_vertex;
			target = mouseup_vertex;
		    } else {
			source = mouseup_vertex;
			target = mousedown_vertex;
		    }
		    
		    var segment;
		    segment = segments.filter(function(l) {
			return (l.source === source && l.target === target);
		    })[0];
		    
		    if(!segment) {
			segment = {source: source, target: target, left: false, right: false, type: boundaryType};
			segments.push(segment);
		    }
		    
		    // select new segment
		    selected_segment = segment;
		    selected_vertex = null;
		    selected_region = null;
		    selected_hole = null;
		    restart();
		});
	    
	    // show vertex IDs
	    g.append('svg:text')
		.attr('x', 0)
		.attr('y', 4)
		.attr('class', 'id')
		.text(function(d) { return d.type; });
	    
	    // remove old vertices
	    vertex.exit().remove();
	    
	    // region group
	    // NB: the function arg is crucial here! regions are known by id, not by index!
	    region = region.data(regions, function(d) { return d.id; });

	    // update existing regions
	    region.selectAll('.region')
		.style('fill', function(d) { return (d === selected_region) ? d3.rgb(colors(d.type)).brighter().toString() : colors(d.type); });
	    
	    // add new regions
	    var r = region.enter().append('svg:g');

	    r.append('svg:rect')
		.attr('class', 'region')
		.attr('width', 24)
		.attr('height', 24)
		.style('fill', function(d) { return (d === selected_region) ? d3.rgb(colors(d.type)).brighter().toString() : colors(d.type); })
		.style('stroke', function(d) { return d3.rgb(colors(d.type)).darker().toString(); })
		.on('mouseover', function(d) {
		    d3.select(this).attr('transform', 'scale(1.1)');
		})
		.on('mouseout', function(d) {
		    d3.select(this).attr('transform', '');
		})
		.on('mousedown', function(d) {
		    if(d3.event.ctrlKey) return;
		    // select region
		    mousedown_region = d;
		    if(mousedown_region === selected_region) selected_region = null;
		    else selected_region = mousedown_region;
		    selected_segment = null;
		    selected_vertex = null;
		    selected_hole = null;
		    restart();
		})
    		.on('mouseup', function(d) {
		    if(!mousedown_region) return;

		    // check for drag-to-self or click-self
		    mouseup_region = d;
		    if(mouseup_region === mousedown_region) { resetMouseVars(); return; }
		    // unenlarge target vertex
		    d3.select(this).attr('transform', '');

		    selected_segment = null;
		    selected_vertex = null;
		    selected_region = null;
		    selected_hole = null;
		    restart();
		});


	    // show region IDs
	    r.append('svg:text')
		.attr('x', 12)
		.attr('y', 16)
		.attr('class', 'id')
		.text(function(d) { return d.type; });

	    // remove old regions
	    region.exit().remove();

	    // hole group
	    // NB: the function arg is crucial here! holes are known by id, not by index!
	    hole = hole.data(holes, function(d) { return d.id; });

	    // update existing holes
	    hole.selectAll('.hole')
		.style('fill', function(d) { return (d === selected_hole) ? d3.rgb('#808080').brighter().toString() : '#808080'; });

	    // add new holes
	    var h = hole.enter().append('svg:g');

	    h.append('svg:polyline')
		.attr('class', 'hole')
		.classed('selected', function(d) { return d === selected_hole; })
		.attr('points','0,24 12,0 24,24')
		.style('stroke', function(d) { return d3.rgb('#808080').darker().toString(); })
		.style('fill', function(d) { return (d === selected_hole) ? d3.rgb('#808080').brighter().toString() : d3.rgb('#808080'); })
		.on('mouseover', function(d) {
		    d3.select(this).attr('transform', 'scale(1.1)');
		})
		.on('mouseout', function(d) {
		    d3.select(this).attr('transform', '');
		})
		.on('mousedown', function(d) {
		    if(d3.event.ctrlKey) return;
		    
		    // select hole
		    mousedown_hole = d;
		    if(mousedown_hole === selected_hole) selected_hole = null;
		    else selected_hole = mousedown_hole;
		    selected_segment = null;
		    selected_vertex = null;
		    selected_region = null;

		    restart();
		})
		.on('mouseup', function(d) {
		    if(!mousedown_hole) return;
		    
		    // check for drag-to-self or click-self
		    mouseup_hole = d;
		    if(mouseup_hole === mousedown_hole) { resetMouseVars(); return; }
		    
		    // unenlarge target vertex
		    d3.select(this).attr('transform', '');
		    
		    selected_segment = null;
		    selected_vertex = null;
		    selected_region = null;
		    selected_hole = null;
		    restart();
		});

	    // remove old holes
	    hole.exit().remove();

	    // redraw graph
	    redraw();
	    console.log(vertices.length,2,0,1);
	    console.log("#vertices");
	    for (var i=0; i<vertices.length;i++) {
		console.log(i,vertices[i].x, vertices[i].y,vertices[i].type);
	    }
	    segments=segments;
	    console.log(segments.length,1);
	    console.log("#segments");
	    for (var i=0;i<segments.length;i++) {
		console.log(i,vertices.indexOf(segments[i].source),vertices.indexOf(segments[i].target),segments[i].type);
	    }
	    console.log("#holes");
	    console.log(holes.length);
	    for (var i=0;i<holes.length;i++) {
		console.log(i,holes[i].x,holes[i].y);
	    }
	    console.log(regions.length,1);
	    console.log("#regions");
	    for (var i=0;i<regions.length;i++) {
		console.log(i,regions[i].x,regions[i].y,regions[i].type);
	    }
	}

	function mousedown() {
	    // prevent I-bar on drag
	    //d3.event.preventDefault();

	    // because :active only works in WebKit?
	    that.svg.classed('active', true);

	    if(d3.event.ctrlKey || mousedown_vertex || mousedown_segment || mousedown_region || mousedown_hole) return;

	    // insert new vertex, region, or hole at point
	    var point = d3.mouse(this);
	    if (lastKeyDown == 82) {
		var new_region = {id: ++lastRegionId, x:point[0], y:point[1], type:regionType};
		regions.push(new_region);
	    }
	    else if (lastKeyDown == 72) {
		var new_hole = {id: ++lastHoleId, x:point[0], y:point[1]};
		holes.push(new_hole);
	    } else {
		var new_vertex = {id: ++lastVertexId, x:point[0], y:point[1], type:boundaryType};
		vertices.push(new_vertex);
	    }

	    restart();
	}

	function mousemove() {
	    if(!mousedown_vertex) return;

	    // update drag line
	    drag_line.style('stroke', function(d) {return colors(boundaryType);})
		.attr('d', 'M' + mousedown_vertex.x + ',' + mousedown_vertex.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

	    restart();
	}

	function mouseup() {
	    if(mousedown_vertex) {
		// hide drag line
		drag_line
		    .classed('hidden', true);
	    }

	    // because :active only works in WebKit?
	    that.svg.classed('active', false);

	    // clear mouse event vars
	    resetMouseVars();
	}

	function spliceSegmentsForVertex(vertex) {
	    var toSplice = segments.filter(function(l) {
		return (l.source === vertex || l.target === vertex);
	    });
	    toSplice.map(function(l) {
		segments.splice(segments.indexOf(l), 1);
	    });
	}

	// only respond once per keydown
	var lastKeyDown = -1;

	function keydown() {
	    d3.event.preventDefault();

	    if(lastKeyDown !== -1) return;
	    lastKeyDown = d3.event.keyCode;

	    // ctrl
	    if(d3.event.keyCode === 17) {
		that.svg.classed('ctrl', true);
	    }

	    if(!selected_vertex && !selected_segment && !selected_region && !selected_hole) return;
	    switch(d3.event.keyCode) {
	    case 8: // backspace
	    case 46: // delete
		if(selected_vertex) {
		    vertices.splice(vertices.indexOf(selected_vertex), 1);
		    spliceSegmentsForVertex(selected_vertex);
		} else if(selected_region) {
		    regions.splice(regions.indexOf(selected_region), 1);
		} else if(selected_hole) {
		    holes.splice(holes.indexOf(selected_hole), 1);
		} else if(selected_segment) {
		    segments.splice(segments.indexOf(selected_segment), 1);
		}
		selected_segment = null;
		selected_vertex = null;
		selected_region = null;
		selected_hole = null;
		restart();
		break;
	    }
	}

	function keyup() {
	    lastKeyDown = -1;

	    // ctrl
	    if(d3.event.keyCode === 17) {
		vertex.on('mousedown.drag', null)
		    .on('touchstart.drag', null);
		that.svg.classed('ctrl', false);
	    }
	}

	function region_changed() {
	    regionType=Number(this.value);
	    restart();
	}
	function boundary_changed() {
	    boundaryType=Number(this.value);
	    restart();
	}
	boundary_changed();
	region_changed();
        d3.select(this.el.children[1].children[1]).on("change",region_changed);
        d3.select(this.el.children[2].children[1]).on("change",boundary_changed);
	
	svg.on('mousedown', mousedown)
	    .on('mousemove', mousemove)
	    .on('mouseup', mouseup);
	d3.select(this.el)
	    .on('keydown', keydown)
	    .on('keyup', keyup);
	restart();
        //that.model.set("vertices", vertices.map(
        //            function(d){return [pxOfx.invert(d[0]),pyOfy.invert(d[1])]}));
        //        that.touch();
    },

});

module.exports = {
    PSLGEditorView: PSLGEditorView,
    PSLGEditorModel: PSLGEditorModel,
};
