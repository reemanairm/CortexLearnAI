import YoutubeTranscript from 'youtube-transcript';
console.log('--- Inspecting YoutubeTranscript ---');
console.log('Default export type:', typeof YoutubeTranscript);
if (YoutubeTranscript) {
    console.log('Default export keys:', Object.keys(YoutubeTranscript));
    if (YoutubeTranscript.YoutubeTranscript) {
        console.log('YoutubeTranscript.YoutubeTranscript found:', typeof YoutubeTranscript.YoutubeTranscript);
    }
}

async function run() {
    try {
        const mod = await import('youtube-transcript');
        console.log('--- Dynamic Import Mod ---');
        console.log('Mod keys:', Object.keys(mod));
        if (mod.default) {
            console.log('Mod default type:', typeof mod.default);
            console.log('Mod default keys:', Object.keys(mod.default));
        }
    } catch (e) {
        console.log('Error during dynamic import:', e.message);
    }
}

run();
