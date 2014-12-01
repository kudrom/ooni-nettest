var Map = {
    id: 'map',
    selected: [],
    removed: [],
    // Both initial and current data must never be changed, they are used by the MainController
    initial_data: {},
    // Current data only changes when another visualization draws into this one
    current_data: {},
    // TODO: the colors should be fetched from css
    color_selected: 'red',
    color_removed: 'black',
    color_default: 'rgb(230,230,230)',
    colorbrewer: [
        'rgb(248,251,255)',
        'rgb(222,235,247)',
        'rgb(198,219,239)',
        'rgb(158,202,225)',
        'rgb(107,174,214)',
        'rgb(66,146,198)',
        'rgb(33,113,181)',
        'rgb(8,81,156)',
        'rgb(8,48,107)',
    ],
    init: function(command, data){
        this.command = command;
        this.initial_data = data;
        var that = this;
        this.map = new Datamap({
            element: document.getElementById('map'),
            height: 500,
            done: function(datamap){
                datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                    that.command.method.call(that.command.object, that.id, window.event, geography.id);
                });
            },
            fills: {
                defaultFill: that.color_default,
            },
            geographyConfig: {
                highlightOnHover: false
            }
        });
        this.draw(this.initial_data);
    },
    is_modified: function(){
        return this.selected.length > 0 || this.removed.length > 0;
    },
    reset_countries: function(countries){
        var reset = {};
        var that = this;
        countries.forEach(function(country){
            reset[country] = that.color_default;
        });
        this.map.updateChoropleth(reset);
    },
    reset: function(){
        this.reset_countries(this.selected);
        this.selected = [];
        this.reset_countries(this.removed);
        this.removed = [];
        this.draw(this.initial_data);
    },
    // TODO: Toggle state
    select: function(country_code, exclusive){
        var reseted_countries = Object.keys(this.initial_data);
        if(this.removed.length > 0){
            reseted_countries = reseted_countries.concat(this.removed);
            this.removed = [];
        }
        if(exclusive){
            reseted_countries = reseted_countries.concat(this.selected);
            this.selected = [];
        }
        this.reset_countries(reseted_countries);
        this.selected.push(country_code);
        var color_updates = {},
            color_selected = this.color_selected;
        this.selected.forEach(function(country){
            color_updates[country] = color_selected;
        })
        this.map.updateChoropleth(color_updates);
    },
    // TODO: Toggle state
    remove: function(country_code, exclusive){
        var reseted_countries = [];
        if(this.selected.length > 0){
            reseted_countries = reseted_countries.concat(this.selected);
            this.selected = [];
        }
        if(exclusive){
            reseted_countries = reseted_countries.concat(this.removed);
            this.removed = [];
        }
        this.reset_countries(reseted_countries);
        this.removed.push(country_code);
        this.draw(this.current_data);
    },
    draw: function(data)
    {
        if(this.selected.length > 0){
            return;
        }

        this.current_data = data;
        this.reset_countries(Object.keys(this.initial_data));

        var maximum = 0,
            processed_data = {},
            color_updates = {}
            color_removed = this.color_removed;

        this.removed.forEach(function (country){
            color_updates[country] = color_removed;
        });
        for(country in data){
            if(data.hasOwnProperty(country)){
                if(this.removed.indexOf(country) === -1){
                    processed_data[country] = data[country].length;
                    maximum = data[country].length > maximum ? data[country].length : maximum;
                }
            }
        }
        var quantize = d3.scale.quantile().domain([0, maximum]).range(d3.range(9));

        for(country in processed_data){
            if(data.hasOwnProperty(country)){
                var index = quantize(processed_data[country]);
                color_updates[country] = this.colorbrewer[index];
            }
        }
        this.map.updateChoropleth(color_updates);
    },
}

