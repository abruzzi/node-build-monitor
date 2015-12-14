var config = require('./config');

for (var i = 0; i < config.services.length; i++) {
    var serviceConfig = config.services[i],
        service = new (require('./services/' + serviceConfig.name))();
    
    service.configure(serviceConfig.configuration);
	service.check(function(res) {
		console.log(res);
	});
}
