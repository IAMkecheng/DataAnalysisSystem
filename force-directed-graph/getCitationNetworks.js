//建立论文引用的网络，点大小(value)是该作者文章被引次数，边数(links)是该作者引用其它作者的次数
getCitationNetwork = function (data, minLinkValue) {
    var nodes = [], edges = [];
    var nodesMap = d3.map();
    var papersMap = d3.map();
    var edgesCount = d3.map();
    var namesMap = d3.map();
    minLinkValue = minLinkValue!==undefined? minLinkValue: 10;

    function getNodeOrCreate(t, node) {///建立作者与节点之间的映射
        if (!nodesMap.has(t)) {
            nodesMap.set(t, {"name":namesMap.get(t), "value":0, "numPapers": 0, "node":node});
        }
        return nodesMap.get(t);

    }
// 作者的权重+1
    function addCount(t, onode, value) {
        var node = getNodeOrCreate(t, onode);
        node[value]+=1;
        nodesMap.set(t, node);
        return node;
    }
// 建立从第一作者到该条目的映射，从论文号到条目的映射，从论文标题到条目的映射
    data.forEach(function (d) {
    	papersMap.set(d.filename, d);
    	papersMap.set(d["IEEE XPLORE Article Number"], d);
        papersMap.set(d["Paper Title"],d);

    });
// split the citations
    data.forEach(function (d) {
        if (d["Deduped author names"] === undefined) {
            return;
        }
        var authors;
        authors = d["Deduped author names"].split(";");

        var source = d;
        authors.forEach(function (c) {
            namesMap.set(c, d["Paper Title"]);
        })
    });
        console.log(namesMap);
    data.forEach(function (d) {
    	if (d.Citations === undefined) {
    		return;
    	}
        var citations;
        if (d.Citations.indexOf(",")!== -1) {
        	citations = d.Citations.split(",");
        }else {
        	citations = d.Citations.split(";");
        }
        var source = d;

        citations.forEach(function (c) {//c为原文章引用的论文号
        	var target = papersMap.get(c);//得到引用文章的文章信息
        	source["Deduped author names"].split(";").forEach(function (sa){//对原文章的每一个作者

                addCount(sa, target, "numPapers");//原文章每一个作者的引用文章数+1
        		target["Deduped author names"].split(";").forEach(function (ta){//对被引文章的每一个作者
        			addCount(ta, target, "value");//被引文章每一个作者的价值（被引用文章数+1）
        			if (sa==="Cox, D. C." || ta==="Cox, D. C.") { return; }
        			if (sa===ta) { return; }
        			var key = sa + "|" + ta;
	                if (edgesCount.has(key)){///设定原文章作者和被引文章作者之间边的权重，没有则创建，有则+1
	                    edgesCount.set(key, edgesCount.get(key) + 1 );
	                } else {
	                    edgesCount.set(key, 0);
	                }

        		});
        	});
        });
    });


    edges = edgesCount.entries().filter(function (d) { return d.value > minLinkValue; } ).map(function (d)  {///筛出边权（作者之间引用次数）符合条件的项
        var t1,t2;///边的两点（原文章作者，被引文章作者）
        t1 = d.key.split("|")[0];
        t2 = d.key.split("|")[1];
        var node1 = getNodeOrCreate(t1);
        var node2 = getNodeOrCreate(t2);
        if (nodes.indexOf(node1)===-1) { nodes.push(node1); }
        if (nodes.indexOf(node2)===-1) { nodes.push(node2); }
        return {
            source:node1,
            target:node2,
            type:"cites",
            value:d.value
        };
    });
    return {"nodes":nodes, "edges":edges};
};
