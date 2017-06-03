/* global define, require, mxui, mendix, mx, logger */
define([
    "dojo/_base/declare", "ChartJS/widgets/Core", "dojo/_base/lang", "dojo/on"
], function (declare, Core, lang, on) {
    "use strict";

    return declare("ChartJS.widgets.ScatterChart.widget.ScatterChart", [Core], {
        _chartType: "line",
        updateDelay: 1000,
        // get the value based on the type and the rouding properties.
        getValue: function (pointObj, attr, type, round) {
            if (type === "Decimal") { // use Big.toFixed
                if (this.roundX >= 0) {
                    return parseFloat(pointObj.get(attr).toFixed(round));
                }
                return parseFloat(pointObj.get(attr).toFixed());
            }
            if (type === "Currency" || type === "Float") {
                if (round >= 0) {
                    var decimalsToValue = 10,
                        roundValue = Math.pow(decimalsToValue, round);
                    return Math.round(pointObj.get(attr) * roundValue) / roundValue;
                }
                return pointObj.get(this.seriesxValue);
            }
            return pointObj.get(this.seriesxValue);
        },
        _parseSettings: function () {
            logger.debug(this.id + "._parseSettings");
            this.roundX = parseInt(this.roundX, 10);
            this.roundY = parseInt(this.roundY, 10);
            this.suggestedMaxX = this.suggestedMaxX === "" ? null : parseInt(this.suggestedMaxX, 10);
            this.suggestedMinX = this.suggestedMinX === "" ? null : parseInt(this.suggestedMinX, 10);
            this.suggestedMaxY = this.suggestedMaxY === "" ? null : parseInt(this.suggestedMaxY, 10);
            this.suggestedMinY = this.suggestedMinY === "" ? null : parseInt(this.suggestedMinY, 10);
        },
        _processData: function () {
            logger.debug(this.id + "._processData");
            this._parseSettings();
            var sets = this._data.datasets,
                points = null,
                set = {points: []},
                color = "",
                highlightcolor = "",
                label = "",
                j = null,
                i = null,
                _set = null,
                pointDateMeta = mx.meta.getEntity(this.datapointentity.split("/")[1]),
                xType = pointDateMeta.getAttributeType(this.seriesxValue),
                yType = pointDateMeta.getAttributeType(this.seriesyValue);

            this._chartData.datasets = [];
            this._chartData.labels = [];
            for (j = 0; j < sets.length; j++) {
                set = sets[j];
                points = [];
                for (i = 0; i < set.points.length; i++) {
                    points.push({
                        x: this.getValue(set.points[i], this.seriesxValue, xType, this.roundX),
                        y: this.getValue(set.points[i], this.seriesyValue, yType, this.roundY)
                    });
                }
                color = set.dataset.get(this.seriescolor);
                highlightcolor = set.dataset.get(this.serieshighlightcolor);
                label = set.dataset.get(this.datasetlabel);
                _set = {
                    label: this.showLegendLabel ? label : "",
                    backgroundColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.2") : color,
                    borderColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.5") : color,
                    pointColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.8") : color,
                    pointBorderColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.8") : color,
                    pointHoverBackgroundColor: this.seriesColorReduceOpacity ? this._hexToRgb(color, "0.75") : highlightcolor,
                    pointHoverBorderColor: this.seriesColorReduceOpacity ? this._hexToRgb(highlightcolor, "1") : highlightcolor,
                    data: points,
                    pointStyle: this.seriesShape ? set.dataset.get(this.seriesShape) : null
                };
                this._chartData.datasets.push(_set);
                // set the active data set for legends
                this._activeDatasets.push({
                    dataset: _set,
                    idx: j,
                    active: true
                });
            }
            this._createChart(this._chartData);
            this._createLegend(false);
        },

        _createChart: function (data) {
            logger.debug(this.id + "._createChart");
            if (this._chart) {
                this._chart.stop();
                this._chart.data.datasets = data.datasets;
                this._chart.update(this.updateDelay);
                this._chart.bindEvents(); // tooltips otherwise won't work
            } else {
                var chartProperties = {
                    type: this._chartType,
                    data: data,
                    options: this._chartOptions({
                        showLines: false,
                        scales: {
                            xAxes: [{
                                type: "linear",
                                position: "bottom",
                                id: "x-axis-0",
                                display: this.scaleShow,
                                scaleLabel: {
                                    display: this.xLabel !== "",
                                    labelString: this.xLabel !== "" ? this.xLabel : "",
                                    fontFamily: this._font
                                },
                                gridLines: {
                                    display: this.scaleShowVerticalLines,
                                    color: this.gridLineColor,
                                    lineWidth: this.scaleLineWidth,
                                    zeroLineColor: this.zeroGridLineColor,
                                    zeroLineWidth: this.zeroGridLineWidth
                                },
                                ticks: {
                                    display: this.scaleShowLabelsBottom,
                                    fontFamily: this._font,
                                    beginAtZero: this.scaleBeginAtZero,
                                    suggestedMax: this.suggestedMaxX,
                                    suggestedMin: this.suggestedMinX
                                }
                            }, {
                                type: "linear",
                                position: "top",
                                id: "x-axis-1",
                                display: this.scaleShow,
                                scaleLabel: {
                                    display: this.xLabelTop !== "",
                                    labelString: this.xLabelTop !== "" ? this.xLabelTop : "",
                                    fontFamily: this._font
                                },
                                gridLines: {// second gridlines should never display
                                    color: "rgba(255,255,255,0)",
                                    drawOnChartArea: false,
                                    tickMarkLength: 0
                                },
                                ticks: {// second gridlines should never display
                                    display: false,
                                    suggestedMax: this.suggestedMaxX,
                                    suggestedMin: this.suggestedMinX
                                }
                            }],
                            yAxes: [{
                                id: "y-axis-0",
                                type: "linear",
                                position: "left",
                                display: this.scaleShow,
                                // If stacked is set to true, the Y-axis needs to be stacked for it to work
                                stacked: this.isStacked,
                                scaleLabel: {
                                    display: this.yLabel !== "",
                                    labelString: this.yLabel !== "" ? this.yLabel : "",
                                    fontFamily: this._font
                                },
                                gridLines: {
                                    display: this.scaleShowHorizontalLines,
                                    color: this.gridLineColor,
                                    lineWidth: this.gridLineWidth,
                                    zeroLineColor: this.zeroGridLineColor,
                                    zeroLineWidth: this.zeroGridLineWidth
                                },
                                ticks: {
                                    display: this.scaleShowLabels,
                                    fontFamily: this._font,
                                    beginAtZero: this.scaleBeginAtZero,
                                    suggestedMax: this.suggestedMaxY,
                                    suggestedMin: this.suggestedMinY,
                                    // maxTicksLimit: this.maxTickSize > 0 ? this.maxTickSize : null,
                                    callback: lang.hitch(this, function (value) {
                                        var round = parseInt(this.roundY, 10);
                                        if (!isNaN(round) && round >= 0) {
                                            return Number(value).toFixed(round);
                                        }
                                        return value;
                                    })
                                }
                            }, {
                                id: "y-axis-1",
                                type: "linear",
                                position: "right",
                                display: this.scaleShow,
                                // If stacked is set to true, the Y-axis needs to be stacked for it to work
                                stacked: this.isStacked,
                                scaleLabel: {
                                    display: this.yLabelRight !== "",
                                    labelString: this.yLabelRight !== "" ? this.yLabelRight : "",
                                    fontFamily: this._font
                                },
                                gridLines: {// second gridlines should never display
                                    color: "rgba(255,255,255,0)",
                                    drawOnChartArea: false,
                                    tickMarkLength: 0
                                },
                                ticks: {// second gridlines should never display
                                    display: false,
                                    suggestedMax: this.suggestedMaxY,
                                    suggestedMin: this.suggestedMinY
                                }
                            }]
                        },
                        elements: {
                            point: {
                                radius: this.pointRadius,
                                borderWidth: this.pointBorderWidth,
                                hitRadius: this.pointHitRadius,
                                hoverRadius: this.pointHoverRadius,
                                hoverBorderWidth: this.pointHoverBorderWidth
                            }
                        },
                        legendCallback: this._legendCallback,
                        legend: {position: this.legendPosition}
                    })
                };
                logger.debug(this.id + " Chart Properties:", JSON.stringify(chartProperties));
                this._chart = new this._chartJS(this._ctx, chartProperties);
                this.connect(window, "resize", lang.hitch(this, function () {
                    this._resize();
                }));
                // Add class to determain chart type
                this._addChartClass("chartjs-line-chart");
                on(this._chart.chart.canvas, "click", lang.hitch(this, this._onClickChart));
            }
        }
    });
});

require(["ChartJS/widgets/LineChart/widget/LineChart"]);
