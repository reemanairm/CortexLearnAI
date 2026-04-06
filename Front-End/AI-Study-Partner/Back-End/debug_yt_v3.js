import * as YoutubePkg from 'youtube-transcript';
console.log('--- Inspecting YoutubePkg ---');
console.log('Keys:', Object.keys(YoutubePkg));
if (YoutubePkg.default) {
    console.log('Default exists, keys:', Object.keys(YoutubePkg.default));
}
