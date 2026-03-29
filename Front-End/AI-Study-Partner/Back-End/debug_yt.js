import YoutubeTranscript from 'youtube-transcript';
console.log('Default export type:', typeof YoutubeTranscript);
console.log('Default export keys:', Object.keys(YoutubeTranscript || {}));
if (YoutubeTranscript && YoutubeTranscript.YoutubeTranscript) {
    console.log('Found YoutubeTranscript on default export');
}
try {
    import * as allExports from 'youtube-transcript';
    console.log('All exports:', Object.keys(allExports));
} catch (e) {
    console.log('Error importing *:', e.message);
}
