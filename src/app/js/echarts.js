/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

// https://github.com/apache/echarts
const echarts = require('echarts');

function numberOfLastChildren(n) {
    let score = 0;
    if (n.children.length === 0) return 1;
    n.children.forEach((c) => {
        score += numberOfLastChildren(c);
    });
    return score;
}

exports.getDataEcharts = () => echarts.util.clone(window.suggestEcharts.getOption().series[0].data[0]);

exports.initSuggestEcharts = (elementById, data) => {
    const nolc = numberOfLastChildren(data);
    const labelFontSize = 12;
    const domEltEcharts = document.getElementById(elementById);

    domEltEcharts.style.cssText = `height: ${nolc * (labelFontSize / 2) + 200}px; width:100%`;

    data.children.forEach((item, index) => {
        if (index % 2 === 0) { item.collapsed = true; }
    });

    if (window.suggestEcharts !== undefined) {
        // https://echarts.apache.org/en/api.html#echartsInstance.dispose
        window.suggestEcharts.dispose();
    }
    // https://echarts.apache.org/en/api.html#echarts.init
    window.suggestEcharts = echarts.init(domEltEcharts);

    // https://echarts.apache.org/en/option.html
    window.suggestEcharts.setOption({
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove',
        },
        series: [
            {
                type: 'tree',
                top: '1%',
                left: '10%',
                bottom: '1%',
                right: '25%',
                symbolSize: 10,
                itemStyle: {
                    color: 'red',
                },
                label: {
                    position: 'left',
                    verticalAlign: 'middle',
                    align: 'right',
                    fontSize: 12,
                },
                leaves: {
                    label: {
                        position: 'right',
                        verticalAlign: 'middle',
                        align: 'left',
                    },
                },
                emphasis: {
                    focus: 'descendant',
                },
                expandAndCollapse: true,
                animationDuration: 550,
                animationDurationUpdate: 750,
                data: [data],
            },
        ],
    });

    window.addEventListener('resize', () => {
        if (window.suggestEcharts != null && window.suggestEcharts !== undefined) {
            window.suggestEcharts.resize({
                width: 'auto',
                height: 'auto',
            });
        }
    });

    function updatePropsRecursively(nodeName, nodeData) {
        Object.entries(nodeData).forEach((item) => {
            if (item[1].name === nodeName) {
                nodeData.splice(item[0], 1);
            } else if (item[1].children.length) {
                updatePropsRecursively(nodeName, item[1].children);
            }
        });
    }

    // https://echarts.apache.org/en/tutorial.html#Events%20and%20Actions%20in%20ECharts
    window.suggestEcharts.on('dblclick', (params) => {
        const echartsData = this.getDataEcharts();

        updatePropsRecursively(params.name, echartsData.children);

        window.suggestEcharts.setOption({
            series: [
                {
                    data: [echartsData],
                },
            ],
        });
    });
};
