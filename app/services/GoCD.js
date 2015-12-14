var request = require('request'),
    async = require('async'),
    xml2js = require('xml2js')
    _ = require('lodash');

var parser = new xml2js.Parser();

module.exports = function() {
	var self = this;

    function requestBuilds(callback) {
        request({
            'url': 'http://' + self.configuration.url + '/go/cctray.xml'
            },
            function(error, response, body) {
            	callback(body);
            });
    }

    function simplifyBuild(res) {
    	var parseDate = function (dateAsString) {
            return new Date(dateAsString);
        }

        var getStatus = function(status) {
            var color = 'Gray';
            switch(status) {
                case 'Passed':
                color = 'Green';
                break;
                case 'Failed':
                color = 'Red';
                break;
                case 'Running':
                color = 'Yellow';
                break;
                default:
                color = 'Gray';
            }

            return color;
        }

        var obj = JSON.parse(res)
        var item = obj.pipelines[0].stages[0];

        var msg = obj.pipelines[0].build_cause.trigger_message;
        var name = obj.pipelines[0].name;
        var isRunning = obj.pipelines[0].can_run === false;
        var started = new Date(item.jobs[0].scheduled_date);

    	var build =  {                
    			id: name + '|' + item.id,
                project: name,
                number: item.id,
                isRunning: isRunning,
                startedAt: started,
                finishedAt: started,
                requestedFor: msg,
                status: getStatus(item.result),
                statusText: item.result,
                reason: item.approved_by,
                hasErrors: false,
                hasWarnings: false,
                url: ''
            };

        return build;
    }

    function parseBuildInfo(build, callback) {

    	var name = _.trim(build.$.name.split('::')[0]);
		request({
		    'url': 'http://' + self.configuration.url + '/go/api/pipelines/' + name + '/history'
		    },
		    function(error, response, body) {
		        callback(error, simplifyBuild(body));
		});
    }

	function queryBuilds(callback) {
            requestBuilds(function (body) {
                if (!body) {
                    callback([]);
                } else {
	                parser.parseString(body, function (err, result) {
                		async.map(result.Projects.Project, parseBuildInfo, function (err, results) {
                        	callback(results);
                    	});
				    });
                }
            });		
	}

    self.configure = function (config) {
        self.configuration = config;
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
}
