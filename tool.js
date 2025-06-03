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
      let xml = await response.text();

      // ✅ Pre-process the XML for slash sections
      xml = convertSlashNotes(xml);

      await osmd.load(xml);
      osmd.render();
    } catch (error) {
      console.error("Error loading or rendering the XML file:", error);
      document.getElementById("osmd-container").innerText =
        "Failed to load or render the selected XML file.";
    }
  });

  function convertSlashNotes(xml) {
    let insideSlash = false;

    // Split into lines so we can scan through
    const lines = xml.split("\n");
    const updatedLines = [];

    for (let line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes("<slash") && trimmed.includes('type="start"')) {
        insideSlash = true;
        updatedLines.push(line);
        continue;
      }

      if (trimmed.includes("<slash") && trimmed.includes('type="stop"')) {
        insideSlash = false;
        updatedLines.push(line);
        continue;
      }

      if (insideSlash && trimmed.startsWith("<note>")) {
        // Start collecting the note block
        let noteBlock = [line];
        let isPitchNote = false;

        while (!line.trim().includes("</note>")) {
          line = lines.shift();
          if (line.includes("<pitch>")) isPitchNote = true;
          noteBlock.push(line);
        }

        if (isPitchNote) {
          // Replace with slash-style note
          updatedLines.push("      <note>");
          updatedLines.push("        <rest/>");
          updatedLines.push("        <duration>1</duration>");
          updatedLines.push("        <voice>1</voice>");
          updatedLines.push("        <type>quarter</type>");
          updatedLines.push("        <notehead>slash</notehead>");
          updatedLines.push("      </note>");
        } else {
          // Keep original if no pitch
          updatedLines.push(...noteBlock);
        }
      } else {
        updatedLines.push(line);
      }
    }

    return updatedLines.join("\n");
  }
});