var Timeline = {
    id: 'timeline',
    init: function(command, data)
    {
        this.command = command;
        this.initial_data = data;

        var margin = {top: 20, right: 20, bottom: 100, left: 50};
        this.width = 960 - margin.left - margin.right;
        this.height = 500 - margin.top - margin.bottom;

        this.svg = d3.select(".timeline").append("svg")
                      .attr("class", "center-block")
                      .attr("width", this.width + margin.left + margin.right)
                      .attr("height", this.height + margin.top + margin.bottom)
                    .append("g")
                      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.draw(this.initial_data);
    },
    reset: function(){
        this.draw(this.initial_data);
    },
    draw: function (data)
    {
        var parseDate = d3.time.format("%a %b %d %Y").parse,
            processed_data = [];
        for(day in data){
            if(data.hasOwnProperty(day)){
                processed_data.push({start_time: parseDate(day), number: data[day].length});
            }
        }
        processed_data.sort(function(a,b) { return b.start_time - a.start_time});

        this.svg.selectAll('g').remove();
        this.svg.selectAll('path').remove();

        var x = d3.time.scale()
                  .domain(d3.extent(processed_data, function(d) { return d.start_time; }))
                  .range([0, this.width]);

        var y = d3.scale.linear()
                  .domain([0, d3.max(processed_data, function(d) { return d.number; })])
                  .range([this.height, 0]);

        var xAxis = d3.svg.axis()
                      .scale(x)
                      .orient("bottom");

        var yAxis = d3.svg.axis()
                      .scale(y)
                      .orient("left");

        var area = d3.svg.area()
                     .x(function(d) { return x(d.start_time); })
                     .y0(this.height)
                     .y1(function(d) { return y(d.number); });

        this.svg.append("path")
            .datum(processed_data)
            .attr("class", "area")
            .attr("d", area);

        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(xAxis)
            .selectAll("text")
                 .style("text-anchor", "end")
                 .attr("dx", "-.8em")
                 .attr("dy", ".15em")
                 .attr("transform", function(d){
                     return "rotate(-65)";
                 });

        this.svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    },
}

var Histogram = {
    id: 'histogram',
    selected: [],
    removed: [],
    current_data: {},
    initial_data: {},
    init: function(command, data){
        this.command = command;
        this.initial_data = data;

        var margin = {top: 20, right: 20, bottom: 250, left: 40};
        this.width = 800 - margin.left - margin.right;
        this.height = 500 - margin.top - margin.bottom;

        this.svg = d3.select(".histogram").append("svg")
                    .attr("class", "center-block")
                    .attr("width", this.width + margin.left + margin.right)
                    .attr("height", this.height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.x = d3.scale.ordinal()
                         .domain(Object.keys(data))
                         .rangeRoundBands([0, this.width], .1);

        this.draw(this.initial_data);
    },
    is_modified: function(){
        return this.selected.length > 0 || this.removed.length > 0;
    },
    reset: function(){
        if(this.selected.length > 0){
            this.update_nettests(Object.keys(this.initial_data), 'unselected');
            this.update_nettests(this.selected, 'selected');
            this.selected = [];
        }
        this.update_nettests(this.removed, 'removed');
        this.removed = [];
        this.draw(this.initial_data);
    },
    update_nettests: function(nettests, css_class)
    {
        var len = nettests.length;
        for(var i = 0; i < len; i++){
            var dom_nettest = this.svg.select('.bar.' + nettests[i])[0][0];
            if(dom_nettest !== null){
                dom_nettest.classList.toggle(css_class);
            }
        }
    },
    select: function(nettest, exclusive)
    {
        if(this.selected.length == 0){
            this.update_nettests(Object.keys(this.initial_data), 'unselected');
            this.update_nettests(this.removed, 'removed');
            this.removed = [];
        }
        var redraw;
        if(exclusive){
            redraw = this.selected.slice(0);
            redraw.push(nettest);
            this.selected = [nettest];
        }else{
            redraw = [nettest];
            this.selected.push(nettest);
        }
        this.update_nettests(redraw, 'selected');
    },
    remove: function(nettest, exclusive)
    {
        if(this.selected.length > 0){
            this.update_nettests(Object.keys(this.initial_data), 'unselected');
            this.update_nettests(this.selected, 'selected');
            this.selected = [];
        }
        if(exclusive){
            this.removed = [nettest];
        }else{
            this.removed.push(nettest);
        }
        this.draw(this.current_data);
        this.update_nettests(this.removed, 'removed');
    },
    draw: function (data)
    {
        if(this.selected.length > 0){
            return
        }

        this.current_data = data;

        var processed_data = [],
            maximum = 0;
        for(nettest in data){
            if(data.hasOwnProperty(nettest)){
                processed_data.push({nettest: nettest, measurements: data[nettest].length})
                if(this.removed.indexOf(nettest) == -1){
                    maximum = data[nettest].length > maximum ? data[nettest].length : maximum;
                }
            }
        }

        this.svg.selectAll('g').remove();
        this.svg.selectAll('rect').remove();

        var xAxis = d3.svg.axis()
                      .scale(this.x)
                      .orient("bottom");

        this.y = d3.scale.linear()
                         .domain([0, maximum])
                         .range([this.height, 0]);

        var yAxis = d3.svg.axis()
                      .scale(this.y)
                      .orient("left");

        this.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0, " + this.height + ")")
                .call(xAxis)
                .selectAll("text")
                     .style("text-anchor", "end")
                     .attr("dx", "-.8em")
                     .attr("dy", ".15em")
                     .attr("transform", function(d){
                         return "rotate(-65)";
                     });

        this.svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

        var that = this;
        this.svg.selectAll(".bar")
                .data(processed_data)
                .enter().append("rect")
                .on('click', function(data, index){
                    that.command.method.call(that.command.object, that.id, d3.event, data.nettest);
                })
                .attr("class", function(d) { return "bar " + d.nettest; })
                .attr("x", function(d) { return that.x(d.nettest); })
                .attr("width", this.x.rangeBand())
                .attr("y", function(d) { return that.y(d.measurements); })
                .attr("height", function(d) { return that.height - that.y(d.measurements);});
    },
}

