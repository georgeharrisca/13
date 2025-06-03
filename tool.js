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
        // Check for <slash type="start">
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
          const notes = measure.getElementsByTagName("note");
          for (const note of notes) {
            const pitch = note.getElementsByTagName("pitch")[0];
            if (pitch) {
              // Remove <pitch>
              note.removeChild(pitch);
              // Add <rest/> as first child
              const rest = xmlDoc.createElement("rest");
              note.insertBefore(rest, note.firstChild);
              // Add <notehead>slash</notehead>
              const notehead = xmlDoc.createElement("notehead");
              notehead.textContent = "slash";
              note.appendChild(notehead);
            }
          }
        }

        // Stop slash mode at </part> (handled by loop) or <slash type="stop">
        const directionsEnd = measure.getElementsByTagName("direction");
        for (const dir of directionsEnd) {
          const slash = dir.getElementsByTagName("slash")[0];
          if (slash && slash.getAttribute("type") === "stop") {
            insideSlash = false;
          }
        }
      }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  }
});
