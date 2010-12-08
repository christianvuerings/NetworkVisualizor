var labelType, useGradients, nativeTextSupport, animate, nrOfNodes, fd, beheerSysteem;

(function(){
    var ua = navigator.userAgent, iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i), typeOfCanvas = typeof HTMLCanvasElement, nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'), textSupport = nativeCanvasSupport &&
    (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
    //I'm setting this based on the fact that ExCanvas provides text support for IE
    //and that as of today iPhone/iPad current text support is lame
    labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
    nativeTextSupport = labelType == 'Native';
    useGradients = nativeCanvasSupport;
    animate = !(iStuff || !nativeCanvasSupport);
})();


/**
 * Update the combobox with the current computers
 * @returns {void}
 * @type String|Object|Array|Boolean|Number
 */
var updatecombobox = function(){

    // jQuery selector for the select box
    var $selectbox = $("#Computer_connected_0");
    $selectbox.html("");
    
    for (var i = 0; i < config.getRunningComputers(); i++) {
        var configelement = config.getData()[i];
        
        $selectbox.append("<option value='" + configelement.id + "'>" + configelement.name + "</option>")
    }
}


function loadNetwork(success){
    if (success) {
        // Fill the combo boxes with all the Computers.
        updatecombobox();
        
        
        // init ForceDirected
        fd = new $jit.ForceDirected({
            //id of the visualization container
            injectInto: 'network_graph',
            //Enable zooming and panning
            //with scrolling and DnD
            Navigation: {
                enable: false,
                //Enable panning events only if we're dragging the empty
                //canvas (and not a node).
                panning: 'avoid nodes',
                zooming: 10 //zoom speed. higher is more sensible
            },
            // Change node and edge styles such as
            // color and width.
            // These properties are also set per node
            // with dollar prefixed data-properties in the
            // JSON structure.
            Node: {
                overridable: true,
                dim: 7
            },
            Edge: {
                overridable: true,
                type: 'line',
                color: '#225772'
            },
            // Add node events
            Events: {
                enable: true,
                type: 'Native',
                
                /*
                 Uncomment to enable dragging.
                
                //Update node positions when dragged
                onDragMove: function(node, eventInfo, e){
                    var pos = eventInfo.getPos();
                    node.pos.setc(pos.x, pos.y);
                    fd.plot();
                },
                //Implement the same handler for touchscreens
                onTouchMove: function(node, eventInfo, e){
                    $jit.util.event.stop(e); //stop default touchmove event
                    this.onDragMove(node, eventInfo, e);
                }
                */
            },
            //Number of iterations for the FD algorithm
            iterations: 200,
            //Edge length
            levelDistance: 130,
            // This method is only triggered
            // on label creation and only for DOM labels (not native canvas ones).
            onCreateLabel: function(domElement, node){
                // Create a 'name' and 'close' buttons and add them
                // to the main node label
                var nameContainer = document.createElement('a'), style = nameContainer.style;
                
                nameContainer.className = 'name';
                nameContainer.innerHTML = node.name;
                domElement.appendChild(nameContainer);
                style.fontSize = "0.8em";
                style.color = "#ddd";
                
                //Toggle a node selection when clicking
                //its name. This is done by animating some
                //node styles like its dimension and the color
                //and lineWidth of its adjacencies.
                nameContainer.onclick = function(){
                    //set final styles
                    fd.graph.eachNode(function(n){
                        if (n.id != node.id) 
                            delete n.selected;
                        n.setData('dim', 7, 'end');
                        n.eachAdjacency(function(adj){
                            adj.setDataset('end', {
                                lineWidth: 0.4,
                                color: '#23a4ff'
                            });
                        });
                    });
                    if (!node.selected) {
                        node.selected = true;
                        node.setData('dim', 17, 'end');
                        node.eachAdjacency(function(adj){
                            adj.setDataset('end', {
                                lineWidth: 3,
                                color: '#36acfb'
                            });
                        });
                    }
                    else {
                        delete node.selected;
                    }
                    //trigger animation to final styles
                    fd.fx.animate({
                        modes: ['node-property:dim', 'edge-property:lineWidth:color'],
                        duration: 500
                    });
                    
                    // Show some details
                    $jit.id('inner-details').style.display = "block";
                    $jit.id('inner-details-name').innerHTML = node.name;
                    $jit.id('inner-details-id').innerHTML = node.id;
                    
                    // Build the right column relations list.
                    // This is done by traversing the clicked node connections.
                    var list = "";
                    node.eachAdjacency(function(adj){
                        if (adj.getData('alpha')) 
                            list += "<li>" + adj.nodeTo.name + "</li>";
                    });
                    //append connections information
                    $jit.id('inner-details-connections').innerHTML = list;
                };
            },
            // Change node styles when DOM labels are placed
            // or moved.
            onPlaceLabel: function(domElement, node){
                var style = domElement.style;
                var left = parseInt(style.left);
                var top = parseInt(style.top);
                var w = domElement.offsetWidth;
                style.left = (left - w / 2) + 'px';
                style.top = (top + 10) + 'px';
                style.display = '';
            }
        });
        // load JSON data.
        fd.loadJSON(config.getData());
        // compute positions incrementally and animate.
        fd.computeIncremental({
            iter: 40,
            property: ['end', 'start', 'current'],
            onStep: function(perc){
            },
            onComplete: function(){
                fd.plot();
            }
        });
        
        // Keep the fd!
        beheerSysteem.setDrawer(fd);

        // Toon informatie over een willekeurige computer
        beheerSysteem.showRandomInfo();
    }
    else {
        alert("Failed to load the config file. (" + status + ")");
    }
}


function init(){
    // Load all the data.
    config = new Config();
    //config.loadJSON("config.js", loadNetwork);
    config.setData(c);
    
    beheerSysteem = new BeheerSysteem();
    beheerSysteem.setConfig(config);
    
    loadNetwork(true);
    
    
    // ###############
    // The UI events #
    // ###############
    
    // Fancy slider things
    $(".menu_bar").bind("click", function(){
        // FIXME
        $(".panel", $(this).parents(".subcontainer")).slideToggle();
    });
    
    // Add a Computer.
    $("#Computer_add").live("click", function(){
        var $selectbox = $("#Computer_connected_0");
        
        // Create a new Computer.
        var m = new Computer();
        m.setName($("#Computer_name").val());
        m.setId(m.name + config.getRunningComputers() + 1);
        m.setType("circle");
        m.setAdjacencies([{
            "nodeTo": $selectbox.val(),
            "nodeFrom": m.getId(),
            "data": {}
        }]);
        
        // Add the Computer.
        beheerSysteem.addComputer(Computer);
        
        // Update the list of available Computers.
        updatecombobox();
    });
    
    
    // Delete a Computer
    $("#inner-details-wipe").live("click", function(){
        // Get the id we've stuck in the hidden span
        var id = $("#inner-details-id").text();
        
        // Wipe it.
        beheerSysteem.wipeComputer(id);
    });
    
    
    // Delete a Computer
    $("#inner-details-delete").live("click", function(){
        // Get the id we've stuck in the hidden span
        var id = $("#inner-details-id").text();
        
        // Delete it.
        beheerSysteem.deleteComputer(id);
    });
    
    $("#send_message").live("click", function() {
        beheerSysteem.stuurBericht();
        
    });
}