var MainController = {
    dispatcher: {
        select: {},
        remove: {},
        compare: {}
    },
    initial_reports: [],
    first_modified: null,
    init: function (reports){
        this.initial_reports = reports;
        var data_indexed = this.index(reports);

        this.map = Object.create(Map);
        this.map.init({object: this, method: this.onclick}, data_indexed.probe_cc);

        this.histogram = Object.create(Histogram);
        this.histogram.init({object: this, method: this.onclick}, data_indexed.test_name);

        this.timeline = Object.create(Timeline);
        this.timeline.init({}, data_indexed.start_time);

        this.setup_dispatcher();
        this.setup_reset_buttons();
    },
    setup_dispatcher: function(){
        // TODO: all of the dispatcher stuff needs a refactoring
        this.dispatcher.select[this.map.id] = this.select_map;
        this.dispatcher.remove[this.map.id] = this.remove_map;
        this.dispatcher.compare[this.map.id] = this.compare_map;
        this.dispatcher.select[this.histogram.id] = this.select_histogram;
        this.dispatcher.remove[this.histogram.id] = this.remove_histogram;
        this.dispatcher.compare[this.histogram.id] = this.compare_histogram;
    },
    setup_reset_buttons: function(){
        var that = this;
        $('.reset').click(function(){
            that.timeline.reset();
            that.histogram.reset();
            that.map.reset();
        });
    },
    select_map: function(country){
        // TODO: all the interactions need a refactoring
        if(this.first_modified === this.map.id && this.histogram.is_modified()){
            this.histogram.reset();
        }
        if(!this.histogram.is_modified()){
            this.first_modified = this.map.id;
        }
        this.map.select(country, true);
        var new_reports = this.select_reports(this.map.current_data[country]),
            new_data = this.index(new_reports);
        this.histogram.draw(new_data.test_name);
        this.timeline.draw(new_data.start_time);
    },
    remove_map: function(country, exclusive){
        if(this.first_modified === this.map.id && this.histogram.is_modified()){
            this.histogram.reset();
        }
        if(!this.histogram.is_modified()){
            this.first_modified = this.map.id;
        }
        this.map.remove(country, exclusive);
        var new_indexed_reports = [];
        for(cc in this.map.current_data){
            if(this.map.removed.indexOf(cc) === -1){
                new_indexed_reports = new_indexed_reports.concat(this.map.current_data[cc]);
            }
        }
        var new_reports = this.select_reports(new_indexed_reports),
            new_data= this.index(new_reports);
        this.histogram.draw(new_data.test_name);
        this.timeline.draw(new_data.start_time);
    },
    compare_map: function(country){
        this.map.select(country, false);
    },
    select_histogram: function(nettest){
        if(this.first_modified === this.histogram.id && this.map.is_modified()){
            this.map.reset();
        }
        if(!this.map.is_modified()){
            this.first_modified = this.histogram.id;
        }
        this.histogram.select(nettest, true);
        var new_reports = this.select_reports(this.histogram.current_data[nettest]),
            new_data = this.index(new_reports);
        this.map.draw(new_data.probe_cc);
        this.timeline.draw(new_data.start_time);
    },
    remove_histogram: function(nettest, exclusive){
        if(this.first_modified === this.histogram.id && this.map.is_modified()){
            this.map.reset();
        }
        if(!this.map.is_modified()){
            this.first_modified = this.histogram.id;
        }
        this.histogram.remove(nettest, exclusive);
        var new_indexed_reports = [];
        for(nettest in this.histogram.current_data){
            if(this.histogram.removed.indexOf(nettest) === -1){
                new_indexed_reports = new_indexed_reports.concat(this.histogram.current_data[nettest]);
            }
        }
        var new_reports = this.select_reports(new_indexed_reports),
            new_data = this.index(new_reports);
        this.map.draw(new_data.probe_cc);
        this.timeline.draw(new_data.start_time);
    },
    compare_histogram: function(nettest){
        this.histogram.select(nettest, false);
    },
    onclick: function(visualization, event, index)
    {
        var action_dispatcher;
        var arg;
        if(event.ctrlKey){
            if(!event.shiftKey){
                arg = true;
            }
            action_dispatcher = this.dispatcher.remove;
        }else{
            if(event.shiftKey){
                action_dispatcher = this.dispatcher.compare;
            }else{
                action_dispatcher = this.dispatcher.select;
            }
        }
        action_dispatcher[visualization].call(this, index, arg);
    },

    select_reports: function(indexed_reports)
    {
        if(indexed_reports === undefined){
            return [];
        }

        var len = indexed_reports.length,
            reports = [];

        for(var i = 0; i < len; i++){
            reports.push(this.initial_reports[indexed_reports[i]]);
        }

        return reports;
    },
    // Groups the array of reports given as input by its probe_cc and test_name field values.
    index: function(reports)
    {
        var len = reports.length,
            keys = ['probe_cc', 'test_name'],
            data_indexed = {'probe_cc': {}, 'test_name': {}, 'start_time': {}};

        if(len !== 0){
            for(var i = 0; i < len; i++){
                keys.forEach(function (key){
                    var val = reports[i][key];
                    if(Object.keys(data_indexed[key]).indexOf(val) == -1){
                        data_indexed[key][val]= [];
                    }
                    data_indexed[key][val].push(reports[i].id);
                });
            }

            var last_day = (new Date(reports[0].start_time*1000)).toDateString(),
                for_each_day = [reports[0].id];
            for(var i = 1; i < len; i++){
                var curr_day = new Date(reports[i].start_time*1000);
                if(curr_day.toDateString() === last_day){
                    for_each_day.push(reports[i].id);
                }else{
                    data_indexed.start_time[last_day] = for_each_day;
                    for_each_day = [reports[i].id];
                    last_day = curr_day.toDateString();
                }
            }
            data_indexed.start_time[last_day] = for_each_day;
        }

        return data_indexed;
    },
}

main_controller = Object.create(MainController);
main_controller.init(reports);
