/**
 * Created by Administrator on 2016/7/18 0018.
 */
/*jslint browser: true, indent: 4 */
/* global d3: false, $: false, alert: false, TreeMap: false , FlickrUtils: true, console: true, utils: true */

var url = "IEEE VIS papers 1990-2014 - Main dataset.csv";

var w = 1200,
    h = 800;

var MIN_NODE_VAL = 200;
var MIN_EDGE_VAL = 5;

var network;
var type = "Citations";
var data;
d3.csv(url, function (error, mdata) {///读取数据
    data = mdata;
    reload();
});
///控件内容改变时，调用reload
d3.select("#checkboxGroup").on("change", reload);
d3.select("#selectType").on("change", reload);
d3.select("#sliderMinLink").on("change", reload)
    .on("input", function (d) {///input输入框的change事件，要在input失去焦点的时候才会触发，加入这个函数会即时触发
        d3.select("#sliderLabelMinLink").html("Min link value: " + d3.select("#sliderMinLink").property("value"));///更改文字说明
    });
d3.select("#sliderMinNode").on("change", reload)///同上
    .on("input", function (d) {
        d3.select("#sliderLabelMinNode").html("Min node value (labels): " + d3.select("#sliderMinNode").property("value"));
    });


var svg = d3.select("#chart").append("svg:svg")///在网页中添加svg画布
    .attr("width", w)
    .attr("height", h);

svg.append("svg:rect")///在svg上添加了一个白色的矩形背景
    .attr("width", w)
    .attr("height", h);


// Per-type markers, as they don't inherit styles. -  You motherfucker.
/*svg.append("defs").selectAll("marker")//这段代码都是用来预定义线上的小箭头的。
    .data(["cites"])
    .enter().append("marker")///
    .attr("id", function(d) {return d;})
    .attr("viewBox", "0 -5 10 10")///在SVG画布上框了一个框，并把内容放大到整个SVG大小
    .attr("refX", 30)
    .attr("refY", -5)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")///用path画一个三角形
    .attr("d", "M0,-5L10,0L0,5");
//.attr("fill","#fff");想改颜色就这里改
*/

svg.append("svg:g").attr("id", "paths");
svg.append("svg:g").attr("id", "nodes");
svg.append("svg:g").attr("id", "texts");

var force  = d3.layout.forceInABox()//应用自定义的构图
    .size([w, h])
    .treemapSize([w-300, h-300])//防止超出画布边界
    .enableGrouping(d3.select("#checkboxGroup").property("checked"))//是否聚类
    .linkDistance(50)
    .gravityOverall(0.001)
    .linkStrengthInsideCluster(0.3)
    .linkStrengthInterCluster(0.05)
    .gravityToFoci(0.35)
    .charge(-100);

var rScale = d3.scale.linear().range([2, 20]);
var yScale = d3.scale.linear().range([h-20, 20]);
var xScale = d3.scale.linear().domain(["a".charCodeAt(0), "z".charCodeAt(0)]).range([0, w]);
var colScale = d3.scale.category20c();
var lOpacity = d3.scale.linear().range([0.1, 0.9]);



function nodeName (d) {///获取节点名称，为论文名+被引用次数
    return d.name + " (" + d.value + ")";
}

function nodeNameCond (d) {///有条件地获得节点名称，如果大于最小引用次数，则正常获取，否则设为空
    return d.value > MIN_NODE_VAL ? nodeName(d): "";
}

