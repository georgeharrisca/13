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
      let currentClef = "treble"; // default fallback

      for (const measure of measures) {
        // Check for clef change
        const attributes = measure.getElementsByTagName("attributes");
        for (const attr of attributes) {
          const clef = attr.getElementsByTagName("clef")[0];
          if (clef) {
            const sign = clef.getElementsByTagName("sign")[0]?.textContent?.toLowerCase();
            if (sign) currentClef = sign;
          }
        }

        // Slash detection from <direction>
        const directions = measure.getElementsByTagName("direction");
        for (const dir of directions) {
          const slash = dir.getElementsByTagName("slash")[0];
          if (slash) {
            const type = slash.getAttribute("type");
            if (type === "start") insideSlash = true;
            if (type === "stop") insideSlash = false;
          }
        }

        // Slash detection from <measure-style>
        const styles = measure.getElementsByTagName("measure-style");
        for (const style of styles) {
          const slash = style.getElementsByTagName("slash")[0];
          if (slash) {
            const type = slash.getAttribute("type");
            if (type === "start") insideSlash = true;
            if (type === "stop") insideSlash = false;
          }
        }

        if (insideSlash) {
          const noteList = Array.from(measure.getElementsByTagName("note"));
          for (const note of noteList) {
            const pitch = note.getElementsByTagName("pitch")[0];
            const unpitched = note.getElementsByTagName("unpitched")[0];

            if (pitch || unpitched) {
              const newNote = xmlDoc.createElement("note");

              // Choose pitch based on clef
              const fakePitch = xmlDoc.createElement("pitch");
              const step = xmlDoc.createElement("step");
              const octave = xmlDoc.createElement("octave");

              switch (currentClef) {
                case "percussion":
                  step.textContent = "C";
                  octave.textContent = "5"; // visually centered on single-line staff
                  break;
                case "bass":
                  step.textContent = "B";
                  octave.textContent = "2";
                  break;
                default:
                  step.textContent = "B";
                  octave.textContent = "4"; // default for treble
              }

              fakePitch.appendChild(step);
              fakePitch.appendChild(octave);
              newNote.appendChild(fakePitch);

              const duration = note.getElementsByTagName("duration")[0];
              const voice = note.getElementsByTagName("voice")[0];
              const type = note.getElementsByTagName("type")[0];

              if (duration) newNote.appendChild(duration.cloneNode(true));
              if (voice) newNote.appendChild(voice.cloneNode(true));
              if (type) newNote.appendChild(type.cloneNode(true));

              const notehead = xmlDoc.createElement("notehead");
              notehead.textContent = "slash";
              newNote.appendChild(notehead);

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
