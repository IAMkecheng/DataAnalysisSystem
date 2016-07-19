//建立作者合作的网络
getCoauthorNetwork = function (data, minLinkValue) {
    var nodes = [], edges = [];
    var nodesMap = d3.map();
    var edgesCount = d3.map();

    minLinkValue = minLinkValue!==undefined? minLinkValue: 10;

    function getNodeOrCreate(t) {///建立作者与节点之间的映射
        var node;
        if (!nodesMap.has(t)) {
            nodesMap.set(t, {"name":t, "value":0});
        }
        return nodesMap.get(t);

    }

    function addCount(t) {///建立作者与作者曾一起写作过的人数之间的映射
        var node = getNodeOrCreate(t);
        node.value+=1;
        nodesMap.set(t, node);
        return node;
    }

    data.forEach(function (d) {
        var author = d["Deduped author names"].split(";");///对原文章每一个作者
        author.forEach(function (t1) {
            author.forEach(function (t2) {
                if (t1===t2) {
                    return;
                }
                addCount(t1);
                addCount(t2);

                var key = t1<t2 ? t1 + "|" + t2 : t2 + "|" + t1;///保证作者与协作者之间的关系是对称的
                if (edgesCount.has(key)){
                    edgesCount.set(key, edgesCount.get(key) + 1 );
                } else {
                    edgesCount.set(key, 0);
                }

            });
        });
    });


    edges = edgesCount.entries().filter(function (d) { return d.value > minLinkValue; } ).map(function (d)  {///筛出边权（作者曾协作的人数）符合条件的项
        var t1,t2;///边的两点（共同协作过的作者）
        t1 = d.key.split("|")[0];
        t2 = d.key.split("|")[1];
        var node1 = getNodeOrCreate(t1);
        var node2 = getNodeOrCreate(t2);
        if (nodes.indexOf(node1)===-1) { nodes.push(node1); }
        if (nodes.indexOf(node2)===-1) { nodes.push(node2); }
        return {
            source:node1,
            target:node2,
            value:d.value
        };
    });
    return {"nodes":nodes, "edges":edges};
};