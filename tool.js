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

      for (const measure of measures) {
        const directions = measure.getElementsByTagName("direction");
        for (const dir of directions) {
          const slash = dir.getElementsByTagName("slash")[0];
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
            if (pitch) {
              // Build replacement slash-style note
              const newNote = xmlDoc.createElement("note");

              const rest = xmlDoc.createElement("rest");
              newNote.appendChild(rest);

              const duration = note.getElementsByTagName("duration")[0];
              const voice = note.getElementsByTagName("voice")[0];
              const type = note.getElementsByTagName("type")[0];

              if (duration) newNote.appendChild(duration.cloneNode(true));
              if (voice) newNote.appendChild(voice.cloneNode(true));
              if (type) newNote.appendChild(type.cloneNode(true));

              const notehead = xmlDoc.createElement("notehead");
              notehead.textContent = "slash";
              newNote.appendChild(notehead);

              // Replace original note in-place
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
