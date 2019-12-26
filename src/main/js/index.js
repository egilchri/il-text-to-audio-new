const funcs = require('./index-functions.js');

// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const fs = require('fs');
const util = require('util');

async function main() {
    // Creates a client
    // authentication works because of the ENV variable
    // GOOGLE_APPLICATION_CREDENTIALS

    const client = new textToSpeech.TextToSpeechClient();


    var jsonPath = process.argv.slice(2)[0];
    console.log ('jsonPath: ', jsonPath);



    var rawdata = fs.readFileSync(jsonPath);
    var parsed_json = JSON.parse (rawdata);
    var tmpFileName = 'new.mp3';
    
    if (1){
    try {
	if (fs.existsSync(tmpFileName)) {
	    fs.unlinkSync(tmpFileName);
	    //file exists
	}
    } catch(err) {
	console.error(err)
    }
    }
    await funcs.generateSpokenMP3(client, parsed_json, tmpFileName);
    // var topLevelHTMLFile = "/Users/egilchri/Desktop/ilSlideShow.html";
    // funcs.postHTMLToS3(topLevelHTMLFile, parsed_json);
    // post top level html to S3

    var doit;
    if (doit){
    // turn this off for now
    var POST_TO_S3;
    if (POST_TO_S3){
	funcs.postToS3(tmpFileName, parsed_json);
    }
    }
}

async function mainNo() {

    var lang = 'sv';
const defaults = {
    en: {name: 'en-US-Standard-B'},
    sv: {name: 'sv-SE-Wavenet-A'}
};

// https://stackoverflow.com/questions/4244896/dynamically-access-object-property-using-variable/30974910
    console.log (`Hello. sv is ${defaults['en']['name']} en is ${defaults.en.name}`);
}


main();
