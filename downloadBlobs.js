var storageAccount = 'appsinsight2blob';
var storageAccessKey = 'Lg2iv9Qg/vrfuusHeX3jOd5h+L44g01HD1csulk7bECnSWfQQk1WRVQUAvq9x3rtxkJ6BD6ZHbfMvSzlFSQZlA==';
var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=appsinsight2blob;AccountKey=Lg2iv9Qg/vrfuusHeX3jOd5h+L44g01HD1csulk7bECnSWfQQk1WRVQUAvq9x3rtxkJ6BD6ZHbfMvSzlFSQZlA==;BlobEndpoint=https://appsinsight2blob.blob.core.windows.net/;TableEndpoint=https://appsinsight2blob.table.core.windows.net/;QueueEndpoint=https://appsinsight2blob.queue.core.windows.net/;FileEndpoint=https://appsinsight2blob.file.core.windows.net/';

var storageContainer = 'appsinsightcontainer'
var azure = require('azure-storage');
var blobSvc = azure.createBlobService(storageAccount, storageAccessKey);
var fs = require('fs');
var async = require("async");
var filename = "output.txt";

console.log("Using: " + storageAccount);
console.log("With: " + storageAccessKey);
console.log("At: " + storageConnectionString);

var blobs = [];
var flag = true;
var i = 0;

function aggregateBlobs(err, result, stream, cb) {
	if (err) {
		console.error(err);
	} else {
		console.log("Length: " + blobs.length);	
		blobs = blobs.concat(result.entries);;
		if (result.continuationToken !== null && flag) {
			console.log("Getting some more,,,");
			blobSvc.listBlobsSegmented(storageContainer, result.continuationToken, function (err, blobs) {
				aggregateBlobs(err, blobs, stream, aggregateBlobs);
			});
		} else {
			console.log("Total: " + blobs.length);
			var p = new Date();
			p.setDate(p.getDate()-7);

			async.forEachLimit(blobs, 200, function(blob, callback) {				
				if ((new Date(blob.properties["last-modified"])) > p) {
					blobSvc.getBlobToText(storageContainer, blob.name, function(err, blobContent, blob) {
						var t;
        					try {
                					t = JSON.parse(blobContent);
        					} catch (e) {
                					console.error("Parse failed: " + e);
        					}	
        					if (t) {
                					stream.write(t.availability[0].testName + ',' + Date.parse(t.availability[0].testTimestamp) + ',' + t.availability[0].durationMetric.value / 10000000+ ',' + t.availability[0].testTimestamp + "\n");
        					}	
        					t = null;
					});
				};
				async.setImmediate(function() {
					callback(null);
				});}, function(err) {
					if (err) return next(err);
				});
			}
		} 
	}


blobSvc.listBlobsSegmented(storageContainer, null, function(err, result){
	var stream = fs.createWriteStream(filename);
	aggregateBlobs(err, result, stream, function(err, blobs) {
  		if(!error){
   			console.log("No blobs");
			console.error(err);
		} else {
			console.log(blobs);
		}
	});
});

