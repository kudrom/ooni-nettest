// Group the array of reports given as input by its probe_cc and test_name field values.
function index(data)
{
    var groups = {'probe_cc': {}, 'test_name': {}},
        len = data.length,
        keys = ['probe_cc', 'test_name'];

    for(var i = 0; i < len; i++){
        keys.forEach(function (key){
            var val = data[i][key];
            if(Object.keys(groups[key]).indexOf(val) == -1){
                groups[key][val]= [];
            }
            groups[key][val].push(i);
        });
    }

    return groups;
}

// Returns a list of reports given the list of indexes in the reports global variable.
function get_indexed_data(index)
{

}

function draw_map(index)
{

}

function draw_histogram(index)
{

}

function draw_timeline(data)
{

}

(function (){
    var indexed = index(reports),
        countries = Object.keys(index['probe_cc']),
        nettests = Object.keys(index['test_name']);

    function redraw(){
        // Usa indexed
    }
})();
