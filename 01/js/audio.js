let players;

Tone.Transport.bpm.value = 100;

/**
 * Sets up audio, loads loops, etc.
 *
 * @returns {!Promise} promise resolves when all audio samples have been set up.
 */
function setupAudio() {
  // Load all samples into a combined player.
  const samples = {
    descending_lead: 'samples/descending_lead.mp3',
    bass: 'samples/bass.mp3',
    upper_lead: 'samples/upper_lead.mp3',
    bass_echo_no_delay: 'samples/bass_echo_no_delay.mp3',
    walking: 'samples/down_the_hill_outside_the_scotish_national_gallery.mp3',
  };
  return new Promise(resolve => {
    players = new Tone.Players(samples, resolve);
    players.toMaster();

    players.get('descending_lead').loopEnd = 4;
    players.get('descending_lead').loop = true;
    players
      .get('descending_lead')
      .sync()
      .start(0);

    players.get('bass').loopEnd = 16;
    players.get('bass').loop = true;
    players
      .get('bass')
      .sync()
      .start(0);

    players.get('upper_lead').loopEnd = 16;
    players.get('upper_lead').loop = true;
    players
      .get('upper_lead')
      .sync()
      .start(0);

    players.get('bass_echo_no_delay').loopEnd = 16;
    players.get('bass_echo_no_delay').loop = true;
    players
      .get('bass_echo_no_delay')
      .sync()
      .start(0);

    players.get('walking').loop = true;
    players
      .get('walking')
      .sync()
      .start(0);
  });
}

/**
 * Begins audio playback.
 *
 * This should only be called after setupAudio() is complete.
 */
function playAudio() {
  Tone.Transport.start();
}