function update( nodes, edges) {
    // force = d3.layout.force()
    force.stop();///停止图
    force
        .nodes(nodes)
        .links(edges)
        .enableGrouping(d3.select("#checkboxGroup").property("checked"))
        .on("tick", tick)///每进行到一个时刻调用tick方法
        .start();



    rScale.domain([0, d3.max(nodes, function (d) { return d.value; } )]);
    yScale.domain([0, d3.max(nodes, function (d) { return d.value; } )]);
    lOpacity.domain(d3.extent(edges, function (d) { return d.value; } ));



    var path = svg.select("#paths").selectAll("path")
        .data(force.links(), function (e) { return e.source.name + "|" + e.target.name; });
    path.enter().append("svg:path")
        .attr("class", function(d) { return "link "; })
        .style("stroke-width", "2px")
        .append("title")


    path.attr("marker-end", function(d) { return "url(#" + d.type + ")"; })
        .style("stroke-opacity", function(d) { return lOpacity(d.value); });

    path.select("title")
        .text(function (e) { return e.source.name + " to " + e.target.name + " (" + e.value + ")"; });

    path.exit().remove();


    var circle = svg.select("#nodes").selectAll("circle")
        .data(force.nodes(), function (d) { return d.name; });
    circle.enter().append("svg:circle")
        .attr("r", function (d) { return rScale(d.value); })
        .call(force.drag)
        //.append("title")
        //.text(nodeName);
    circle.style("fill", function (d) { return colScale(d.cluster); })
       // .select("title")
       // .text(nodeName);

    var text = svg.select("#texts").selectAll("g")
        .data(force.nodes(), function (d) { return d.name; });
    svg.select("#nodes").selectAll("circle")
     .on("mouseover", function(d, i) {
     svg.append("text")
     .attr("id","id"+i)
     .attr("dx", d.px + 12)
     .attr("dy", d.py)
     .text("  "+d.name+ "(links:" + d.weight + ")");
     }).on("mouseout",function(d,i){
        svg.select("text").remove();
    });
    circle.exit().remove();


    /*var textEnter = text
        .enter().append("svg:g");

    // A copy of the text with a thick white stroke for legibility.
    textEnter.append("svg:text")
        .attr("x", 12)
        .attr("y", ".31em")
        .attr("class", "shadow");

    textEnter.append("svg:text")
        .attr("x", 12)
        .attr("y", ".31em")
        .attr("class", "foreground");

    text.select(".shadow").text(nodeNameCond);
    text.select(".foreground").text(nodeNameCond);
    */
    text.exit().remove();

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick(e) {
        force.onTick(e);///调用自定义布局中的ontick方法

        //Collision detection
        var q = d3.geom.quadtree(nodes),
            k = e.alpha * 0.1,
            i = 0,
            n = nodes.length,
            o;

        while (++i < n) {
            o = nodes[i];
            // if (o.fixed) continue;
            // c = nodes[o.type];
            // o.x += (c.x - o.x) * k;
            // o.x += (xScale(o.name.charCodeAt(0)) - o.x) * k;
            // o.y += (yScale(o.value) - o.y) * k;
            q.visit(collide(o));
        }

        path.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });

        circle.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        text.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }
}

function collide(node) {
    var r = rScale(node.value) + 16,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = rScale(node.value) + rScale(quad.point.value);
            if (l < r) {
                l = (l - r) / l * .5;
                node.px += x * l;
                node.py += y * l;
            }
        }
        return x1 > nx2
            || x2 < nx1
            || y1 > ny2
            || y2 < ny1;
    };
}
var xurl = window.location.search; //获取url中"?"符后的字串
var str = xurl.substr(1);
var strs = str.split("=");
var json_id = strs[1];
console.log(json_id);
function reload() {
    //从拖动条中获取限定值
    MIN_EDGE_VAL = d3.select("#sliderMinLink").property("value");
    MIN_NODE_VAL = d3.select("#sliderMinNode").property("value");

    if (data === undefined) { return; }

    if(json_id==1){
         network = getCoauthorNetwork(data, MIN_EDGE_VAL);
    }
    else {
        network = getCitationNetwork(data, MIN_EDGE_VAL);
    }
    ///利用第三方包聚类

    netClustering.cluster(network.nodes, network.edges);
    ///更新图
    update(network.nodes, network.edges);
}
