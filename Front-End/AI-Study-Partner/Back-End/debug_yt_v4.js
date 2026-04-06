import { fetchTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';
console.log('--- Inspecting fetchTranscript from direct ESM path ---');
console.log('Type:', typeof fetchTranscript);

async function run() {
    try {
        const result = await fetchTranscript('https://www.youtube.com/watch?v=aqz-KE-bpKQ'); // random small video if possible, or just check if it's a function
        console.log('fetchTranscript is a function and was called.');
    } catch (e) {
        console.log('Error calling fetchTranscript (expected if offline/invalid):', e.message);
    }
}

run();
