document.addEventListener("DOMContentLoaded", () => {
  const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmd-container");
  const fileSelect = document.getElementById("fileSelect");
  const loadButton = document.getElementById("loadButton");

  loadButton.addEventListener("click", async () => {
    const selectedFile = fileSelect.value;

    if (!selectedFile) {
      alert("Please select an XML file to visualize.");
      return;
    }

    try {
      const response = await fetch(selectedFile);
      const xmlText = await response.text();

      const processedXml = transformXmlForSlashes(xmlText);

      await osmd.load(processedXml);
      osmd.render();
    } catch (error) {
      console.error("Error loading or rendering the XML file:", error);
      document.getElementById("osmd-container").innerText =
        "Failed to load or render the selected XML file.";
    }
  });

  function transformXmlForSlashes(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    const parts = xmlDoc.getElementsByTagName("part");

    for (const part of parts) {
      const measures = part.getElementsByTagName("measure");
      let insideSlash = false;
      let currentClef = "treble"; // default

      for (const measure of measures) {
        // Detect clef
        const attributes = measure.getElementsByTagName("attributes");
        for (const attr of attributes) {
          const clef = attr.getElementsByTagName("clef")[0];
          if (clef) {
            const sign = clef.getElementsByTagName("sign")[0]?.textContent?.toLowerCase();
            if (sign) currentClef = sign;
          }
        }

        // Detect slash markers
        const directions = measure.getElementsByTagName("direction");
        for (const dir of directions) {
          const slash = dir.getElementsByTagName("slash")[0];
          if (slash) {
            const type = slash.getAttribute("type");
            if (type === "start") insideSlash = true;
            if (type === "stop") insideSlash = false;
          }
        }

        const styles = measure.getElementsByTagName("measure-style");
        for (const style of styles) {
          const slash = style.getElementsByTagName("slash")[0];
          if (slash) {
            const type = slash.getAttribute("type");
            if (type === "start") insideSlash = true;
            if (type === "stop") insideSlash = false;
          }
        }

        // Modify notes in slash region
        if (insideSlash) {
          const noteList = Array.from(measure.getElementsByTagName("note"));
          for (const note of noteList) {
            const pitch = note.getElementsByTagName("pitch")[0];
            const unpitched = note.getElementsByTagName("unpitched")[0];

            if (pitch || unpitched) {
              const newNote = xmlDoc.createElement("note");

              // Add correct pitch or unpitched element based on clef
              if (currentClef === "percussion") {
                const unpitched = xmlDoc.createElement("unpitched");
                const displayStep = xmlDoc.createElement("display-step");
                displayStep.textContent = "B";
                const displayOctave = xmlDoc.createElement("display-octave");
                displayOctave.textContent = "4";
                unpitched.appendChild(displayStep);
                unpitched.appendChild(displayOctave);
                newNote.appendChild(unpitched);
              } else {
                const fakePitch = xmlDoc.createElement("pitch");
                const step = xmlDoc.createElement("step");
                const octave = xmlDoc.createElement("octave");

                if (currentClef === "bass") {
                  step.textContent = "D";
                  octave.textContent = "2";
                } else {
                  step.textContent = "B";
                  octave.textContent = "4";
                }

                fakePitch.appendChild(step);
                fakePitch.appendChild(octave);
                newNote.appendChild(fakePitch);
              }

              // Preserve duration, voice, type
              const duration = note.getElementsByTagName("duration")[0];
              const voice = note.getElementsByTagName("voice")[0];
              const type = note.getElementsByTagName("type")[0];

              if (duration) newNote.appendChild(duration.cloneNode(true));
              if (voice) newNote.appendChild(voice.cloneNode(true));
              if (type) newNote.appendChild(type.cloneNode(true));

              // Add notehead
              const notehead = xmlDoc.createElement("notehead");
              notehead.textContent = "slash";
              newNote.appendChild(notehead);

              // Replace old note with slash-style note
              note.parentNode.replaceChild(newNote, note);
            }
          }
        }
      }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  }
});
