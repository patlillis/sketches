let gui;
let players;
let leadVolume;
let leadReverb;
let bassEchoDelay;
let bassEchoVolume;

Tone.Transport.bpm.value = 100;

/**
 * Sets up audio, loads loops, etc.
 *
 * @returns {!Promise} promise resolves when all audio samples have been set up.
 */
async function setUpAudio() {
  // Load all samples into a combined player.
  const samples = {
    descending_lead: 'samples/descending_lead.mp3',
    bass: 'samples/bass.mp3',
    upper_lead: 'samples/upper_lead.mp3',
    bass_echo: 'samples/bass_echo_no_delay.mp3',
    walking: 'samples/down_the_hill_outside_the_scotish_national_gallery.mp3',
  };
  await new Promise(resolve => {
    players = new Tone.Players(samples, resolve);
  });

  const descendingLead = players.get('descending_lead');
  descendingLead.loopEnd = 4;
  descendingLead.loop = true;
  descendingLead.sync().start(0);

  const bass = players.get('bass');
  bass.loopEnd = 16;
  bass.loop = true;
  bass.sync().start(0);

  const upperLead = players.get('upper_lead');
  upperLead.loopEnd = 16;
  upperLead.loop = true;
  upperLead.sync().start(0);

  const bassEcho = players.get('bass_echo');
  bassEcho.loopEnd = 16;
  bassEcho.loop = true;
  bassEcho.sync().start(0);

  const walking = players.get('walking');
  walking.loop = true;
  walking.fadeIn = '1m';
  walking.sync().start(0);

  // Volume knob for leads.
  leadVolume = new Tone.Volume();
  descendingLead.connect(leadVolume);
  upperLead.connect(leadVolume);
  leadReverb = new Tone.Freeverb(0.8);
  leadReverb.wet.value = 0.0;
  leadVolume.chain(leadReverb, Tone.Master);

  // Delay node for bass echo.
  bassEchoDelay = new Tone.FeedbackDelay('8n.', 0.5);
  bassEchoDelay.wet.value = 0.0;
  bassEchoVolume = new Tone.Volume();
  bassEcho.chain(bassEchoDelay, bassEchoVolume, Tone.Master);

  bass.toMaster();
  walking.toMaster();

  setUpGui();
}

function setUpGui() {
  gui = new dat.GUI();

  // Descending Lead volume.
  gui
    .add({ volume: 1.0 }, 'volume', 0.0, 1.0)
    .name('lead volume')
    .onChange(setDescendingLeadVolume);

  // Bass echo delay wet.
  gui
    .add({ wet: 0.0 }, 'wet', 0.0, 1.0)
    .name('bass echo delay')
    .onChange(setBassEchoDelay);

  // Bass echo volume.
  gui
    .add({ volume: 1.0 }, 'volume', 0.0, 1.0)
    .name('bass echo volume')
    .onChange(setBassEchoVolume);
}

/**
 * Updates descending lead parameter.
 * @param {number} value Should be in range [0.0, 1.0].
 */
function setDescendingLeadVolume(value) {
  // Set volume.
  const newVolume = interpolate(0.05, 1.0, value);
  leadVolume.volume.value = Tone.gainToDb(newVolume);

  // Increase reverb as volume decreases.
  const newWet = interpolate(0.5, 0.0, value, Easing.easeOutQuint);
  console.log(`newWet: ${newWet}`);
  leadReverb.wet.value = newWet;
}

/**
 * Updates bass echo delay parameter.
 * @param {number} value Should be in range [0.0, 1.0].
 */
function setBassEchoDelay(value) {
  const newWet = interpolate(0.0, 0.5, value);
  bassEchoDelay.wet.value = newWet;
}

/**
 * Updates bass echo delay parameter.
 * @param {number} value Should be in range [0.0, 1.0].
 */
function setBassEchoVolume(value) {
  const newVolume = interpolate(0.0, 1.0, value);
  bassEchoVolume.volume.value = Tone.gainToDb(newVolume);
}

/**
 * Updates descending lead parameter.
 * @param {number} value Should be in range [0.0, 1.0].
 */
function setDescendingLeadParam(value) {
  const newVolume = interpolate(0.1, 1.0, value);
  leadVolume.volume.value = Tone.gainToDb(newVolume);
}

/**
 * Begins audio playback.
 *
 * This should only be called after setupAudio() is complete.
 */
function playAudio() {
  Tone.Transport.start();
}
