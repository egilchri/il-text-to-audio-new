// Import other required libraries
const fs = require('fs');
const util = require('util');

var path = require('path');
var PAUSE = 2; // number of seconds to pause between paragraphs
var SPEAKING_RATE = '.75';
// Load the SDK for JavaScript
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});


const defaults = {
    en: {name: 'en-US-Standard-B'},
    sv: {name: 'sv-SE-Wavenet-A'}
};

var doIt = 1;

async function generateSpokenMP3(client, parsed_json, tmpFileName){

    var sl = parsed_json.sl;
    var sparas = parsed_json.sparas;
    var tokenizedParas = parsed_json.tokenizedParas;
    var s3ObjectName = parsed_json.s3ObjectName;

    var arrayLength = sparas.length;
    console.log (`arrayLength would have been ${arrayLength}`);
    // xarrayLength = 50;
    // arrayLength = 5;
    // process.exit();
    // remove tmpFileName if it exists

    try {
	if (fs.existsSync(tmpFileName)) {
	    fs.unlinkSync(tmpFileName);
	    //file exists
	}
    } catch(err) {
	console.error(err)
    }


    var outputDir = "/Users/egilchri/Documents/interlinea/sv-en/mp3s";
    var realSLTmpFileName = util.format('%s/%s.%s.1.mp3',
					    outputDir,
					    s3ObjectName,
					    sl
					    );

    var output = '<speak>';
    var writingCounter = 0;
    for (var i = 0; i < arrayLength; i++) {
	writingCounter++;
	let paraTextSL = sparas[i];
	// let  tokenizedPara = tokenizedParas[i];
	console.log (`paraTexSL: ${paraTextSL}`);
//	console.log (`tokenizedPara: ${tokenizedPara}`);

//	console.log (`await funcs.speakText (${client}, ${sl}, ${paraTextSL} , tmpFileName, ${writingCounter})`);
	//	console.log (`await speakText (${client}, ${tl}, ${paraTextTL} , tmpFileName, ${writingCounter})`);
	var pause = `<break time="${PAUSE}s"/>`;
	output = output + pause + paraTextSL;
    }
    output = output + '</speak>';
	
    await speakText (client, sl, output , realSLTmpFileName, SPEAKING_RATE, parsed_json);

    if (1 == 0){
	tokenizedPara.forEach(async function(word){
	    if (word){
		await speakText (client, sl, word , realSLTmpFileName , '.75', parsed_json);
	    }
	});

    }

}

async function speakText(client, languageCode, text, outputFile, myRate, parsed_json) {
    if (! myRate){
	myRate = 1;
    }
  // Creates a client
    // Construct the request
    // Found this chart of voices!
    // https://cloud.google.com/text-to-speech/docs/voices

    var voiceName = defaults[languageCode]['name'];
    
  const request = {
    input: {ssml: text},
    // Select the language and SSML Voice Gender (optional)
      voice: {languageCode: languageCode, ssmlGender: 'NEUTRAL', name: voiceName},
    // Select the type of audio encoding
      // https://github.com/googleapis/nodejs-text-to-speech/issues/22
      // voice: {languageCode: 'en-US', name: 'en-US-Wavenet-F', ssmlGender: 'FEMALE'},
      
      audioConfig: {audioEncoding: 'MP3', speakingRate: myRate},
  };

    console.log(`Audio content written to file: ${JSON.stringify (request)}`);
    if (doIt){
	try{
	// Performs the Text-to-Speech request
	const [response] = await client.synthesizeSpeech(request);
	// Write the binary audio content to a local file
//	const appendFile = util.promisify(fs.appendFile);
//	await appendFile(outputFile, response.audioContent, 'binary');
	const writeFile = util.promisify(fs.writeFile);
	await writeFile(outputFile, response.audioContent, 'binary');

	console.log(`Audio content written to file: ${outputFile}`);
	var POST_TO_S3 = 1;
	if (POST_TO_S3){
	    postToS3(outputFile, parsed_json);
	}
	}
	catch (e){
	    console.log("entering catch block");
	    console.log(e);
	    console.log("leaving catch block");
	}

    }
    else{

	console.log (`Would have synthesised speech for ${text}`);
    }
}

function postToS3(tmpFileName, parsed_json){
    
    console.log (`Posting ${tmpFileName} to S3`);
    var s3 = new AWS.S3();
    var basename = path.basename(tmpFileName);
    // right about here, how about if we upload the file to s3?
    // Something like described here
    // https://stackoverflow.com/questions/28018855/upload-a-file-to-amazon-s3-with-nodejs
    // aws works because of credentials, stored here
    // ~/.aws/credentials
    // also note: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html

    // slight objnoxious tone, but he lays it out
    https://medium.com/@mukul_jain/uploading-files-to-aws-s3-using-nodejs-2907baf710af
    var s3Bucket = parsed_json.s3Bucket;
    var readingOrder = parsed_json['readingOrder'];
    var from;
    var to;
    var fromLang;
    var toLang;
    if (readingOrder){
	from = readingOrder[0];
	to = readingOrder[1];
	fromLang = parsed_json[from];
	toLang = parsed_json[to];
    }
    else{
	from = 'sl';
	fromLang = parsed_json[from];
    }
    // var s3ObjectName = `${parsed_json.s3ObjectName}.${fromLang}-${toLang}.mp3`;
    var s3ObjectName = basename;
    console.log (`will be posted to ${s3ObjectName} in ${s3Bucket}`);

    // https://stackoverflow.com/questions/28018855/upload-a-file-to-amazon-s3-with-nodejs
    fs.readFile(tmpFileName, function (err, data) {
	if (err) { throw err; }
	var params = {Bucket:  s3Bucket, Key: s3ObjectName, Body: data, ACL: 'public-read' };
	s3.putObject(params, function(err, data) {
            if (err) {
		console.log(err)
            } else {
             console.log(`Successfully uploaded data to ${s3Bucket}/${s3ObjectName}`);
            }
      });

});


}


function postHTMLToS3(fileName, parsed_json){
    
    var s3 = new AWS.S3();
    var basename = path.basename(fileName);
    // right about here, how about if we upload the file to s3?
    // Something like described here
    // https://stackoverflow.com/questions/28018855/upload-a-file-to-amazon-s3-with-nodejs
    // aws works because of credentials, stored here
    // ~/.aws/credentials
    // also note: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html

    // slight objnoxious tone, but he lays it out
    https://medium.com/@mukul_jain/uploading-files-to-aws-s3-using-nodejs-2907baf710af
    var s3Bucket = parsed_json.s3Bucket;
    var s3ObjectName = basename;
    console.log (`will be posted to ${s3ObjectName} in ${s3Bucket}`);

    // https://stackoverflow.com/questions/28018855/upload-a-file-to-amazon-s3-with-nodejs
    fs.readFile(fileName, function (err, data) {
	if (err) { throw err; }
	var params = {Bucket:  s3Bucket, Key: s3ObjectName, Body: data, ACL: 'public-read' };
	s3.putObject(params, function(err, data) {
            if (err) {
		console.log(err)
            } else {
             console.log("Successfully uploaded data to myBucket/myKey");
            }
      });

});


}

module.exports.speakText = speakText;
module.exports.generateSpokenMP3 = generateSpokenMP3;
module.exports.postToS3 = postToS3;
module.exports.postHTMLToS3 = postHTMLToS3;

