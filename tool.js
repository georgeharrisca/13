document.addEventListener("DOMContentLoaded", async () => {
  const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmd-container");

  try {
    const response = await fetch("test.musicxml");
    const xml = await response.text();
    await osmd.load(xml);
    osmd.render();
  } catch (error) {
    console.error("Error loading MusicXML:", error);
    document.getElementById("osmd-container").innerText = "Failed to load MusicXML file.";
  }
});

