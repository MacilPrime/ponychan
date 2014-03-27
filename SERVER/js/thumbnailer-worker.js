function lanczosCreate(lobes){
	return function(x){
		if (x > lobes) 
			return 0;
		x *= Math.PI;
		if (Math.abs(x) < 1e-16) 
			return 1
		var xx = x / lobes;
		return Math.sin(x) * Math.sin(xx) / x / xx;
	}
}

function process(dest_width, dest_height, orig_width, orig_height, orig_data, lobes) {
	var dest_data = new Array(dest_width * dest_height * 4);
	
	var lanczos = lanczosCreate(lobes);
	var ratio = orig_width / dest_width;
	var rcp_ratio = 2 / ratio;
	var range2 = Math.ceil(ratio * lobes / 2);
	var cacheLanc = {};
	var center = {};
	var icenter = {};
	
	for (var u = 0; u < dest_width; u++) {
		center.x = (u + 0.5) * ratio;
		icenter.x = Math.floor(center.x);
		for (var v = 0; v < dest_height; v++) {
			center.y = (v + 0.5) * ratio;
			icenter.y = Math.floor(center.y);
			var a, r, g, b, t;
			a = r = g = b = t = 0;
			for (var i = icenter.x - range2; i <= icenter.x + range2; i++) {
				if (i < 0 || i >= orig_width) 
					continue;
				var f_x = Math.floor(1000 * Math.abs(i - center.x));
				if (!cacheLanc[f_x]) 
					cacheLanc[f_x] = {};
				for (var j = icenter.y - range2; j <= icenter.y + range2; j++) {
					if (j < 0 || j >= orig_height) 
						continue;
					var f_y = Math.floor(1000 * Math.abs(j - center.y));
					if (cacheLanc[f_x][f_y] == undefined) 
						cacheLanc[f_x][f_y] = lanczos(Math.sqrt(Math.pow(f_x * rcp_ratio, 2) + Math.pow(f_y * rcp_ratio, 2)) / 1000);
					var weight = cacheLanc[f_x][f_y];
					if (weight > 0) {
						var idx = (j * orig_width + i) * 4;
						a += weight;
						r += weight * orig_data[idx];
						g += weight * orig_data[idx + 1];
						b += weight * orig_data[idx + 2];
						t += weight * orig_data[idx + 3];
					}
				}
			}
			var idx = (v * dest_width + u) * 4;
			dest_data[idx] = r / a;
			dest_data[idx + 1] = g / a;
			dest_data[idx + 2] = b / a;
			dest_data[idx + 3] = t / a;
		}
	}
	
	return dest_data;
}

self.onmessage = function(event) {
	var new_image_data = process(
		event.data.dest_width,
		event.data.dest_height,
		event.data.orig_width,
		event.data.orig_height,
		event.data.orig_data,
		event.data.lobes
	);
	postMessage({result: new_image_data});
};
