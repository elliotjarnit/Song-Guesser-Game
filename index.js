const rapidApiKey = 'bb81e434c3mshfe9198a024e14a3p1e94bajsn07a7c17d47a2';
const deezerUrl = 'https://deezerdevs-deezer.p.rapidapi.com'
const deezerHeaders = {
    'x-rapidapi-key': rapidApiKey,
    'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
}
const deezerOptions = {
    headers: deezerHeaders
}


async function getArtistSongs(artistName) {
    try {
        const searchResponse = await fetch(`${deezerUrl}/search?q=${artistName}&limit=100`, deezerOptions);
        let searchData = await searchResponse.json();
        const artistId = searchData.data[0].artist.id;

        if (!searchData.data.length) {
            throw new Error('Artist not found');
        }

        const songs = searchData.data;

        while (searchData.next) {
            const nextUrl = searchData.next.replace('https://api.deezer.com', deezerUrl);
            const nextResponse = await fetch(nextUrl, deezerOptions);
            searchData = await nextResponse.json();
            songs.push(...searchData.data);
        }

        let artistSongs = songs.filter(song => song.artist.id === artistId);

        // Filter out remixes, mixes, live versions, etc.
        artistSongs = artistSongs.filter(song => !/\(.*mix.*\)|\(.*remix.*\)|\(.*live.*\)/i.test(song.title));

        // Filter out non-song results and map to simplified objects
        return artistSongs
            .filter(item => item.type === 'track')
            .map(song => ({
                name: song.title,
                id: song.id,
                albumName: song.album.title,
                artistName: song.artist.name,
                previewUrl: song.preview,
            }));

    } catch (error) {
        console.error('Error fetching songs:', error);
        throw error;
    }
}

function pickRandomSong(songs) {
    return songs[Math.floor(Math.random() * songs.length)];
}

function getAudio(song) {
    const previewUrl = song.previewUrl;
    return new Audio(previewUrl);
}

function pauseIfOverTime(audio, duration) {
    if (audio.currentTime > duration) {
        audio.pause();
    }
}

let listeners = [];

// Make audio duration in seconds
function cropAudio(audio, duration) {
    audio.currentTime = 0;

    audio.removeEventListener('timeupdate', listeners.pop());

    const listener = function () {
        pauseIfOverTime(audio, duration);
    };

    audio.addEventListener('timeupdate', listener);
    listeners.push(listener);

    return audio;
}
